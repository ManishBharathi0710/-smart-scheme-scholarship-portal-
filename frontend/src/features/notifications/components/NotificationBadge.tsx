import React from 'react';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  className = '',
}) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-red-600 rounded-full leading-none shadow-sm ${className}`}
      aria-label={`${count} unread notifications`}
    >
      {displayCount}
      <span className="sr-only">unread notifications</span>
    </span>
  );
};
