import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Alert } from '../../../components/ui/Alert';
import { SystemHealthStatus } from '../components/SystemHealthStatus';
import { analyticsApi } from '../api/analytics.api';
import { DetailedSystemHealthDto } from '../../../types/analytics';

export const AdminSystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<DetailedSystemHealthDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyticsApi.getSystemHealth();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve system health diagnostics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            System Health & Diagnostic Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status check of core subsystems: Database, Storage Vault, OCR Pipeline, AI Models, and Notifications.
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <SystemHealthStatus health={health} isLoading={isLoading} onRefresh={fetchHealth} />
      </div>
    </PageContainer>
  );
};
