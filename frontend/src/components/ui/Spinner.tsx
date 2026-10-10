import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, label }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="inline-flex items-center gap-2" role="status" aria-label={label || 'Loading'}>
      <Loader2
        className={twMerge(clsx('animate-spin text-gov-800', sizes[size], className))}
      />
      {label && <span className="text-sm text-slate-600">{label}</span>}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
};
