import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { AuditLogTable } from '../components/AuditLogTable';
import { ExportModal } from '../components/ExportModal';
import { analyticsApi } from '../api/analytics.api';
import {
  AuditLogsResponse,
  AuditResult,
  ExportType,
  ExportFormat,
  AnalyticsTimeRange,
} from '../../../types/analytics';

export const AdminAuditLogsPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogsResponse>({
    items: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    action?: string;
    entityType?: string;
    result?: AuditResult;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyticsApi.getAuditLogs({
        page: currentPage,
        limit: 20,
        ...filters,
      });
      setAuditLogs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve audit log records.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Administrative Audit Log Trail
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Immutable, append-only security logs of privileged administrative actions and system events.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExportOpen(true)}
            className="bg-white"
          >
            Export Audit Trail
          </Button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <AuditLogTable
          logs={auditLogs.items}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={auditLogs.pagination.totalPages}
          totalItems={auditLogs.pagination.total}
          onPageChange={setCurrentPage}
          onFilterChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1);
          }}
        />

        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          onExport={async (params: {
            exportType: ExportType;
            format: ExportFormat;
            timeRange: AnalyticsTimeRange;
          }) => {
            await analyticsApi.exportData({ ...params, exportType: 'AUDIT' });
          }}
        />
      </div>
    </PageContainer>
  );
};
