import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '../api/notifications.api';
import {
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
} from '../../../types/notification';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsApi.getPreferences();
      if (isMountedRef.current) {
        setPreferences(data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unable to load notification preferences');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchPreferences();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchPreferences]);

  const updatePreferences = async (input: UpdateNotificationPreferencesInput) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      const updated = await notificationsApi.updatePreferences(input);
      if (isMountedRef.current) {
        setPreferences(updated);
        setSuccessMessage('Preferences updated successfully');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to update preferences');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  return {
    preferences,
    loading,
    saving,
    error,
    successMessage,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
