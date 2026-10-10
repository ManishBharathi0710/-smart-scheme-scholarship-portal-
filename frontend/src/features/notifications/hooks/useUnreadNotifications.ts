import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '../api/notifications.api';
import { useOptionalAuth } from '../../auth/context/AuthContext';

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const auth = useOptionalAuth();
  const isAuthenticated = auth !== null ? auth.isAuthenticated : true;
  const isMountedRef = useRef<boolean>(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const count = await notificationsApi.getUnreadCount();
      if (isMountedRef.current) {
        setUnreadCount(count);
      }
    } catch {
      // Gracefully silent on background unread count poll failure
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchUnreadCount();

    // Sensible polling interval: 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  const decrementCount = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const resetCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount,
    decrementCount,
    resetCount,
  };
}
