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

    const items = res.data?.data ?? [];
    return {
      items,
      pagination: meta?.pagination || {
        page: 1,
        pageSize: 20,
        total: (items ?? []).length,
        totalPages: 1,
      },
    };
  },

  /**
   * Retrieves single recommendation detail with explainability trace
   */
  async getRecommendationDetail(id: string): Promise<RecommendationDetail> {
    const res = await apiClient.get<ApiSuccessResponse<Record<string, unknown>>>(
      `/recommendations/${id}`,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = res.data.data as any;
    if (!raw) return raw;

    const details = raw.evaluationDetails || {};
    const appPeriod = raw.scheme?.applicationPeriods?.[0] || raw.scheme?.applicationPeriod;
    const documents = raw.scheme?.documents || raw.scheme?.requiredDocuments || [];

    return {
      ...raw,
      explanation: raw.explanation || {
        summary: details.summary || raw.summary || '',
        matched: (details.matchedConditions || []).map(
          (c: { explanation?: string; description?: string }) => c.explanation || c.description || ''
        ),
        failed: (details.failedConditions || []).map(
          (c: { explanation?: string; description?: string }) => c.explanation || c.description || ''
        ),
        unknown: (details.unknownConditions || []).map(
          (c: { explanation?: string; description?: string }) => c.explanation || c.description || ''
        ),
        conditions: [
          ...(details.matchedConditions || []),
          ...(details.failedConditions || []),
          ...(details.unknownConditions || []),
        ],
        matchedConditions: details.matchedConditions || [],
        failedConditions: details.failedConditions || [],
        unknownConditions: details.unknownConditions || [],
      },
      missingInformation: raw.missingInformation || details.missingInformation || [],
      schemeVersion: raw.schemeVersion || {
        id: raw.schemeVersionId || '',
        versionNumber: raw.schemeVersionNumber || 1,
        changeSummary: null,
        validFrom: raw.evaluatedAt || new Date().toISOString(),
      },
      scheme: {
        ...raw.scheme,
        programType: raw.scheme?.programType || raw.programType || 'WELFARE_SCHEME',
        department: raw.scheme?.department || raw.departmentName || 'Government Department',
        officialPortalUrl:
          raw.scheme?.officialApplicationUrl ||
          raw.scheme?.officialSourceUrl ||
          raw.scheme?.officialPortalUrl ||
          null,
        requiredDocuments: documents.map(
          (d: { id: string; name: string; mandatory?: boolean; description?: string; notes?: string }) => ({
            id: d.id,
            name: d.name,
            mandatory: d.mandatory ?? true,
            description: d.description || d.notes || null,
          })
        ),
        applicationPeriod: {
          applicationOpenDate: appPeriod?.openDate || appPeriod?.applicationOpenDate || null,
          applicationCloseDate: appPeriod?.closeDate || appPeriod?.applicationCloseDate || raw.deadline || null,
        },
      },
    } as RecommendationDetail;
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
