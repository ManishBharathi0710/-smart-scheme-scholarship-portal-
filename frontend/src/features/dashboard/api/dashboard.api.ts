import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import { DashboardData, DashboardActionItem } from '../../../types/dashboard';
import { SavedSchemeCard } from '../../../types/saved-scheme';

export const dashboardApi = {
  /**
   * GET /dashboard - Consolidated aggregate dashboard for authenticated citizen
   */
  async getDashboard(): Promise<DashboardData> {
    const res = await apiClient.get<ApiSuccessResponse<DashboardData>>('/dashboard');
    const raw = res.data?.data;
    const rawSaved = raw?.savedSchemes as
      | { total?: number; totalCount?: number; preview?: SavedSchemeCard[]; items?: SavedSchemeCard[] }
      | undefined;
    const savedPreview: SavedSchemeCard[] = rawSaved?.preview ?? rawSaved?.items ?? [];
    const savedTotal = rawSaved?.total ?? rawSaved?.totalCount ?? savedPreview.length;

    return {
      profile: raw?.profile ?? {
        fullName: null,
        email: null,
        state: null,
        educationLevel: null,
        category: null,
        income: null,
        isReadyForRecommendations: false,
        completionPercentage: 0,
        summary: 'Complete your profile to discover eligible schemes.',
      },
      recommendationSummary: raw?.recommendationSummary ?? {
        totalEvaluated: 0,
        eligible: 0,
        likelyEligible: 0,
        needsVerification: 0,
        notEligible: 0,
        expiringSoon: 0,
      },
      topRecommendations: raw?.topRecommendations ?? [],
      closingSoon: raw?.closingSoon ?? [],
      savedSchemes: {
        total: savedTotal,
        totalCount: savedTotal,
        preview: savedPreview,
        items: savedPreview,
      },
      actionItems: raw?.actionItems ?? [],
      generatedAt: raw?.generatedAt ?? new Date().toISOString(),
    };
  },

  /**
   * GET /dashboard/action-items - High priority actionable next steps
   */
  async getActionItems(): Promise<DashboardActionItem[]> {
    const res = await apiClient.get<ApiSuccessResponse<DashboardActionItem[]>>('/dashboard/action-items');
    return res.data?.data ?? [];
  },
};
