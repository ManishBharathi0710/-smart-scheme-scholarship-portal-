import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { ExportType, ExportFormat, AnalyticsTimeRange } from '../../../types/analytics';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (params: {
    exportType: ExportType;
    format: ExportFormat;
    timeRange: AnalyticsTimeRange;
  }) => Promise<void>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
}) => {
  const [exportType, setExportType] = useState<ExportType>('PLATFORM');
  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setError(null);
    try {
      await onExport({ exportType, format, timeRange });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics data.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Administrative Analytics & Audit Trail"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="export-dataset-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Resource Dataset
          </label>
          <select
            id="export-dataset-select"
            value={exportType}
            onChange={(e) => setExportType(e.target.value as ExportType)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="PLATFORM">Platform Summary Overview</option>
            <option value="USERS">Citizen Demographics & Verification</option>
            <option value="SCHEMES">Scheme Discovery & Funnel Metrics</option>
            <option value="RECOMMENDATIONS">Recommendation & Eligibility Evaluations</option>
            <option value="DOCUMENTS">Document Vault & OCR Processing</option>
            <option value="NOTIFICATIONS">Notification Delivery & Engagement</option>
            <option value="AI">AI Assistant Telemetry & Tokens</option>
            <option value="AUDIT">Administrative Security Audit Trail</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="export-format-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              File Format
            </label>
            <select
              id="export-format-select"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="CSV">CSV (Spreadsheet)</option>
              <option value="JSON">JSON (Structured)</option>
            </select>
          </div>

          <div>
            <label htmlFor="export-timerange-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Time Range
            </label>
            <select
              id="export-timerange-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as AnalyticsTimeRange)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">Past Year</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600">
          <p className="font-semibold text-slate-700">Audit Compliance Notice:</p>
          <p className="mt-0.5">
            Every export action is immutably logged with your administrative identity, IP address, and
            timestamp. Sensitive citizen identifiers are automatically masked.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isExporting}>
            {isExporting ? 'Generating Export...' : 'Download Export'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
