import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import {
  RecommendationCard,
  RecommendationDetail,
  RecommendationFilterQuery,
  RefreshRecommendationsResult,
} from '../../../types/recommendation';

export const recommendationsApi = {
  /**
   * Retrieves paginated recommendations for current citizen
   */
  async getRecommendations(params?: RecommendationFilterQuery): Promise<{
    items: RecommendationCard[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const res = await apiClient.get<ApiSuccessResponse<RecommendationCard[]>>('/recommendations', {
      params,
    });

    const meta = res.data.meta as unknown as {
      pagination?: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    };

    return {
      items: res.data.data,
      pagination: meta?.pagination || {
        page: 1,
        pageSize: 20,
        total: res.data.data.length,
        totalPages: 1,
      },
    };
  },

  /**
   * Retrieves single recommendation detail with explainability trace
   */
  async getRecommendationDetail(id: string): Promise<RecommendationDetail> {
    const res = await apiClient.get<ApiSuccessResponse<RecommendationDetail>>(
      `/recommendations/${id}`,
    );
    return res.data.data;
  },

  /**
   * Alias for getRecommendationDetail
   */
  async getById(id: string): Promise<RecommendationDetail> {
    return this.getRecommendationDetail(id);
  },

  /**
   * Triggers fresh evaluation of citizen profile against latest scheme rules
   */
  async refreshRecommendations(): Promise<RefreshRecommendationsResult> {
    const res = await apiClient.post<ApiSuccessResponse<RefreshRecommendationsResult>>(
      '/recommendations/refresh',
    );
    return res.data.data;
  },

  /**
   * Retrieves summary counts by status
   */
  async getSummaryCounts(): Promise<Record<string, number>> {
    const res = await apiClient.get<ApiSuccessResponse<Record<string, number>>>(
      '/recommendations/summary/counts',
    );
    return res.data.data;
  },
};
