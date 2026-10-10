import {
  Notification,
  NotificationPreference,
  NotificationType,
  NotificationChannel,
} from '@prisma/client';
import { NotificationRepository } from './notifications.repository.js';
import {
  NotificationDto,
  NotificationListResponseDto,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
  NotificationQueryFilters,
  CreateNotificationParams,
} from './notifications.types.js';
import { INotificationChannel } from './channels/notification-channel.interface.js';
import { InAppNotificationChannel } from './channels/in-app.channel.js';
import { EmailNotificationChannel } from './channels/email.channel.js';
import { NotFoundError } from '../../errors/app-error.js';
import { logger } from '../../utils/logger.js';

export class NotificationService {
  private readonly inAppChannel: INotificationChannel;
  private readonly emailChannel: INotificationChannel;

  constructor(
    private readonly repository: NotificationRepository = new NotificationRepository(),
    inAppChannel?: INotificationChannel,
    emailChannel?: INotificationChannel,
  ) {
    this.inAppChannel = inAppChannel ?? new InAppNotificationChannel();
    this.emailChannel = emailChannel ?? new EmailNotificationChannel();
  }

  public async getUserNotifications(
    userId: string,
    filters: NotificationQueryFilters,
  ): Promise<NotificationListResponseDto> {
    const { items, total } = await this.repository.findMany(userId, filters);
    const unreadCount = await this.repository.countUnread(userId);

    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map((item) => this.mapToDto(item)),
      total,
      unreadCount,
      page,
      limit,
      totalPages,
    };
  }

  public async getUnreadCount(userId: string): Promise<number> {
    return this.repository.countUnread(userId);
  }

  public async markAsRead(userId: string, notificationId: string): Promise<NotificationDto> {
    const updated = await this.repository.markAsRead(notificationId, userId);
    if (!updated) {
      throw new NotFoundError(`Notification with ID '${notificationId}' not found`);
    }
    return this.mapToDto(updated);
  }

  public async markAllAsRead(userId: string): Promise<{ count: number }> {
    const count = await this.repository.markAllAsRead(userId);
    return { count };
  }

  public async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const deleted = await this.repository.softDelete(notificationId, userId);
    if (!deleted) {
      throw new NotFoundError(`Notification with ID '${notificationId}' not found`);
    }
  }

  public async getUserPreferences(userId: string): Promise<NotificationPreferencesDto> {
    let prefs = await this.repository.getPreferences(userId);
    if (!prefs) {
      prefs = await this.repository.upsertPreferences(userId, {
        deadlineReminders: true,
        schemeUpdates: true,
        recommendationUpdates: true,
        documentAlerts: true,
        emailEnabled: true,
        inAppEnabled: true,
      });
    }
    return this.mapPreferencesToDto(prefs);
  }

  public async updateUserPreferences(
    userId: string,
    updateDto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const updated = await this.repository.upsertPreferences(userId, updateDto);
    return this.mapPreferencesToDto(updated);
  }

  public async createNotification(
    params: CreateNotificationParams,
  ): Promise<NotificationDto | null> {
    const preferences = await this.getUserPreferences(params.userId);

    // 1. Check user category preferences (Security alerts cannot be suppressed)
    if (!this.isNotificationAllowedByPreferences(params.type, preferences)) {
      logger.info(
        { userId: params.userId, type: params.type },
        'Notification skipped: suppressed by citizen preference',
      );
      return null;
    }

    // 2. Check deduplication key to guarantee idempotency
    if (params.deduplicationKey) {
      const existing = await this.repository.findByDeduplicationKey(
        params.userId,
        params.deduplicationKey,
      );
      if (existing) {
        logger.info(
          { userId: params.userId, deduplicationKey: params.deduplicationKey },
          'Notification skipped: duplicate deduplication key',
        );
        return this.mapToDto(existing);
      }
    }

    // 3. Create in-app notification if inAppEnabled is true or if it's a security alert
    if (!preferences.inAppEnabled && params.type !== NotificationType.SECURITY_ALERT) {
      logger.info(
        { userId: params.userId, type: params.type },
        'In-app notification skipped: in-app channel disabled by user',
      );
      return null;
    }

    const created = await this.repository.create({
      ...params,
      channel: NotificationChannel.IN_APP,
    });

    const dto = this.mapToDto(created);

    // 4. Dispatch to InApp Channel
    await this.inAppChannel.send(dto);

    // 5. Dispatch to Email Channel if emailEnabled is true
    if (preferences.emailEnabled) {
      const userEmail = await this.repository.findUserEmail(params.userId);
      if (userEmail) {
        // Asynchronously deliver email without blocking main thread
        this.emailChannel.send(dto, { recipientEmail: userEmail }).catch((err) => {
          logger.error({ error: err }, 'Unexpected error in background email dispatch');
        });
      }
    }

    return dto;
  }

  private isNotificationAllowedByPreferences(
    type: NotificationType,
    prefs: NotificationPreferencesDto,
  ): boolean {
    if (type === NotificationType.SECURITY_ALERT || type === NotificationType.SYSTEM_ANNOUNCEMENT) {
      return true;
    }

    switch (type) {
      case NotificationType.SCHEME_OPENING_SOON:
      case NotificationType.SCHEME_DEADLINE_APPROACHING:
      case NotificationType.SCHEME_DEADLINE_TODAY:
      case NotificationType.SCHEME_DEADLINE_CHANGED:
      case NotificationType.SCHEME_CLOSED:
        return prefs.deadlineReminders;

      case NotificationType.SCHEME_UPDATED:
        return prefs.schemeUpdates;

      case NotificationType.RECOMMENDATION_AVAILABLE:
      case NotificationType.RECOMMENDATION_CHANGED:
      case NotificationType.PROFILE_INFORMATION_NEEDED:
        return prefs.recommendationUpdates;

      case NotificationType.DOCUMENT_EXPIRING:
      case NotificationType.DOCUMENT_EXPIRED:
      case NotificationType.DOCUMENT_PROCESSING_COMPLETED:
      case NotificationType.DOCUMENT_PROCESSING_FAILED:
      case NotificationType.DOCUMENT_REVIEW_REQUIRED:
        return prefs.documentAlerts;

      default:
        return true;
    }
  }

  private mapToDto(entity: Notification): NotificationDto {
    return {
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      title: entity.title,
      message: entity.message,
      severity: entity.severity,
      channel: entity.channel,
      status: entity.status,
      readAt: entity.readAt ? entity.readAt.toISOString() : null,
      sentAt: entity.sentAt ? entity.sentAt.toISOString() : null,
      scheduledFor: entity.scheduledFor ? entity.scheduledFor.toISOString() : null,
      expiresAt: entity.expiresAt ? entity.expiresAt.toISOString() : null,
      entityType: entity.entityType,
      entityId: entity.entityId,
      actionUrl: entity.actionUrl,
      metadata: entity.metadata as Record<string, unknown> | null,
      createdAt: entity.createdAt
        ? entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt)
        : new Date().toISOString(),
      updatedAt: entity.updatedAt
        ? entity.updatedAt instanceof Date
          ? entity.updatedAt.toISOString()
          : String(entity.updatedAt)
        : new Date().toISOString(),
    };
  }

  private mapPreferencesToDto(entity: NotificationPreference): NotificationPreferencesDto {
    return {
      id: entity.id,
      userId: entity.userId,
      deadlineReminders: entity.deadlineReminders,
      schemeUpdates: entity.schemeUpdates,
      recommendationUpdates: entity.recommendationUpdates,
      documentAlerts: entity.documentAlerts,
      emailEnabled: entity.emailEnabled,
      inAppEnabled: entity.inAppEnabled,
      createdAt: entity.createdAt
        ? entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt)
        : new Date().toISOString(),
      updatedAt: entity.updatedAt
        ? entity.updatedAt instanceof Date
          ? entity.updatedAt.toISOString()
          : String(entity.updatedAt)
        : new Date().toISOString(),
    };
  }
}
