import React from 'react';
import { Link } from 'react-router-dom';
import {
  Info,
  Clock,
  AlertTriangle,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { NotificationItemData, NotificationSeverity } from '../../../types/notification';

interface NotificationItemProps {
  notification: NotificationItemData;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  isCompact?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  isCompact = false,
}) => {
  const isUnread = notification.status === 'UNREAD';

  const getSeverityConfig = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'WARNING':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />,
          badgeClass: 'bg-red-50 text-red-700 border-red-200',
          dotClass: 'bg-red-500',
          borderClass: 'border-l-red-500',
        };
      case 'IMPORTANT':
        return {
          icon: <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />,
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-500',
          borderClass: 'border-l-amber-500',
        };
      case 'INFO':
      default:
        return {
          icon: <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />,
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          dotClass: 'bg-blue-500',
          borderClass: 'border-l-gov-700',
        };
    }
  };

  const formatRelativeTime = (dateStr: string): string => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return past.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: past.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return dateStr;
    }
  };

  const severityConfig = getSeverityConfig(notification.severity);

  return (
    <article
      className={`relative transition-colors border rounded-lg ${
        isUnread
          ? `bg-slate-50/80 border-slate-300 border-l-4 ${severityConfig.borderClass}`
          : 'bg-white border-slate-200'
      } ${isCompact ? 'p-3' : 'p-4 sm:p-5'}`}
      aria-label={`${notification.severity}: ${notification.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="mt-0.5" aria-hidden="true">
            {severityConfig.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border tracking-wide ${severityConfig.badgeClass}`}
              >
                {notification.severity}
              </span>

              {isUnread && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gov-800">
                  <span className={`w-2 h-2 rounded-full ${severityConfig.dotClass}`} />
                  Unread
                </span>
              )}

              <time
                dateTime={notification.createdAt}
                className="text-xs text-slate-400 font-medium ml-auto"
              >
                {formatRelativeTime(notification.createdAt)}
              </time>
            </div>

            <h4
              className={`text-sm ${
                isUnread ? 'font-bold text-gov-950' : 'font-semibold text-slate-800'
              } leading-snug mb-1`}
            >
              {notification.title}
            </h4>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
              {notification.message}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {notification.actionUrl && (
                <Link
                  to={notification.actionUrl}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gov-800 hover:text-gov-950 hover:underline transition-colors"
                >
                  <span>Open details</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}

              {isUnread && onMarkAsRead && (
                <button
                  type="button"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors ml-auto"
                  title="Mark this notification as read"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark read</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(notification.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors ml-auto sm:ml-0"
                  title="Dismiss notification"
                  aria-label={`Dismiss notification: ${notification.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
