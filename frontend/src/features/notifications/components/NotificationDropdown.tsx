import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ArrowRight, CheckCheck } from 'lucide-react';
import { NotificationItemData } from '../../../types/notification';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItemData[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const recentItems = notifications.slice(0, 5);

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications preview"
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gov-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[11px] font-bold text-white bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-[11px] font-semibold text-gov-700 hover:text-gov-900 px-2 py-1 rounded hover:bg-slate-200/60 transition-colors inline-flex items-center gap-1"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3 h-3 text-gov-700" />
              <span>Mark read</span>
            </button>
          )}

          <Link
            to="/settings/notifications"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-gov-900 hover:bg-slate-200/60 rounded transition-colors"
            title="Notification Settings"
            aria-label="Notification Preferences"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Items list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Loading notifications...
          </div>
        ) : recentItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No notifications at this time.
          </div>
        ) : (
          recentItems.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onMarkAsRead={onMarkAsRead}
              isCompact={true}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-gov-800 hover:text-gov-950 hover:underline w-full py-1"
        >
          <span>View all notifications</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
