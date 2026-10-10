import {
  NotificationType,
  NotificationSeverity,
  NotificationChannel,
  NotificationStatus,
} from '@prisma/client';

export { NotificationType, NotificationSeverity, NotificationChannel, NotificationStatus };

export interface NotificationDto {
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

export interface NotificationListResponseDto {
  items: NotificationDto[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadCountResponseDto {
  count: number;
}

export interface NotificationPreferencesDto {
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

export interface UpdateNotificationPreferencesDto {
  deadlineReminders?: boolean;
  schemeUpdates?: boolean;
  recommendationUpdates?: boolean;
  documentAlerts?: boolean;
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
}

export interface NotificationQueryFilters {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: NotificationType;
  severity?: NotificationSeverity;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  channel?: NotificationChannel;
  scheduledFor?: Date;
  expiresAt?: Date;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  deduplicationKey?: string;
}

export interface ChannelDeliveryResult {
  channel: NotificationChannel;
  success: boolean;
  deliveredAt?: Date;
  error?: string;
}

export interface EmailMessagePayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  notificationId: string;
}

export interface SchemeDeadlineEvent {
  schemeId: string;
  schemeName: string;
  schemeSlug: string;
  deadlineDate: Date;
  daysRemaining: number;
}

export interface SchemeUpdatedEvent {
  schemeId: string;
  schemeName: string;
  schemeSlug: string;
  changeSummary: string;
  versionNumber: number;
}

export interface DocumentEventPayload {
  userId: string;
  documentId: string;
  documentType: string;
  originalFileName: string;
  type:
    | 'DOCUMENT_PROCESSING_COMPLETED'
    | 'DOCUMENT_PROCESSING_FAILED'
    | 'DOCUMENT_REVIEW_REQUIRED'
    | 'DOCUMENT_EXPIRING'
    | 'DOCUMENT_EXPIRED';
  expiresAt?: Date;
  daysRemaining?: number;
  errorMessage?: string;
}

export interface RecommendationEventPayload {
  userId: string;
  schemeId: string;
  schemeName: string;
  schemeSlug: string;
  type: 'RECOMMENDATION_AVAILABLE' | 'RECOMMENDATION_CHANGED' | 'PROFILE_INFORMATION_NEEDED';
  status?: string;
  reason?: string;
}
