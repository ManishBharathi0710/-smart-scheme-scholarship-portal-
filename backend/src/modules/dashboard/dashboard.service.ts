import { ProfileService, profileService } from '../profile/profile.service.js';
import {
  RecommendationService,
  recommendationService,
} from '../recommendations/recommendations.service.js';
import {
  SavedSchemesService,
  savedSchemesService,
} from '../saved-schemes/saved-schemes.service.js';
import { DashboardAggregateDto, DashboardActionItem } from './dashboard.types.js';

export class DashboardService {
  private readonly profileService: ProfileService;
  private readonly recommendationService: RecommendationService;
  private readonly savedSchemesService: SavedSchemesService;

  constructor(
    profileServiceInstance: ProfileService = profileService,
    recommendationServiceInstance: RecommendationService = recommendationService,
    savedSchemesServiceInstance: SavedSchemesService = savedSchemesService,
  ) {
    this.profileService = profileServiceInstance;
    this.recommendationService = recommendationServiceInstance;
    this.savedSchemesService = savedSchemesServiceInstance;
  }

  /**
   * Consolidated aggregate dashboard payload for authenticated citizen
   */
  public async getDashboardData(userId: string): Promise<DashboardAggregateDto> {
    // 1. Fetch profile and profile readiness in parallel
    const [profile, completion, countsResult] = await Promise.all([
      this.profileService.getProfile(userId).catch(() => null),
      this.profileService.calculateCompletion(userId).catch(() => null),
      this.recommendationService.getSummaryCounts(userId).catch(() => ({
        ELIGIBLE: 0,
        LIKELY_ELIGIBLE: 0,
        NEEDS_VERIFICATION: 0,
        NOT_ELIGIBLE: 0,
      })),
    ]);

    // 2. Fetch top recommendations (Eligible, Likely Eligible, Needs Verification)
    const recsResult = await this.recommendationService
      .getUserRecommendations(userId, {
        pageSize: 6,
      })
      .catch(() => ({ items: [], pagination: { total: 0 } }));

    // 3. Fetch closing soon recommendations
    const closingSoonResult = await this.recommendationService
      .getUserRecommendations(userId, {
        pageSize: 4,
        expiringSoon: true,
      })
      .catch(() => ({ items: [], pagination: { total: 0 } }));

    // 4. Fetch saved schemes preview
    const savedResult = await this.savedSchemesService
      .getUserSavedSchemes(userId, {
        pageSize: 4,
      })
      .catch(() => ({ items: [], pagination: { total: 0 } }));

    // 5. Construct profile summary
    const profileSummary = {
      fullName: profile?.fullName || null,
      email: null,
      state: profile?.location?.state || null,
      educationLevel: profile?.education?.educationLevel || null,
      category: profile?.social?.category || null,
      income: profile?.financial?.annualFamilyIncome || null,
      isReadyForRecommendations: completion?.isReadyForRecommendations ?? false,
      completionPercentage: completion?.overallPercentage ?? 0,
      summary:
        completion?.summary || 'Complete your citizen profile to unlock personalized benefits.',
    };

    // 6. Construct recommendation counts
    const eligibleCount = countsResult.ELIGIBLE || 0;
    const likelyEligibleCount = countsResult.LIKELY_ELIGIBLE || 0;
    const needsVerificationCount = countsResult.NEEDS_VERIFICATION || 0;
    const notEligibleCount = countsResult.NOT_ELIGIBLE || 0;
    const expiringSoonCount = closingSoonResult.pagination?.total || 0;
    const totalEvaluated =
      eligibleCount + likelyEligibleCount + needsVerificationCount + notEligibleCount;

    const recommendationSummary = {
      totalEvaluated,
      eligible: eligibleCount,
      likelyEligible: likelyEligibleCount,
      needsVerification: needsVerificationCount,
      notEligible: notEligibleCount,
      expiringSoon: expiringSoonCount,
    };

    // 7. Formulate high-priority action items
    const actionItems: DashboardActionItem[] = [];

    // Action A: Incomplete Profile
    if (!profileSummary.isReadyForRecommendations || profileSummary.completionPercentage < 80) {
      actionItems.push({
        id: 'action-complete-profile',
        type: 'PROFILE_COMPLETION',
        title: 'Complete Your Citizen Profile',
        description: `Your profile is ${profileSummary.completionPercentage}% complete. Adding education and income details enables exact statutory matching.`,
        ctaText: 'Update Profile',
        ctaLink: '/profile',
        priority: 'HIGH',
      });
    }

    // Action B: Closing Soon Deadlines
    if (expiringSoonCount > 0) {
      actionItems.push({
        id: 'action-closing-soon',
        type: 'APPLICATION_DEADLINE',
        title: `${expiringSoonCount} Scheme(s) Approaching Deadline`,
        description:
          'Applications for matching government programs are closing within 7 days. Review requirements and submit on the official portal.',
        ctaText: 'View Closing Schemes',
        ctaLink: '/recommendations?expiringSoon=true',
        priority: 'HIGH',
      });
    }

    // Action C: Verification needed
    if (needsVerificationCount > 0) {
      actionItems.push({
        id: 'action-verification-needed',
        type: 'VERIFICATION_NEEDED',
        title: `${needsVerificationCount} Scheme(s) Require Information`,
        description:
          'Certain schemes require specific profile facts such as minority status, disability, or occupation to confirm eligibility.',
        ctaText: 'Resolve Uncertain Criteria',
        ctaLink: '/recommendations?status=NEEDS_VERIFICATION',
        priority: 'MEDIUM',
      });
    }

    // Action D: Explore Catalog
    if (actionItems.length === 0) {
      actionItems.push({
        id: 'action-explore-schemes',
        type: 'EXPLORE_NEW',
        title: 'Explore Government Welfare Catalog',
        description:
          'Search hundreds of central and state scholarships, subsidies, and welfare schemes verified against gazette notifications.',
        ctaText: 'Browse Catalog',
        ctaLink: '/schemes',
        priority: 'LOW',
      });
    }

    return {
      profile: profileSummary,
      recommendationSummary,
      topRecommendations: recsResult.items || [],
      closingSoon: closingSoonResult.items || [],
      savedSchemes: {
        totalCount: savedResult.pagination?.total || 0,
        items: savedResult.items || [],
      },
      actionItems,
    };
  }
}

export const dashboardService = new DashboardService();
