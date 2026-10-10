import {
  PrismaClient,
  Notification,
  NotificationPreference,
  NotificationStatus,
  NotificationSeverity,
  NotificationChannel,
  Prisma,
} from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import {
  NotificationQueryFilters,
  CreateNotificationParams,
  UpdateNotificationPreferencesDto,
} from './notifications.types.js';

export class NotificationRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  public async findMany(
    userId: string,
    filters: NotificationQueryFilters,
  ): Promise<{ items: Notification[]; total: number }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      deletedAt: null,
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.severity && { severity: filters.severity }),
    };

    const [items, total] = await Promise.all([
      this.db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.notification.count({ where }),
    ]);

    return { items, total };
  }

  public async countUnread(userId: string): Promise<number> {
    return this.db.notification.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
        deletedAt: null,
      },
    });
  }

  public async findById(notificationId: string, userId: string): Promise<Notification | null> {
    return this.db.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        deletedAt: null,
      },
    });
  }

  public async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const existing = await this.findById(notificationId, userId);
    if (!existing) {
      return null;
    }

    return this.db.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  public async markAllAsRead(userId: string): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
        deletedAt: null,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
    return result.count;
  }

  public async softDelete(notificationId: string, userId: string): Promise<Notification | null> {
    const existing = await this.findById(notificationId, userId);
    if (!existing) {
      return null;
    }

    return this.db.notification.update({
      where: { id: notificationId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  public async create(params: CreateNotificationParams): Promise<Notification> {
    return this.db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        severity: params.severity ?? NotificationSeverity.INFO,
        channel: params.channel ?? NotificationChannel.IN_APP,
        status: NotificationStatus.UNREAD,
        scheduledFor: params.scheduledFor ?? null,
        expiresAt: params.expiresAt ?? null,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        actionUrl: params.actionUrl ?? null,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        deduplicationKey: params.deduplicationKey ?? null,
      },
    });
  }

  public async findByDeduplicationKey(
    userId: string,
    deduplicationKey: string,
  ): Promise<Notification | null> {
    return this.db.notification.findFirst({
      where: {
        userId,
        deduplicationKey,
      },
    });
  }

  public async getPreferences(userId: string): Promise<NotificationPreference | null> {
    return this.db.notificationPreference.findUnique({
      where: { userId },
    });
  }

  public async upsertPreferences(
    userId: string,
    data: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreference> {
    return this.db.notificationPreference.upsert({
      where: { userId },
      update: {
        ...(data.deadlineReminders !== undefined && { deadlineReminders: data.deadlineReminders }),
        ...(data.schemeUpdates !== undefined && { schemeUpdates: data.schemeUpdates }),
        ...(data.recommendationUpdates !== undefined && {
          recommendationUpdates: data.recommendationUpdates,
        }),
        ...(data.documentAlerts !== undefined && { documentAlerts: data.documentAlerts }),
        ...(data.emailEnabled !== undefined && { emailEnabled: data.emailEnabled }),
        ...(data.inAppEnabled !== undefined && { inAppEnabled: data.inAppEnabled }),
      },
      create: {
        userId,
        deadlineReminders: data.deadlineReminders ?? true,
        schemeUpdates: data.schemeUpdates ?? true,
        recommendationUpdates: data.recommendationUpdates ?? true,
        documentAlerts: data.documentAlerts ?? true,
        emailEnabled: data.emailEnabled ?? true,
        inAppEnabled: data.inAppEnabled ?? true,
      },
    });
  }

  public async findUserEmail(userId: string): Promise<string | null> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user ? user.email : null;
  }

  public async archiveExpired(now: Date = new Date()): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: {
        expiresAt: { lt: now },
        status: { not: NotificationStatus.ARCHIVED },
      },
      data: {
        status: NotificationStatus.ARCHIVED,
      },
    });
    return result.count;
  }

  public async softDeleteOlderThan(cutoffDate: Date, limit: number = 100): Promise<number> {
    const staleItems = await this.db.notification.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        deletedAt: null,
      },
      select: { id: true },
      take: limit,
    });

    if (staleItems.length === 0) return 0;

    const ids = staleItems.map((item) => item.id);
    const result = await this.db.notification.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
    return result.count;
  }
}
