import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import {
  PlatformOverviewDto,
  UserAnalyticsDto,
  SchemeAnalyticsDto,
  RecommendationAnalyticsDto,
  DocumentAnalyticsDto,
  NotificationAnalyticsDto,
  AiAnalyticsDto,
  SearchAnalyticsDto,
  AuditLogsResponse,
  AuditLogRecord,
  AuditLogQuery,
  DetailedSystemHealthDto,
  ExportRequestDto,
  AnalyticsDateFilter,
} from '../../../types/analytics';

export const analyticsApi = {
  /**
   * GET /admin/analytics/overview
   */
  async getOverview(params?: AnalyticsDateFilter): Promise<PlatformOverviewDto> {
    const res = await apiClient.get<ApiSuccessResponse<PlatformOverviewDto>>(
      '/admin/analytics/overview',
      { params }
    );
    return res.data.data;
  },

  /**
   * GET /admin/analytics/users
   */
  async getUsers(params?: AnalyticsDateFilter): Promise<UserAnalyticsDto> {
    const res = await apiClient.get<ApiSuccessResponse<UserAnalyticsDto>>(
      '/admin/analytics/users',
      { params }
    );
    return res.data.data;
  },

  /**
   * GET /admin/analytics/schemes
   */
  async getSchemes(params?: AnalyticsDateFilter): Promise<SchemeAnalyticsDto> {
    const res = await apiClient.get<ApiSuccessResponse<SchemeAnalyticsDto>>(
      '/admin/analytics/schemes',
      { params }
    );
    return res.data.data;
  },

  /**
   * GET /admin/analytics/recommendations
   */
  async getRecommendations(params?: AnalyticsDateFilter): Promise<RecommendationAnalyticsDto> {
    const res = await apiClient.get<ApiSuccessResponse<RecommendationAnalyticsDto>>(
      '/admin/analytics/recommendations',
      { params }
    );
    return res.data.data;
  },

  /**
   * GET /admin/analytics/documents
   */
  async getDocuments(params?: AnalyticsDateFilter): Promise<DocumentAnalyticsDto> {
    const res = await apiClient.get<ApiSuccessResponse<DocumentAnalyticsDto>>(
      '/admin/analytics/documents',
      { params }
    );
    return res.data.data;
  },

  /**
   * GET /admin/analytics/notifications
   */
  async getNotifications(params?: AnalyticsDateFilter): Promise<NotificationAnalyticsDto> {
    const res = await apiClient.get<ApiSuccessResponse<NotificationAnalyticsDto>>(
      '/admin/analytics/notifications',
      { params }
    );
    return res.data.data;
  },

  /**
   * GET /admin/analytics/ai
   */
  async getAi(params?: AnalyticsDateFilter): Promise<AiAnalyticsDto> {
    const res = await apiClient.get<ApiSuccessResponse<AiAnalyticsDto>>(
      '/admin/analytics/ai',
      { params }
    );
    return res.data.data;
  },

  /**
   * GET /admin/analytics/search
   */
  async getSearch(params?: AnalyticsDateFilter): Promise<SearchAnalyticsDto> {
    const res = await apiClient.get<ApiSuccessResponse<SearchAnalyticsDto>>(
      '/admin/analytics/search',
      { params }
    );
    return res.data.data;
  },

  /**
   * GET /admin/audit-logs
   */
  async getAuditLogs(params?: AuditLogQuery): Promise<AuditLogsResponse> {
    const res = await apiClient.get<ApiSuccessResponse<AuditLogsResponse>>(
      '/admin/audit-logs',
      { params }
    );
    return res.data.data;
  },

  /**
   * GET /admin/audit-logs/:id
   */
  async getAuditLogById(id: string): Promise<AuditLogRecord> {
    const res = await apiClient.get<ApiSuccessResponse<AuditLogRecord>>(
      `/admin/audit-logs/${id}`
    );
    return res.data.data;
  },

  /**
   * GET /admin/system-health
   */
  async getSystemHealth(): Promise<DetailedSystemHealthDto> {
    const res = await apiClient.get<ApiSuccessResponse<DetailedSystemHealthDto>>(
      '/admin/system-health'
    );
    return res.data.data;
  },

  /**
   * POST /admin/analytics/export
   */
  async exportData(body: ExportRequestDto): Promise<void> {
    const res = await apiClient.post('/admin/analytics/export', body, {
      responseType: 'blob',
    });

    const disposition = res.headers['content-disposition'] || '';
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : `export-${body.exportType.toLowerCase()}.${body.format.toLowerCase()}`;

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * POST /admin/analytics/events
   */
  async recordEvent(event: {
    eventType: string;
    category: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await apiClient.post('/admin/analytics/events', event);
    } catch {
      // Non-blocking telemetry tracking
    }
  },
};
