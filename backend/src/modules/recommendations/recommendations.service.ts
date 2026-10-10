import { RecommendationApplicationStatus } from '@prisma/client';
import { RecommendationsRepository } from './recommendations.repository.js';
import { schemesService } from '../schemes/schemes.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { RuleEngineService } from './engine/rule-engine.service.js';
import { ValueNormalizer } from './engine/value-normalizer.js';
import {
  RecommendationListQuery,
  RecommendationCardDto,
  RecommendationDetailDto,
  RefreshRecommendationsResult,
} from './recommendations.types.js';
import {
  EXPIRING_SOON_THRESHOLD_DAYS,
  ELIGIBILITY_SORT_WEIGHT,
  APPLICATION_STATUS_SORT_WEIGHT,
} from './recommendations.constants.js';
import {
  FullRecommendationEvaluation,
  MissingInformationItem,
  SingleConditionEvaluation,
} from './engine/types.js';
import { NotFoundError, AppError } from '../../errors/app-error.js';
import { logger } from '../../utils/logger.js';

export class RecommendationService {
  private readonly recommendationsRepo: RecommendationsRepository;
  private readonly profileService: ProfileService;

  constructor(
    recommendationsRepo: RecommendationsRepository = new RecommendationsRepository(),
    profileServiceInstance: ProfileService = new ProfileService(),
  ) {
    this.recommendationsRepo = recommendationsRepo;
    this.profileService = profileServiceInstance;
  }

