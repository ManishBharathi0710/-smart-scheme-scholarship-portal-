import React from 'react';
import { AnalyticsTimeRange } from '../../../types/analytics';

export interface DateRangePickerProps {
  value: AnalyticsTimeRange;
  onChange: (value: AnalyticsTimeRange) => void;
  disabled?: boolean;
}

const RANGES: Array<{ label: string; value: AnalyticsTimeRange }> = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '1 Year', value: 'year' },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      role="group"
      aria-label="Select analytics date range"
      className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200"
    >
      {RANGES.map((r) => {
        const isActive = value === r.value;
        return (
          <button
            key={r.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(r.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
              isActive
                ? 'bg-white text-blue-700 shadow-sm font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
};
