import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import { DashboardData, DashboardActionItem } from '../../../types/dashboard';

export const dashboardApi = {
  /**
   * GET /dashboard - Consolidated aggregate dashboard for authenticated citizen
   */
  async getDashboard(): Promise<DashboardData> {
    const res = await apiClient.get<ApiSuccessResponse<DashboardData>>('/dashboard');
    return res.data.data;
  },

  /**
   * GET /dashboard/action-items - High priority actionable next steps
   */
  async getActionItems(): Promise<DashboardActionItem[]> {
    const res = await apiClient.get<ApiSuccessResponse<DashboardActionItem[]>>('/dashboard/action-items');
    return res.data.data;
  },
};
