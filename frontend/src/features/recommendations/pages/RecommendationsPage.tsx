import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Compass,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { recommendationsApi } from '../api/recommendations.api';
import {
  RecommendationEligibilityStatus,
  RecommendationApplicationStatus,
} from '../../../types/recommendation';
import { ProgramType, SchemeCategory } from '../../../types/scheme';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Select,
  Spinner,
  Alert,
} from '../../../components/ui';
import { RecommendationCard } from '../components/RecommendationCard';

export const RecommendationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'' | RecommendationEligibilityStatus>('');
  const [categoryFilter, setCategoryFilter] = useState<'' | SchemeCategory>('');
  const [typeFilter, setTypeFilter] = useState<'' | ProgramType>('');
  const [appStatusFilter, setAppStatusFilter] = useState<'' | RecommendationApplicationStatus>('');
  const [page, setPage] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // 1. Fetch recommendations list
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['user-recommendations', page, statusFilter, categoryFilter, typeFilter, appStatusFilter],
    queryFn: () =>
      recommendationsApi.getRecommendations({
        page,
        pageSize: 12,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        programType: typeFilter || undefined,
        applicationStatus: appStatusFilter || undefined,
      }),
  });

  // 2. Fetch summary counts
  const { data: counts } = useQuery({
    queryKey: ['recommendation-counts'],
    queryFn: () => recommendationsApi.getSummaryCounts(),
  });

  // 3. Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: () => recommendationsApi.refreshRecommendations(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['user-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendation-counts'] });
      setFeedback({
        type: 'success',
        message: `Evaluation refreshed: ${res.eligibleCount} eligible, ${res.likelyEligibleCount} likely eligible, ${res.needsVerificationCount} requiring verification.`,
      });
      setTimeout(() => setFeedback(null), 6000);
    },
    onError: (err: unknown) => {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to refresh recommendations.',
      });
    },
  });

  const clearFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setTypeFilter('');
    setAppStatusFilter('');
    setPage(1);
  };

  return (
    <PageContainer className="py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gov-900 to-gov-950 text-white rounded-xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gov-800 text-xs font-semibold text-amber-300 border border-gov-700">
            <Compass className="w-3.5 h-3.5" />
            Deterministic Eligibility Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Your Personalized Scheme Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Statutory matching evaluated exclusively against verified government notifications and your registered citizen profile. Deterministic, transparent, and auditable.
          </p>
        </div>

        <Button
          data-testid="refresh-recommendations-btn"
          variant="secondary"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending || isFetching}
          className="shrink-0 bg-white text-gov-900 hover:bg-slate-100 font-bold text-xs sm:text-sm px-4 py-2.5 shadow-sm border border-transparent"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshMutation.isPending || isFetching ? 'animate-spin' : ''}`}
          />
          {refreshMutation.isPending ? 'Evaluating Rules...' : 'Re-Evaluate Profile'}
        </Button>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type === 'success' ? 'success' : 'error'}
          title={feedback.type === 'success' ? 'Recommendations Updated' : 'Evaluation Notice'}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Summary Counts Strip */}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div
            onClick={() => {
              setStatusFilter('ELIGIBLE');
              setPage(1);
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'ELIGIBLE'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
              <span>Eligible</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950">{counts.ELIGIBLE || 0}</div>
            <span className="text-[11px] text-emerald-700">Satisfies all statutory rules</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('LIKELY_ELIGIBLE');
              setPage(1);
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'LIKELY_ELIGIBLE'
                ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-sky-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-sky-800 font-semibold mb-1">
              <span>Likely Eligible</span>
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-sky-950">{counts.LIKELY_ELIGIBLE || 0}</div>
            <span className="text-[11px] text-sky-700">Core criteria satisfied</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('NEEDS_VERIFICATION');
              setPage(1);
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'NEEDS_VERIFICATION'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-900 font-semibold mb-1">
              <span>Needs Verification</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950">
              {counts.NEEDS_VERIFICATION || 0}
            </div>
            <span className="text-[11px] text-amber-800">Missing profile facts</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('NOT_ELIGIBLE');
              setPage(1);
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'NOT_ELIGIBLE'
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-800 font-semibold mb-1">
              <span>Not Eligible</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-950">{counts.NOT_ELIGIBLE || 0}</div>
            <span className="text-[11px] text-rose-700">Criteria ceiling exceeded</span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Status Quick-Pill Filter */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Status:
              </span>
              {[
                { label: 'All Schemes', val: '' },
                { label: 'Eligible', val: 'ELIGIBLE' },
                { label: 'Likely Eligible', val: 'LIKELY_ELIGIBLE' },
                { label: 'Needs Verification', val: 'NEEDS_VERIFICATION' },
                { label: 'Not Eligible', val: 'NOT_ELIGIBLE' },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => {
                    setStatusFilter(t.val as RecommendationEligibilityStatus | '');
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                    statusFilter === t.val
                      ? 'bg-gov-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as SchemeCategory);
                  setPage(1);
                }}
                className="text-xs"
              >
                <option value="">All Benefit Categories</option>
                <option value="EDUCATION">Education</option>
                <option value="AGRICULTURE">Agriculture</option>
                <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
                <option value="HEALTH">Health</option>
                <option value="FINANCIAL_ASSISTANCE">Financial Assistance</option>
                <option value="SOCIAL_SECURITY">Social Security</option>
              </Select>

              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as ProgramType);
                  setPage(1);
                }}
                className="text-xs"
              >
                <option value="">All Program Types</option>
                <option value="SCHOLARSHIP">Scholarship</option>
                <option value="WELFARE_SCHEME">Welfare Scheme</option>
                <option value="SUBSIDY">Subsidy</option>
                <option value="LOAN">Loan</option>
                <option value="INSURANCE">Insurance</option>
                <option value="PENSION">Pension</option>
              </Select>

              <Select
                value={appStatusFilter}
                onChange={(e) => {
                  setAppStatusFilter(e.target.value as RecommendationApplicationStatus);
                  setPage(1);
                }}
                className="text-xs"
              >
                <option value="">All Application Windows</option>
                <option value="OPEN">Currently Open</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div data-testid="recommendations-loading-skeleton" className="p-16 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-500 font-medium">
            Evaluating profile against verified scheme rules...
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-8 text-center bg-white rounded-lg border border-red-200 space-y-3">
          <p className="text-sm font-semibold text-red-600">
            Failed to retrieve recommendations.
          </p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry Evaluation
          </Button>
        </div>
      )}

      {/* Empty State (Section 125) */}
      {!isLoading && !isError && data?.items.length === 0 && (
        <div
          data-testid="empty-recommendations-state"
          className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-4"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              No matching schemes found matching criteria
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              We couldn't find a matching scheme based on the information currently available in your profile. You may discover additional opportunities by completing missing profile attributes or checking back when new schemes are gazetted.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={clearFilters} className="text-xs">
              Clear Active Filters
            </Button>
            <Link to="/profile">
              <Button variant="primary" className="text-xs bg-gov-900 text-white">
                <span>Update Citizen Profile</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing{' '}
              <strong className="text-slate-800 font-bold">{data.items.length}</strong> of{' '}
              <strong className="text-slate-800 font-bold">{data.pagination.total}</strong> evaluated recommendations
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Sorted deterministically by eligibility certainty and deadline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs"
              >
                Previous Page
              </Button>
              <span className="text-xs font-semibold text-slate-600">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs"
              >
                Next Page
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Statutory Footer Notice */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-gov-700 shrink-0 mt-0.5" />
        <span>
          <strong>Official Decision-Support Notice:</strong> Recommendations are calculated deterministically against verified statutory rules. The portal does not guarantee selection, approval, or disbursement. All applications are subject to scrutiny and verification by the concerned administrative authority.
        </span>
      </div>
    </PageContainer>
  );
};
