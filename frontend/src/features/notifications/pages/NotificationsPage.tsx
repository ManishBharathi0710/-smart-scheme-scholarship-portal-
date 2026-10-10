import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Settings, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from '../components/NotificationItem';
import { NotificationFilters } from '../components/NotificationFilters';
import { NotificationEmptyState } from '../components/NotificationEmptyState';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    total,
    unreadCount,
    page,
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
    refetch,
  } = useNotifications({ limit: 15 });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gov-900 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gov-950">
              Citizen Notifications &amp; Alerts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time deadline reminders, scheme updates, and document verification readiness.
          </p>
        </div>

        <Link
          to="/settings/notifications"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Notification Preferences</span>
        </Link>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-6">
        {/* Filter controls */}
        <NotificationFilters
          currentStatus={statusFilter}
          currentSeverity={severityFilter}
          unreadCount={unreadCount}
          onStatusChange={(status) => {
            setStatusFilter(status);
            setPage(1);
          }}
          onSeverityChange={(severity) => {
            setSeverityFilter(severity);
            setPage(1);
          }}
          onMarkAllAsRead={markAllAsRead}
        />

        {/* Error alert */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => refetch()}
              className="font-semibold underline ml-2 hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-24 bg-slate-100 rounded-lg animate-pulse"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <NotificationEmptyState
              title={statusFilter === 'UNREAD' ? 'No unread notifications' : 'No notifications to display'}
              description={
                statusFilter === 'UNREAD'
                  ? 'All notifications have been read. Switch to "All Notifications" to view your history.'
                  : 'You have no notifications matching the selected filter criteria.'
              }
            />
          ) : (
            notifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Showing page <span className="font-semibold text-slate-800">{page}</span> of{' '}
              <span className="font-semibold text-slate-800">{totalPages}</span> ({total} total)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md disabled:opacity-40 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md disabled:opacity-40 transition-colors"
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Statutory Disclaimer banner */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-gov-800 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Official Portal Advisory:</span> Deadline
          reminders and opening announcements are generated using officially notified scheme
          timelines. Official application closures and verification requirements remain subject to
          administering government department gazettes.
        </div>
      </div>
    </div>
  );
};
