import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { RecommendationCard as RecommendationCardType } from '../../../types/recommendation';
import { Card, CardContent, Badge } from '../../../components/ui';
import {
  RecommendationStatusBadge,
  ApplicationStatusBadge,
} from './RecommendationStatusBadge';

interface RecommendationCardProps {
  recommendation: RecommendationCardType;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
}) => {
  return (
    <Card className="flex flex-col justify-between border-slate-200 hover:border-gov-400 hover:shadow-md transition-all group bg-white">
      <CardContent className="pt-5 space-y-4">
        {/* Top Header: Eligibility Status & Application Period State */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <RecommendationStatusBadge status={recommendation.eligibilityStatus} />
          <ApplicationStatusBadge
            status={recommendation.applicationStatus}
            isExpiringSoon={recommendation.isExpiringSoon}
          />
        </div>

        {/* Title & Department */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="neutral" className="text-[10px] font-semibold uppercase">
              {recommendation.programType.replace(/_/g, ' ')}
            </Badge>
            <span className="text-[11px] text-slate-500 font-medium">
              {recommendation.stateScope}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-gov-800 transition-colors leading-snug line-clamp-2">
            <Link to={`/recommendations/${recommendation.id}`}>{recommendation.schemeName}</Link>
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{recommendation.departmentName}</span>
          </div>
        </div>

        {/* Primary Benefit Display */}
        {recommendation.primaryBenefit && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-baseline justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Prescribed Benefit
              </span>
              <span className="font-bold text-gov-900 text-sm">
                {recommendation.primaryBenefit.amount
                  ? `₹${recommendation.primaryBenefit.amount.toLocaleString('en-IN')}`
                  : 'As per norms'}
              </span>
            </div>
            <Badge variant="info" className="text-[10px]">
              {recommendation.primaryBenefit.frequency
                ? recommendation.primaryBenefit.frequency.replace(/_/g, ' ')
                : 'GRANT'}
            </Badge>
          </div>
        )}

        {/* Condition Evaluation Metric Strips (No Arbitrary Score!) */}
        <div className="pt-1 border-t border-slate-100 space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {recommendation.matchedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {recommendation.matchedCount} criteria satisfied
              </span>
            )}
            {recommendation.unknownCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {recommendation.unknownCount} needs verification
              </span>
            )}
            {recommendation.failedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-rose-700 font-medium text-[11px]">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                {recommendation.failedCount} condition not met
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed italic bg-slate-50/50 p-2 rounded border border-slate-100/80">
            "{recommendation.summary}"
          </p>
        </div>

        {/* Deadline info */}
        {recommendation.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Deadline:{' '}
              <strong className="text-slate-700">
                {new Date(recommendation.deadline).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </span>
          </div>
        )}
      </CardContent>

      <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-mono">
          Rule Spec v{recommendation.schemeVersionNumber}
        </span>
        <Link
          to={`/recommendations/${recommendation.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-gov-800 hover:text-gov-950 transition-colors group-hover:translate-x-0.5 transform duration-150"
        >
          <span>View Detailed Breakdown</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
