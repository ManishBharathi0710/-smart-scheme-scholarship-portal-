import { apiClient } from '../lib/api-client';
import { ApiSuccessResponse, HealthCheckData } from '../types/api';

export const healthService = {
  async getHealth(): Promise<HealthCheckData> {
    const response = await apiClient.get<ApiSuccessResponse<HealthCheckData>>('/health');
    return response.data.data;
  },

  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    const response = await apiClient.get<ApiSuccessResponse<{ status: string; timestamp: string }>>(
      '/health/live',
    );
    return response.data.data;
  },

  async getReadiness(): Promise<{ ready: boolean; database: string; timestamp: string }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ ready: boolean; database: string; timestamp: string }>
    >('/health/ready');
    return response.data.data;
  },
};
