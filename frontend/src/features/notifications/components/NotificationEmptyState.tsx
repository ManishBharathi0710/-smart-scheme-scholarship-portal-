import React from 'react';
import { BellOff } from 'lucide-react';

interface NotificationEmptyStateProps {
  title?: string;
  description?: string;
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({
  title = 'No notifications to display',
  description = 'You are all caught up! When you receive scheme updates, application deadline reminders, or document alerts, they will appear here.',
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm"
      role="status"
    >
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <BellOff className="w-7 h-7" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md leading-relaxed">{description}</p>
    </div>
  );
};
