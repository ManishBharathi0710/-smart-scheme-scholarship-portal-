import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import {
  SavedSchemeCard,
  SaveSchemeResult,
  SavedSchemeIdsResult,
} from '../../../types/saved-scheme';

export interface SavedSchemesQueryParams {
  page?: number;
  pageSize?: number;
  category?: string;
  programType?: string;
  applicationStatus?: string;
}

export const savedSchemesApi = {
  /**
   * GET /saved-schemes - List saved schemes with pagination
   */
  async getSavedSchemes(params?: SavedSchemesQueryParams): Promise<{
    items: SavedSchemeCard[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const res = await apiClient.get<ApiSuccessResponse<SavedSchemeCard[]>>('/saved-schemes', {
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
   * POST /saved-schemes/:schemeId - Bookmark scheme
   */
  async saveScheme(schemeId: string): Promise<SaveSchemeResult> {
    const res = await apiClient.post<ApiSuccessResponse<SaveSchemeResult>>(
      `/saved-schemes/${schemeId}`,
    );
    return res.data.data;
  },

  /**
   * DELETE /saved-schemes/:schemeId - Remove scheme from bookmarks
   */
  async removeSavedScheme(schemeId: string): Promise<SaveSchemeResult> {
    const res = await apiClient.delete<ApiSuccessResponse<SaveSchemeResult>>(
      `/saved-schemes/${schemeId}`,
    );
    return res.data.data;
  },

  /**
   * GET /saved-schemes/ids - Quick ID list for sync
   */
  async getSavedSchemeIds(): Promise<SavedSchemeIdsResult> {
    const res = await apiClient.get<ApiSuccessResponse<SavedSchemeIdsResult>>('/saved-schemes/ids');
    return res.data.data;
  },

  /**
   * GET /saved-schemes/:schemeId/status - Check if specific scheme is saved
   */
  async getSchemeSaveStatus(schemeId: string): Promise<{ saved: boolean; schemeId: string }> {
    const res = await apiClient.get<ApiSuccessResponse<{ saved: boolean; schemeId: string }>>(
      `/saved-schemes/${schemeId}/status`,
    );
    return res.data.data;
  },
};
