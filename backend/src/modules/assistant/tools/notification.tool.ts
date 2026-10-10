import { NotificationService } from '../../notifications/notifications.service.js';
import { logger } from '../../../utils/logger.js';

export interface NotificationFactContext {
  id: string;
  title: string;
  message: string;
  type: string;
  sentAt?: Date | string | null;
  actionUrl?: string | null;
}

export class NotificationTool {
  private readonly notificationService: NotificationService;

  constructor(notificationService: NotificationService = new NotificationService()) {
    this.notificationService = notificationService;
  }

  /**
   * Retrieves notification context for explaining alerts, deadlines, and notifications.
   * Strictly user-scoped.
   */
  public async getNotification(
    userId: string,
    notificationId: string,
  ): Promise<NotificationFactContext | null> {
    try {
      const response = await this.notificationService.getUserNotifications(userId, {
        limit: 50,
      });

      const found = response.items.find((item) => item.id === notificationId);
      if (!found) {
        return null;
      }

      return {
        id: found.id,
        title: found.title,
        message: found.message,
        type: found.type,
        sentAt: found.sentAt,
        actionUrl: found.actionUrl,
      };
    } catch (error) {
      logger.warn({
        userId,
        notificationId,
        error: error instanceof Error ? error.message : String(error),
        msg: 'NotificationTool failed to retrieve notification',
      });
      return null;
    }
  }

  /**
   * Retrieves recent notifications for context
   */
  public async getRecentNotifications(
    userId: string,
    limit = 5,
  ): Promise<NotificationFactContext[]> {
    try {
      const response = await this.notificationService.getUserNotifications(userId, { limit });
      return response.items.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        sentAt: item.sentAt,
        actionUrl: item.actionUrl,
      }));
    } catch (error) {
      logger.warn({
        userId,
        error: error instanceof Error ? error.message : String(error),
        msg: 'NotificationTool failed to retrieve recent notifications',
      });
      return [];
    }
  }
}

export const notificationTool = new NotificationTool();
