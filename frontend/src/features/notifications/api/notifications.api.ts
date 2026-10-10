import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import {
  NotificationItemData,
  NotificationListResponse,
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
  NotificationQueryParams,
} from '../../../types/notification';

export const notificationsApi = {
  /**
   * GET /notifications - List user's notifications with pagination and filters
   */
  async getNotifications(
    params?: NotificationQueryParams
  ): Promise<NotificationListResponse> {
    const res = await apiClient.get<ApiSuccessResponse<NotificationListResponse>>(
      '/notifications',
      { params }
    );
    return res.data.data;
  },

  /**
   * GET /notifications/unread-count - Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiSuccessResponse<{ count: number }>>(
      '/notifications/unread-count'
    );
    return res.data.data.count;
  },

  /**
   * PATCH /notifications/:notificationId/read - Mark single notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationItemData> {
    const res = await apiClient.patch<ApiSuccessResponse<NotificationItemData>>(
      `/notifications/${notificationId}/read`
    );
    return res.data.data;
  },

  /**
   * PATCH /notifications/read-all - Mark all user's notifications as read
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const res = await apiClient.patch<ApiSuccessResponse<{ count: number }>>(
      '/notifications/read-all'
    );
    return res.data.data;
  },

  /**
   * DELETE /notifications/:notificationId - Soft-delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * GET /notification-preferences - Get user's notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const res = await apiClient.get<ApiSuccessResponse<NotificationPreferences>>(
      '/notification-preferences'
    );
    return res.data.data;
  },

  /**
   * PATCH /notification-preferences - Update user's notification preferences
   */
  async updatePreferences(
    input: UpdateNotificationPreferencesInput
  ): Promise<NotificationPreferences> {
    const res = await apiClient.patch<ApiSuccessResponse<NotificationPreferences>>(
      '/notification-preferences',
      input
    );
    return res.data.data;
  },
};
