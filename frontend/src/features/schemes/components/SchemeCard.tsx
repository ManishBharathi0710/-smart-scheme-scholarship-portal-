import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  IndianRupee,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
  Layers,
} from 'lucide-react';
import { PublicSchemeCard } from '../../../types/scheme';
import { Card, CardContent, Badge, Button } from '../../../components/ui';

interface SchemeCardProps {
  scheme: PublicSchemeCard;
  isSaved?: boolean;
  onToggleSave?: (schemeId: string) => void;
  isComparing?: boolean;
  onToggleCompare?: (schemeId: string, schemeName?: string) => void;
  recommendationStatus?: 'ELIGIBLE' | 'LIKELY_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'NOT_ELIGIBLE' | null;
  className?: string;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  isSaved = false,
  onToggleSave,
  isComparing = false,
  onToggleCompare,
  recommendationStatus,
  className = '',
}) => {
  const activePeriod = scheme.activeApplicationPeriod;
  const benefit = scheme.primaryBenefit;

  // Compute deadline countdown
  let deadlineText: string | null = null;
  let isClosingSoon = false;

  if (activePeriod?.closeDate) {
    const closeDate = new Date(activePeriod.closeDate);
    const now = new Date();
    const diffDays = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      deadlineText = 'Application closed';
    } else if (diffDays === 0) {
      deadlineText = 'Closing today';
      isClosingSoon = true;
    } else if (diffDays <= 7) {
      deadlineText = `Closing soon: ${diffDays} day${diffDays > 1 ? 's' : ''} left`;
      isClosingSoon = true;
    } else {
      deadlineText = `Deadline: ${closeDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
    }
  }

  // Application cycle badge
  const appStatus = activePeriod?.status || 'CLOSED';
  let appStatusBadge = <Badge variant="neutral">Closed</Badge>;
  if (appStatus === 'OPEN') {
    appStatusBadge = isClosingSoon ? (
      <Badge variant="warning" className="animate-pulse">
        Closing Soon
      </Badge>
    ) : (
      <Badge variant="success">Application Open</Badge>
    );
  } else if (appStatus === 'UPCOMING') {
    appStatusBadge = <Badge variant="info">Upcoming</Badge>;
  }

  // Recommendation status badge from Module 4
  const effectiveRecStatus = recommendationStatus || scheme.userRecommendationStatus;
  let recBadge = null;
  if (effectiveRecStatus === 'ELIGIBLE') {
    recBadge = (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Eligible
      </div>
    );
  } else if (effectiveRecStatus === 'LIKELY_ELIGIBLE') {
    recBadge = (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
        <HelpCircle className="w-3 h-3 text-blue-600" />
        Likely Eligible
      </div>
    );
  } else if (effectiveRecStatus === 'NEEDS_VERIFICATION') {
    recBadge = (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <FileQuestion className="w-3 h-3 text-amber-600" />
        Needs Verification
      </div>
    );
  }

  const effectiveSaved = isSaved || scheme.isSaved;

  return (
    <Card
      className={`flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200 border-slate-200 bg-white group ${className}`}
    >
      <CardContent className="p-5 flex-1 flex flex-col space-y-3.5">
        {/* Top Badges & Save/Compare Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="neutral" className="text-[11px] font-semibold text-slate-700 bg-slate-50">
              {scheme.programType.replace(/_/g, ' ')}
            </Badge>
            {scheme.verificationStatus === 'VERIFIED' && (
              <Badge variant="success" className="text-[10px]">
                Verified Official
              </Badge>
            )}
            {recBadge}
          </div>

          <div className="flex items-center gap-1">
            {onToggleCompare && (
              <button
                type="button"
                onClick={() => onToggleCompare(scheme.id, scheme.name)}
                title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
                className={`p-1.5 rounded-md border text-xs transition-colors ${
                  isComparing
                    ? 'bg-gov-800 text-white border-gov-800'
                    : 'text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
                aria-label={`Compare ${scheme.name}`}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            )}

            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(scheme.id)}
                title={effectiveSaved ? 'Remove from saved schemes' : 'Save scheme'}
                className={`p-1.5 rounded-md border text-xs transition-colors ${
                  effectiveSaved
                    ? 'bg-amber-50 text-amber-600 border-amber-300'
                    : 'text-slate-400 hover:text-amber-600 border-slate-200 hover:bg-slate-50'
                }`}
                aria-label={`Save ${scheme.name}`}
              >
                {effectiveSaved ? (
                  <BookmarkCheck className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Scheme Name & Short Description */}
        <div className="space-y-1">
          <Link
            to={`/schemes/${scheme.slug || scheme.id}`}
            className="group-hover:text-gov-800 transition-colors"
          >
            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
              {scheme.name}
            </h3>
          </Link>
          {scheme.shortName && (
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {scheme.shortName}
            </p>
          )}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
            {scheme.shortDescription || 'Verified statutory assistance program under government provisions.'}
          </p>
        </div>

        {/* Department & State Metadata */}
        <div className="space-y-1 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{scheme.departmentName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {scheme.stateScope === 'ALL_INDIA' ? 'All India (Central)' : scheme.stateScope}
            </span>
          </div>
        </div>

        {/* Benefit Highlight Box */}
        {benefit && (
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                {benefit.amount
                  ? `₹${benefit.amount.toLocaleString('en-IN')}`
                  : benefit.type.replace(/_/g, ' ')}
              </span>
            </div>
            {benefit.frequency && (
              <span className="text-[11px] text-slate-500 capitalize">
                {benefit.frequency.toLowerCase()}
              </span>
            )}
          </div>
        )}
      </CardContent>

      {/* Card Footer: Status, Deadline & Details CTA */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          {appStatusBadge}
          {deadlineText && (
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {deadlineText}
            </span>
          )}
        </div>

        <Link to={`/schemes/${scheme.slug || scheme.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-gov-800 hover:text-gov-900 hover:bg-slate-100/80 -mr-2"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};
