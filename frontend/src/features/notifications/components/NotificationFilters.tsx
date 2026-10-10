import React from 'react';
import { CheckCheck, Filter } from 'lucide-react';
import {
  NotificationStatus,
  NotificationSeverity,
} from '../../../types/notification';

interface NotificationFiltersProps {
  currentStatus?: NotificationStatus;
  currentSeverity?: NotificationSeverity;
  unreadCount: number;
  onStatusChange: (status?: NotificationStatus) => void;
  onSeverityChange: (severity?: NotificationSeverity) => void;
  onMarkAllAsRead?: () => void;
  markingAll?: boolean;
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  currentStatus,
  currentSeverity,
  unreadCount,
  onStatusChange,
  onSeverityChange,
  onMarkAllAsRead,
  markingAll = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      {/* Tabs: All vs Unread */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onStatusChange(undefined)}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            !currentStatus
              ? 'bg-gov-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-gov-900 hover:bg-slate-100'
          }`}
        >
          All Notifications
        </button>

        <button
          type="button"
          onClick={() => onStatusChange('UNREAD')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            currentStatus === 'UNREAD'
              ? 'bg-gov-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-gov-900 hover:bg-slate-100'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
                currentStatus === 'UNREAD'
                  ? 'bg-amber-400 text-gov-950'
                  : 'bg-red-600 text-white'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter and Bulk Action controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <select
            value={currentSeverity || ''}
            onChange={(e) =>
              onSeverityChange(
                e.target.value ? (e.target.value as NotificationSeverity) : undefined
              )
            }
            className="text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gov-700"
            aria-label="Filter notifications by severity"
          >
            <option value="">All Severities</option>
            <option value="INFO">Info</option>
            <option value="IMPORTANT">Important</option>
            <option value="WARNING">Warning</option>
          </select>
        </div>

        {unreadCount > 0 && onMarkAllAsRead && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gov-800 bg-gov-50 hover:bg-gov-100 rounded-md border border-gov-200 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5 text-gov-700" />
            <span>Mark all read</span>
          </button>
        )}
      </div>
    </div>
  );
};
