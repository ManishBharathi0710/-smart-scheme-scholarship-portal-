import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationBadge } from './NotificationBadge';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, refreshUnreadCount } = useUnreadNotifications();
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useNotifications({ limit: 5 });

  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      refetch();
      refreshUnreadCount();
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    refreshUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    refreshUnreadCount();
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="relative p-2 text-slate-600 hover:text-gov-900 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gov-700"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        <NotificationBadge
          count={unreadCount}
          className="absolute -top-1 -right-1"
        />
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  );
};
