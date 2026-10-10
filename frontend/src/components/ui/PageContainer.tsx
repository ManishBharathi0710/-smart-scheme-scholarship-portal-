import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const PageContainer: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full', className),
      )}
      {...props}
    >
      {children}
    </div>
  );
};
