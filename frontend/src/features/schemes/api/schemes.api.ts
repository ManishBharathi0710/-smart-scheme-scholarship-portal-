import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import {
  PublicSchemeCard,
  PublicSchemeDetail,
  AdminSchemeRecord,
  SchemeFilterQuery,
  FilterMetadata,
  Department,
} from '../../../types/scheme';
import { SchemeComparisonResponse } from '../../../types/comparison';

export const schemesApi = {
  /**
   * Public Catalog: Search, filter & paginate published schemes
   */
  async getPublishedSchemes(params?: SchemeFilterQuery): Promise<{
    items: PublicSchemeCard[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const res = await apiClient.get<ApiSuccessResponse<PublicSchemeCard[]>>('/schemes', {
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
   * Public / Authenticated: Compare 1 to 4 schemes side-by-side
   */
  async compareSchemes(schemeIds: string[]): Promise<SchemeComparisonResponse> {
    const res = await apiClient.post<ApiSuccessResponse<SchemeComparisonResponse>>(
      '/schemes/compare',
      { schemeIds },
    );
    return res.data.data;
  },

  /**
   * Public Detail: Retrieve single scheme by slug or id
   */
  async getPublishedSchemeDetail(idOrSlug: string): Promise<PublicSchemeDetail> {
    const res = await apiClient.get<ApiSuccessResponse<PublicSchemeDetail>>(
      `/schemes/${idOrSlug}`,
    );
    return res.data.data;
  },

  /**
   * Public: Filter dropdown metadata
   */
  async getFilterMetadata(): Promise<FilterMetadata> {
    const res = await apiClient.get<ApiSuccessResponse<FilterMetadata>>('/schemes/meta/filters');
    return res.data.data;
  },

  /**
   * Admin: List schemes across all statuses
   */
  async getAllSchemesAdmin(params?: SchemeFilterQuery): Promise<{
    items: AdminSchemeRecord[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const res = await apiClient.get<ApiSuccessResponse<AdminSchemeRecord[]>>('/admin/schemes', {
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
   * Admin: Get full scheme record
   */
  async getSchemeByIdAdmin(id: string): Promise<AdminSchemeRecord> {
    const res = await apiClient.get<ApiSuccessResponse<AdminSchemeRecord>>(
      `/admin/schemes/${id}`,
    );
    return res.data.data;
  },

  /**
   * Admin: Create new scheme draft
   */
  async createScheme(data: Record<string, unknown>): Promise<AdminSchemeRecord> {
    const res = await apiClient.post<ApiSuccessResponse<AdminSchemeRecord>>(
      '/admin/schemes',
      data,
    );
    return res.data.data;
  },

  /**
   * Admin: Update scheme and increment version
   */
  async updateScheme(id: string, data: Record<string, unknown>): Promise<AdminSchemeRecord> {
    const res = await apiClient.put<ApiSuccessResponse<AdminSchemeRecord>>(
      `/admin/schemes/${id}`,
      data,
    );
    return res.data.data;
  },

  /**
   * Admin: Soft-delete / archive scheme
   */
  async deleteScheme(id: string): Promise<void> {
    await apiClient.delete(`/admin/schemes/${id}`);
  },

  /**
   * Workflow: Submit draft for verification
   */
  async submitForVerification(id: string): Promise<AdminSchemeRecord> {
    const res = await apiClient.post<ApiSuccessResponse<AdminSchemeRecord>>(
      `/admin/schemes/${id}/submit-verification`,
    );
    return res.data.data;
  },

  /**
   * Workflow: Verify and approve scheme
   */
  async verifyScheme(id: string, verificationNotes: string): Promise<AdminSchemeRecord> {
    const res = await apiClient.post<ApiSuccessResponse<AdminSchemeRecord>>(
      `/admin/schemes/${id}/verify`,
      { verificationNotes },
    );
    return res.data.data;
  },

  /**
   * Workflow: Reject scheme verification
   */
  async rejectVerification(id: string, rejectionReason: string): Promise<AdminSchemeRecord> {
    const res = await apiClient.post<ApiSuccessResponse<AdminSchemeRecord>>(
      `/admin/schemes/${id}/reject`,
      { rejectionReason },
    );
    return res.data.data;
  },

  /**
   * Workflow: Publish verified scheme
   */
  async publishScheme(id: string): Promise<AdminSchemeRecord> {
    const res = await apiClient.post<ApiSuccessResponse<AdminSchemeRecord>>(
      `/admin/schemes/${id}/publish`,
    );
    return res.data.data;
  },

  /**
   * Workflow: Unpublish scheme
   */
  async unpublishScheme(id: string): Promise<AdminSchemeRecord> {
    const res = await apiClient.post<ApiSuccessResponse<AdminSchemeRecord>>(
      `/admin/schemes/${id}/unpublish`,
    );
    return res.data.data;
  },

  /**
   * Workflow: Discontinue scheme
   */
  async discontinueScheme(id: string): Promise<AdminSchemeRecord> {
    const res = await apiClient.post<ApiSuccessResponse<AdminSchemeRecord>>(
      `/admin/schemes/${id}/discontinue`,
    );
    return res.data.data;
  },

  /**
   * Departments
   */
  async getDepartments(): Promise<Department[]> {
    const res = await apiClient.get<ApiSuccessResponse<Department[]>>('/departments');
    return res.data.data;
  },

  async createDepartment(data: Record<string, unknown>): Promise<Department> {
    const res = await apiClient.post<ApiSuccessResponse<Department>>('/departments', data);
    return res.data.data;
  },

  /**
   * Versions
   */
  async getSchemeVersions(id: string): Promise<unknown[]> {
    const res = await apiClient.get<ApiSuccessResponse<unknown[]>>(
      `/admin/schemes/${id}/versions`,
    );
    return res.data.data;
  },
};
