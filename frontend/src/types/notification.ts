export type NotificationType =
  | 'SCHEME_OPENING_SOON'
  | 'SCHEME_DEADLINE_APPROACHING'
  | 'SCHEME_DEADLINE_TODAY'
  | 'SCHEME_DEADLINE_CHANGED'
  | 'SCHEME_UPDATED'
  | 'SCHEME_CLOSED'
  | 'RECOMMENDATION_AVAILABLE'
  | 'RECOMMENDATION_CHANGED'
  | 'PROFILE_INFORMATION_NEEDED'
  | 'DOCUMENT_EXPIRING'
  | 'DOCUMENT_EXPIRED'
  | 'DOCUMENT_PROCESSING_COMPLETED'
  | 'DOCUMENT_PROCESSING_FAILED'
  | 'DOCUMENT_REVIEW_REQUIRED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'SECURITY_ALERT';

export type NotificationSeverity = 'INFO' | 'IMPORTANT' | 'WARNING';

export type NotificationChannel = 'IN_APP' | 'EMAIL';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface NotificationItemData {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  channel: NotificationChannel;
  status: NotificationStatus;
  readAt: string | null;
  sentAt: string | null;
  scheduledFor: string | null;
  expiresAt: string | null;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  items: NotificationItemData[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  deadlineReminders: boolean;
  schemeUpdates: boolean;
  recommendationUpdates: boolean;
  documentAlerts: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationPreferencesInput {
  deadlineReminders?: boolean;
  schemeUpdates?: boolean;
  recommendationUpdates?: boolean;
  documentAlerts?: boolean;
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: NotificationType;
  severity?: NotificationSeverity;
}
