import { AnalyticsCategory, AuditResult } from '@prisma/client';

export type AnalyticsTimeRange = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

export interface AnalyticsDateFilter {
  timeRange?: AnalyticsTimeRange;
  startDate?: string;
  endDate?: string;
}

export interface PlatformOverviewDto {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  publishedSchemes: number;
  openApplications: number;
  recommendationsGenerated: number;
  documentsUploaded: number;
  ocrRequests: number;
  notificationsSent: number;
  aiRequests: number;
}

export interface UserAnalyticsDto {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  registrationsTrend: Array<{ date: string; count: number }>;
  activeUsersTrend: Array<{ date: string; count: number }>;
  profileCompletionBuckets: {
    '0_25': number;
    '26_50': number;
    '51_75': number;
    '76_99': number;
    '100': number;
  };
  usersWithRecommendations: number;
  usersWithSavedSchemes: number;
  usersWithDocuments: number;
  usersWithAiChats: number;
}

export interface SchemeAnalyticsDto {
  totalPublished: number;
  openApplications: number;
  totalViews: number;
  totalSaves: number;
  totalComparisons: number;
  officialPortalClicks: number;
  funnel: {
    views: number;
    saves: number;
    officialPortalClicks: number;
    viewToSaveRate: number;
    saveToPortalClickRate: number;
  };
  topViewedSchemes: Array<{ id: string; name: string; views: number }>;
  topSavedSchemes: Array<{ id: string; name: string; saves: number }>;
  topPortalClickedSchemes: Array<{ id: string; name: string; clicks: number }>;
}

export interface RecommendationAnalyticsDto {
  totalEvaluations: number;
  distribution: {
    eligible: number;
    likelyEligible: number;
    needsVerification: number;
    notEligible: number;
  };
  distributionPercentages: {
    eligible: number;
    likelyEligible: number;
    needsVerification: number;
    notEligible: number;
  };
  frequentlyUnmetConditions: Array<{ condition: string; count: number }>;
}

export interface DocumentAnalyticsDto {
  totalUploaded: number;
  totalProcessed: number;
  ocrRequests: number;
  ocrSuccessRate: number;
  ocrFailureRate: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  documentTypesBreakdown: Array<{ type: string; count: number }>;
  expiredDocumentsCount: number;
}

export interface NotificationAnalyticsDto {
  totalCreated: number;
  totalSent: number;
  totalRead: number;
  readRate: number;
  typeBreakdown: Array<{ type: string; count: number }>;
  channelBreakdown: Array<{ channel: string; count: number }>;
}

export interface AiAnalyticsDto {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageDurationMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  intentDistribution: Array<{ intent: string; count: number }>;
  safetyEvents: {
    promptInjectionsBlocked: number;
    validationContradictionsPrevented: number;
  };
}

export interface SearchAnalyticsDto {
  totalSearches: number;
  zeroResultSearchesCount: number;
  zeroResultQueries: Array<{ query: string; count: number }>;
  popularSearchTerms: Array<{ term: string; count: number }>;
}

export interface SystemHealthServiceStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  latencyMs?: number;
  details?: string;
}

export interface SystemHealthDto {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  uptimeSeconds: number;
  timestamp: string;
  services: {
    api: SystemHealthServiceStatus;
    database: SystemHealthServiceStatus;
    storage: SystemHealthServiceStatus;
    ocr: SystemHealthServiceStatus;
    ai: SystemHealthServiceStatus;
    notifications: SystemHealthServiceStatus;
    scheduler: SystemHealthServiceStatus;
  };
  performance: {
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    errorRatePercentage: number;
  };
}

export interface AuditLogQuery {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  result?: AuditResult;
  requestId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogRecordDto {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  result: AuditResult;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
}

export type ExportFormat = 'CSV' | 'JSON';
export type ExportType =
  | 'PLATFORM'
  | 'USERS'
  | 'SCHEMES'
  | 'RECOMMENDATIONS'
  | 'DOCUMENTS'
  | 'NOTIFICATIONS'
  | 'AI'
  | 'AUDIT';

export interface ExportRequestDto {
  exportType: ExportType;
  format: ExportFormat;
  timeRange?: AnalyticsTimeRange;
  startDate?: string;
  endDate?: string;
}

export interface CreateEventParams {
  eventType: string;
  category: AnalyticsCategory;
  actorType?: string;
  actorId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  sessionId?: string | null;
  requestId?: string | null;
}

export interface CreateAuditLogParams {
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  result?: AuditResult;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown> | null;
}
