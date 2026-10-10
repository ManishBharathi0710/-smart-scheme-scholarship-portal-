import { savedSchemesRepository, SavedSchemesRepository } from './saved-schemes.repository.js';
import { schemesRepository } from '../schemes/schemes.repository.js';
import {
  RecommendationsRepository,
  recommendationsRepository,
} from '../recommendations/recommendations.repository.js';
import {
  SavedSchemeQuery,
  SavedSchemeCardDto,
  SaveSchemeResultDto,
  SavedSchemeIdsResultDto,
} from './saved-schemes.types.js';
import { NotFoundError } from '../../errors/app-error.js';
import { logger } from '../../utils/logger.js';

export class SavedSchemesService {
  private readonly savedRepo: SavedSchemesRepository;
  private readonly recommendationsRepo: RecommendationsRepository;

  constructor(
    savedRepo: SavedSchemesRepository = savedSchemesRepository,
    recommendationsRepo: RecommendationsRepository = recommendationsRepository,
  ) {
    this.savedRepo = savedRepo;
    this.recommendationsRepo = recommendationsRepo;
  }

  /**
   * Save / bookmark a scheme for the authenticated user
   */
  public async saveScheme(userId: string, schemeId: string): Promise<SaveSchemeResultDto> {
    // 1. Verify scheme exists and is verified/published
    const scheme = await schemesRepository.findPublishedSchemeBySlugOrId(schemeId);
    if (!scheme) {
      throw new NotFoundError('Scheme or scholarship');
    }

    // 2. Save scheme idempotently
    const savedRecord = await this.savedRepo.saveScheme(userId, scheme.id);

    logger.info({
      userId,
      schemeId: scheme.id,
      event: 'SCHEME_SAVED',
      msg: `User saved scheme: ${scheme.name}`,
    });

    return {
      saved: true,
      schemeId: scheme.id,
      savedId: savedRecord.id,
      savedAt: savedRecord.createdAt.toISOString(),
    };
  }

  /**
   * Remove a scheme from the authenticated user's saved list
   */
  public async removeSavedScheme(userId: string, schemeId: string): Promise<SaveSchemeResultDto> {
    await this.savedRepo.removeSavedScheme(userId, schemeId);

    logger.info({
      userId,
      schemeId,
      event: 'SCHEME_UNSAVED',
      msg: `User unsaved scheme: ${schemeId}`,
    });

    return {
      saved: false,
      schemeId,
    };
  }

  /**
   * Check if a scheme is saved by the user
   */
  public async getSchemeSaveStatus(
    userId: string,
    schemeId: string,
  ): Promise<{ isSaved: boolean }> {
    const isSaved = await this.savedRepo.isSchemeSaved(userId, schemeId);
    return { isSaved };
  }

  /**
   * Get list of saved scheme IDs for fast client synchronization
   */
  public async getUserSavedSchemeIds(userId: string): Promise<SavedSchemeIdsResultDto> {
    const savedSchemeIds = await this.savedRepo.findUserSavedSchemeIds(userId);
    return { savedSchemeIds };
  }

  /**
   * Total count of saved schemes for the user
   */
  public async countUserSavedSchemes(userId: string): Promise<number> {
    return this.savedRepo.countUserSavedSchemes(userId);
  }

  /**
   * Get paginated saved schemes for user, with Module 4 recommendation evaluations attached
   */
  public async getUserSavedSchemes(
    userId: string,
    query: SavedSchemeQuery,
  ): Promise<{
    items: SavedSchemeCardDto[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      items: savedRecords,
      total,
      page,
      pageSize,
      totalPages,
    } = await this.savedRepo.findUserSavedSchemes(userId, query);

    if (savedRecords.length === 0) {
      return {
        items: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 1,
        },
      };
    }

    const schemeIds = savedRecords.map((r) => r.scheme.id);
    const recommendations = await this.recommendationsRepo.findUserRecommendationsForSchemes(
      userId,
      schemeIds,
    );

    const recMap = new Map<string, (typeof recommendations)[0]>();
    for (const rec of recommendations) {
      if (!recMap.has(rec.schemeId)) {
        recMap.set(rec.schemeId, rec);
      }
    }

    const items: SavedSchemeCardDto[] = savedRecords.map((item) => {
      const s = item.scheme;
      const rec = recMap.get(s.id);

      const primaryBenefit = s.benefits[0]
        ? {
            type: s.benefits[0].benefitType,
            amount: s.benefits[0].amount ? Number(s.benefits[0].amount) : null,
            frequency: s.benefits[0].frequency,
            description: s.benefits[0].description,
          }
        : null;

      const activePeriod = s.applicationPeriods[0]
        ? {
            title: s.applicationPeriods[0].title,
            openDate: s.applicationPeriods[0].applicationOpenDate,
            closeDate: s.applicationPeriods[0].applicationCloseDate,
            status: s.applicationPeriods[0].status,
          }
        : null;

      let recInfo = null;
      if (rec) {
        const details = rec.evaluationDetails as { summary?: string } | null;
        recInfo = {
          eligibilityStatus: rec.eligibilityStatus,
          isExpiringSoon: rec.isExpiringSoon,
          matchedCount: rec.matchedCount,
          failedCount: rec.failedCount,
          unknownCount: rec.unknownCount,
          summary: details?.summary || 'Evaluated against verified eligibility rules.',
        };
      }

      return {
        savedId: item.id,
        savedAt: item.createdAt.toISOString(),
        scheme: {
          id: s.id,
          slug: s.slug,
          name: s.name,
          shortName: s.shortName,
          shortDescription: s.shortDescription,
          programType: s.programType,
          categories: s.categories,
          departmentName: s.department.name,
          stateScope: s.stateScope,
          primaryBenefit,
          activeApplicationPeriod: activePeriod,
          officialPortalUrl: s.officialApplicationUrl || s.officialSourceUrl,
        },
        recommendation: recInfo,
      };
    });

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }
}

export const savedSchemesService = new SavedSchemesService();
