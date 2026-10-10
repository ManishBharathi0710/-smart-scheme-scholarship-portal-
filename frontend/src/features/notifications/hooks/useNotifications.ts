import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '../api/notifications.api';
import {
  NotificationItemData,
  NotificationQueryParams,
  NotificationStatus,
  NotificationSeverity,
} from '../../../types/notification';

export function useNotifications(initialParams: NotificationQueryParams = {}) {
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [page, setPage] = useState<number>(initialParams.page || 1);
  const [limit] = useState<number>(initialParams.limit || 20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | undefined>(
    initialParams.status
  );
  const [severityFilter, setSeverityFilter] = useState<NotificationSeverity | undefined>(
    initialParams.severity
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsApi.getNotifications({
        page,
        limit,
        status: statusFilter,
        severity: severityFilter,
      });

      if (isMountedRef.current) {
        setNotifications(data.items);
        setTotal(data.total);
        setUnreadCount(data.unreadCount);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unable to load notifications');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, limit, statusFilter, severityFilter]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchNotifications();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const updated = await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? updated : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (statusFilter === 'UNREAD') {
        setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, status: 'READ', readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      if (statusFilter === 'UNREAD') {
        setNotifications([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      const target = notifications.find((n) => n.id === notificationId);
      if (target && target.status === 'UNREAD') {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  };

  return {
    notifications,
    total,
    unreadCount,
    page,
    limit,
    totalPages,
    statusFilter,
    severityFilter,
    loading,
    error,
    setPage,
    setStatusFilter,
    setSeverityFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
