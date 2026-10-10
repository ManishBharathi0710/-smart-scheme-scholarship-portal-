export type AnalyticsTimeRange = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

export interface AnalyticsDateFilter {
  timeRange?: AnalyticsTimeRange;
  startDate?: string;
  endDate?: string;
}

export interface PlatformOverviewDto {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  users: {
    total: number;
    active: number;
    new: number;
  };
  schemes: {
    totalPublished: number;
    openForApplication: number;
    totalViews: number;
    totalSaved: number;
    officialPortalClicks: number;
  };
  recommendations: {
    totalGenerated: number;
    eligibleCount: number;
    likelyEligibleCount: number;
    needsVerificationCount: number;
    notEligibleCount: number;
  };
  documents: {
    totalUploaded: number;
    ocrProcessed: number;
    ocrSuccessRate: number;
  };
  notifications: {
    totalSent: number;
    unreadCount: number;
  };
  aiUsage: {
    totalQueries: number;
    successfulQueries: number;
    averageDurationMs: number;
  };
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
  funnel: {
    viewed: number;
    saved: number;
    officialPortalClicked: number;
  };
  conversionRates: {
    viewToSaveRate: number;
    saveToApplyClickRate: number;
    overallFunnelRate: number;
  };
  topSavedSchemes: Array<{ id: string; name: string; count: number }>;
  topViewedSchemes: Array<{ id: string; name: string; count: number }>;
  topPortalClickedSchemes: Array<{ id: string; name: string; count: number }>;
  categoryDistribution: Array<{ category: string; count: number }>;
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
  topCriteriaFailures: Array<{ condition: string; count: number }>;
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
  totalNotificationsSent: number;
  readCount: number;
  unreadCount: number;
  readRatePercentage: number;
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

export type AuditResult = 'SUCCESS' | 'FAILURE';

export interface AuditLogRecord {
  id: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  result: AuditResult;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
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

export interface AuditLogsResponse {
  items: AuditLogRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';

export interface ServiceHealthItem {
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
}

export interface DetailedSystemHealthDto {
  overallStatus: HealthStatus;
  uptimeSeconds: number;
  timestamp: string;
  services: {
    api: ServiceHealthItem;
    database: ServiceHealthItem;
    storage: ServiceHealthItem;
    ocr: ServiceHealthItem;
    ai: ServiceHealthItem;
    notifications: ServiceHealthItem;
    scheduler: ServiceHealthItem;
  };
}

export type ExportType =
  | 'PLATFORM'
  | 'USERS'
  | 'SCHEMES'
  | 'RECOMMENDATIONS'
  | 'DOCUMENTS'
  | 'NOTIFICATIONS'
  | 'AI'
  | 'AUDIT';

export type ExportFormat = 'CSV' | 'JSON';

export interface ExportRequestDto {
  exportType: ExportType;
  format: ExportFormat;
  timeRange?: AnalyticsTimeRange;
  startDate?: string;
  endDate?: string;
}
