import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Calendar } from 'lucide-react';
import {
  RecommendationEligibilityStatus,
  RecommendationApplicationStatus,
} from '../../../types/recommendation';

export interface RecommendationStatusBadgeProps {
  status?: RecommendationEligibilityStatus;
  eligibilityStatus?: RecommendationEligibilityStatus;
  applicationStatus?: RecommendationApplicationStatus;
  isExpiringSoon?: boolean;
  daysUntilDeadline?: number | null;
  className?: string;
}

export const RecommendationStatusBadge: React.FC<RecommendationStatusBadgeProps> = ({
  status,
  eligibilityStatus,
  applicationStatus,
  isExpiringSoon,
  daysUntilDeadline,
  className = '',
}) => {
  const currentEligibility = eligibilityStatus || status;

  const renderEligibilityBadge = () => {
    switch (currentEligibility) {
      case 'ELIGIBLE':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 ${className}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Eligible</span>
          </span>
        );

      case 'LIKELY_ELIGIBLE':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 ${className}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Likely Eligible</span>
          </span>
        );

      case 'NEEDS_VERIFICATION':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 ${className}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Needs Verification</span>
          </span>
        );

      case 'NOT_ELIGIBLE':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 ${className}`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Not Eligible</span>
          </span>
        );

      default:
        return null;
    }
  };

  const renderApplicationBadge = () => {
    if (!applicationStatus) return null;

    if (isExpiringSoon && applicationStatus === 'OPEN') {
      const daysText = daysUntilDeadline !== undefined && daysUntilDeadline !== null ? ` (${daysUntilDeadline}d)` : '';
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 animate-pulse"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Closing Soon{daysText}</span>
        </span>
      );
    }

    switch (applicationStatus) {
      case 'OPEN':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Applications Open</span>
          </span>
        );

      case 'UPCOMING':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Opening Soon</span>
          </span>
        );

      case 'CLOSED':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Closed</span>
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {renderEligibilityBadge()}
      {renderApplicationBadge()}
    </div>
  );
};

export interface ApplicationStatusBadgeProps {
  status: RecommendationApplicationStatus;
  isExpiringSoon?: boolean;
  className?: string;
}

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  isExpiringSoon,
  className = '',
}) => {
  if (isExpiringSoon && status === 'OPEN') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse ${className}`}
      >
        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
        <span>Closing Soon</span>
      </span>
    );
  }

  switch (status) {
    case 'OPEN':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Applications Open</span>
        </span>
      );

    case 'UPCOMING':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
          <span>Opening Soon</span>
        </span>
      );

    case 'CLOSED':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        >
          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Closed</span>
        </span>
      );

    default:
      return null;
  }
};
