import React, { useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { AuditLogRecord, AuditResult } from '../../../types/analytics';

export interface AuditLogTableProps {
  logs: AuditLogRecord[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
  onFilterChange?: (filters: { action?: string; entityType?: string; result?: AuditResult }) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  isLoading = false,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onFilterChange,
}) => {
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [entityInput, setEntityInput] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('ALL');

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (onFilterChange) {
      onFilterChange({
        action: actionInput.trim() || undefined,
        entityType: entityInput.trim() || undefined,
        result: resultFilter === 'ALL' ? undefined : (resultFilter as AuditResult),
      });
    }
  };

  const handleReset = () => {
    setActionInput('');
    setEntityInput('');
    setResultFilter('ALL');
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  return (
    <div className="space-y-4" data-testid="audit-log-table-container">
      {/* Search / Filter Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="audit-action-filter" className="sr-only">
                Filter by action
              </label>
              <input
                id="audit-action-filter"
                type="text"
                placeholder="Filter by action (e.g. SCHEME_PUBLISHED)..."
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label htmlFor="audit-entity-filter" className="sr-only">
                Filter by entity
              </label>
              <input
                id="audit-entity-filter"
                type="text"
                placeholder="Entity (e.g. Scheme, User)..."
                value={entityInput}
                onChange={(e) => setEntityInput(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-36">
              <label htmlFor="audit-result-filter" className="sr-only">
                Filter by result
              </label>
              <select
                id="audit-result-filter"
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">All Results</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FAILURE">Failure Only</option>
              </select>
            </div>

            <Button type="submit" size="sm" variant="primary">
              Filter
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3">Timestamp</th>
              <th scope="col" className="px-4 py-3">Actor & Role</th>
              <th scope="col" className="px-4 py-3">Action</th>
              <th scope="col" className="px-4 py-3">Entity</th>
              <th scope="col" className="px-4 py-3">Result</th>
              <th scope="col" className="px-4 py-3">IP Address</th>
              <th scope="col" className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                  No audit log entries found matching criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 truncate max-w-[160px]">
                      {log.actorEmail || log.actorUserId || 'System Service'}
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">{log.entityType}</span>
                    {log.entityId && (
                      <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                        {log.entityId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={log.result === 'SUCCESS' ? 'success' : 'danger'}>
                      {log.result}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    {log.ipAddress || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                      aria-label={`View details for audit entry ${log.action}`}
                    >
                      {selectedLog?.id === log.id ? 'Hide' : 'Inspect'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Log JSON Details Drawer/Modal */}
      {selectedLog && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Audit Record Payload Details ({selectedLog.id})
              </h4>
              <Button size="sm" variant="ghost" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 text-xs rounded-md overflow-x-auto font-mono">
              {JSON.stringify(
                {
                  id: selectedLog.id,
                  actorUserId: selectedLog.actorUserId,
                  actorEmail: selectedLog.actorEmail,
                  actorRole: selectedLog.actorRole,
                  action: selectedLog.action,
                  entityType: selectedLog.entityType,
                  entityId: selectedLog.entityId,
                  result: selectedLog.result,
                  ipAddress: selectedLog.ipAddress,
                  userAgent: selectedLog.userAgent,
                  requestId: selectedLog.requestId,
                  metadata: selectedLog.metadata,
                  timestamp: selectedLog.timestamp,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Pagination Bar */}
      <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-600">
        <div>
          Showing page <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong> (
          <strong>{totalItems}</strong> total records)
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