  /**
   * Retrieves paginated recommendations for the authenticated citizen.
   * If recommendations have never been computed for this user, automatically runs an initial refresh.
   */
  public async getUserRecommendations(
    userId: string,
    query: RecommendationListQuery,
  ): Promise<{
    items: RecommendationCardDto[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    let result = await this.recommendationsRepo.findUserRecommendations(userId, query);

    // Auto-compute recommendations if this user has no evaluations yet
    if (result.total === 0 && !query.status && !query.programType && !query.category) {
      try {
        const profile = await this.profileService.getProfile(userId);
        if (profile) {
          await this.refreshUserRecommendations(userId);
          result = await this.recommendationsRepo.findUserRecommendations(userId, query);
        }
      } catch {
        // If profile doesn't exist, proceed with empty results gracefully
      }
    }

    // Map to RecommendationCardDto
    const mappedItems: RecommendationCardDto[] = result.items.map((r) => {
      const details = r.evaluationDetails as unknown as {
        summary: string;
        missingInformation: MissingInformationItem[];
        matchedConditions: SingleConditionEvaluation[];
        failedConditions: SingleConditionEvaluation[];
        unknownConditions: SingleConditionEvaluation[];
      };

      const primaryBenefit = r.scheme.benefits[0];
      const activePeriod =
        r.scheme.applicationPeriods.find((p) => p.status === 'OPEN') ||
        r.scheme.applicationPeriods[0];

      return {
        id: r.id,
        schemeId: r.schemeId,
        schemeName: r.scheme.name,
        slug: r.scheme.slug,
        shortDescription: r.scheme.shortDescription,
        programType: r.scheme.programType,
        categories: r.scheme.categories,
        departmentName: r.scheme.department.name,
        stateScope: r.scheme.stateScope,
        primaryBenefit: primaryBenefit
          ? {
              type: primaryBenefit.benefitType,
              amount: primaryBenefit.amount ? Number(primaryBenefit.amount) : null,
              frequency: primaryBenefit.frequency,
              description: primaryBenefit.description,
            }
          : null,
        eligibilityStatus: r.eligibilityStatus,
        applicationStatus: r.applicationStatus,
        isExpiringSoon: r.isExpiringSoon,
        deadline: activePeriod?.applicationCloseDate
          ? activePeriod.applicationCloseDate.toISOString()
          : null,
        matchedCount: r.matchedCount,
        failedCount: r.failedCount,
        unknownCount: r.unknownCount,
        summary: details?.summary || 'Statutory evaluation completed.',
        missingFields: (details?.missingInformation || []).map((m) => m.label),
        schemeVersionNumber: r.schemeVersion.versionNumber,
        evaluatedAt: r.evaluatedAt.toISOString(),
      };
    });

    // Deterministic Sort according to Section 48 & 95
    mappedItems.sort((a, b) => {
      // 1. Eligibility status
      const aElig = ELIGIBILITY_SORT_WEIGHT[a.eligibilityStatus] || 99;
      const bElig = ELIGIBILITY_SORT_WEIGHT[b.eligibilityStatus] || 99;
      if (aElig !== bElig) return aElig - bElig;

      // 2. Application availability
      const aApp = APPLICATION_STATUS_SORT_WEIGHT[a.applicationStatus] || 99;
      const bApp = APPLICATION_STATUS_SORT_WEIGHT[b.applicationStatus] || 99;
      if (aApp !== bApp) return aApp - bApp;

      // 3. Expiring soon priority for open schemes
      if (a.isExpiringSoon && !b.isExpiringSoon) return -1;
      if (!a.isExpiringSoon && b.isExpiringSoon) return 1;

      // 4. Stable tie-breaker
      return a.schemeName.localeCompare(b.schemeName);
    });

    return {
      items: mappedItems,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Retrieves single recommendation detail with complete explainability breakdown.
   * Enforces strict user isolation.
   */
  public async getRecommendationDetail(
    id: string,
    userId: string,
  ): Promise<RecommendationDetailDto> {
    const r = await this.recommendationsRepo.findRecommendationById(id, userId);
    if (!r) {
      throw new NotFoundError('Recommendation record not found or access denied.');
    }

    const details = r.evaluationDetails as unknown as {
      summary: string;
      matchedConditions: SingleConditionEvaluation[];
      failedConditions: SingleConditionEvaluation[];
      unknownConditions: SingleConditionEvaluation[];
      missingInformation: MissingInformationItem[];
      rulesEvaluated: number;
    };

    const primaryBenefit = r.scheme.benefits[0];
    const activePeriod =
      r.scheme.applicationPeriods.find((p) => p.status === 'OPEN') ||
      r.scheme.applicationPeriods[0];

    return {
      id: r.id,
      schemeId: r.schemeId,
      schemeName: r.scheme.name,
      slug: r.scheme.slug,
      shortDescription: r.scheme.shortDescription,
      programType: r.scheme.programType,
      categories: r.scheme.categories,
      departmentName: r.scheme.department.name,
      stateScope: r.scheme.stateScope,
      primaryBenefit: primaryBenefit
        ? {
            type: primaryBenefit.benefitType,
            amount: primaryBenefit.amount ? Number(primaryBenefit.amount) : null,
            frequency: primaryBenefit.frequency,
            description: primaryBenefit.description,
          }
        : null,
      eligibilityStatus: r.eligibilityStatus,
      applicationStatus: r.applicationStatus,
      isExpiringSoon: r.isExpiringSoon,
      deadline: activePeriod?.applicationCloseDate
        ? activePeriod.applicationCloseDate.toISOString()
        : null,
      matchedCount: r.matchedCount,
      failedCount: r.failedCount,
      unknownCount: r.unknownCount,
      summary: details?.summary || 'Statutory evaluation completed.',
      missingFields: (details?.missingInformation || []).map((m) => m.label),
      schemeVersionNumber: r.schemeVersion.versionNumber,
      evaluatedAt: r.evaluatedAt.toISOString(),
      evaluationDetails: {
        summary: details.summary,
        matchedConditions: details.matchedConditions || [],
        failedConditions: details.failedConditions || [],
        unknownConditions: details.unknownConditions || [],
        missingInformation: details.missingInformation || [],
        rulesEvaluated: details.rulesEvaluated || 0,
      },
      scheme: {
        id: r.scheme.id,
        name: r.scheme.name,
        slug: r.scheme.slug,
        description: r.scheme.description,
        officialSourceUrl: r.scheme.officialSourceUrl,
        officialApplicationUrl: r.scheme.officialApplicationUrl,
        applicationMethod: r.scheme.applicationMethod,
        applicationInstructions: r.scheme.applicationInstructions,
        benefits: r.scheme.benefits.map((b) => ({
          id: b.id,
          type: b.benefitType,
          amount: b.amount ? Number(b.amount) : null,
          frequency: b.frequency,
          duration: b.duration,
          description: b.description,
        })),
        documents: r.scheme.documents.map((d) => ({
          id: d.id,
          documentType: d.documentType,
          name: d.name,
          mandatory: d.mandatory,
          description: d.description,
          notes: d.notes,
        })),
        applicationPeriods: r.scheme.applicationPeriods.map((p) => ({
          id: p.id,
          title: p.title,
          openDate: p.applicationOpenDate ? p.applicationOpenDate.toISOString() : null,
          closeDate: p.applicationCloseDate ? p.applicationCloseDate.toISOString() : null,
          status: p.status,
          instructions: p.instructions,
        })),
      },
      disclaimer:
        'Eligibility shown here is based on the profile information you provided and statutory rules currently recorded for this scheme. Final eligibility, verification, approval, and benefit disbursement are determined exclusively by the concerned government authority. Please verify all notifications on the official authorized portal.',
    };
  }

  /**
   * Refreshes recommendation evaluations for the citizen profile against all published schemes.
   */
  public async refreshUserRecommendations(userId: string): Promise<RefreshRecommendationsResult> {
    const profile = await this.profileService.getProfile(userId);
    if (!profile) {
      throw new AppError(
        'Citizen profile must be created before recommendations can be evaluated.',
        400,
        'PROFILE_NOT_FOUND',
      );
    }

    // 1. Normalize facts deterministically
    const normalizedFacts = ValueNormalizer.normalizeUserProfile(profile);

    // 2. Retrieve published schemes contract
    const schemesToEvaluate = await schemesService.getSchemesForRecommendation();

    const evaluations: FullRecommendationEvaluation[] = [];
    let eligibleCount = 0;
    let likelyEligibleCount = 0;
    let needsVerificationCount = 0;
    let notEligibleCount = 0;

    const now = new Date();

    for (const scheme of schemesToEvaluate) {
      // 3. Evaluate rules via pure RuleEngineService
      const evalResult = RuleEngineService.evaluate(scheme.rules, normalizedFacts);

      // 4. Determine application deadline and status
      let appStatus: RecommendationApplicationStatus = 'CLOSED';
      let isExpiringSoon = false;

      if (scheme.activePeriod) {
        const { closeDate, status } = scheme.activePeriod;

        if (status === 'OPEN') {
          appStatus = 'OPEN';
          if (closeDate) {
            const diffMs = new Date(closeDate).getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
            if (diffDays >= 0 && diffDays <= EXPIRING_SOON_THRESHOLD_DAYS) {
              isExpiringSoon = true;
            }
            if (diffMs < 0) {
              appStatus = 'CLOSED';
            }
          }
        } else if (status === 'UPCOMING') {
          appStatus = 'UPCOMING';
        } else {
          appStatus = 'CLOSED';
        }
      }

      // Track counts
      switch (evalResult.eligibilityStatus) {
        case 'ELIGIBLE':
          eligibleCount++;
          break;
        case 'LIKELY_ELIGIBLE':
          likelyEligibleCount++;
          break;
        case 'NEEDS_VERIFICATION':
          needsVerificationCount++;
          break;
        case 'NOT_ELIGIBLE':
          notEligibleCount++;
          break;
      }

      evaluations.push({
        schemeId: scheme.schemeId,
        schemeName: scheme.name,
        slug: scheme.slug,
        schemeVersionId: scheme.versionId,
        versionNumber: scheme.versionNumber,
        eligibilityStatus: evalResult.eligibilityStatus,
        applicationStatus: appStatus,
        isExpiringSoon,
        matchedCount: evalResult.matchedCount,
        failedCount: evalResult.failedCount,
        unknownCount: evalResult.unknownCount,
        evaluationDetails: {
          summary: evalResult.summary,
          matchedConditions: evalResult.matchedConditions,
          failedConditions: evalResult.failedConditions,
          unknownConditions: evalResult.unknownConditions,
          missingInformation: evalResult.missingInformation,
          rulesEvaluated: evalResult.rulesEvaluated,
        },
      });
    }

    // 5. Batch save into database
    await this.recommendationsRepo.saveBatchRecommendations(userId, evaluations);

    logger.info({
      event: 'RECOMMENDATIONS_REFRESHED',
      userId,
      schemesCount: evaluations.length,
      eligibleCount,
      likelyEligibleCount,
      needsVerificationCount,
      notEligibleCount,
      msg: `Recommendations refreshed for user ${userId}`,
    });

    return {
      totalSchemesEvaluated: evaluations.length,
      eligibleCount,
      likelyEligibleCount,
      needsVerificationCount,
      notEligibleCount,
      refreshedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieves summary counts by status for user dashboard
   */
  public async getSummaryCounts(userId: string) {
    return this.recommendationsRepo.countByStatus(userId);
  }
}

export const recommendationService = new RecommendationService();
