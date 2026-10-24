import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
  Clock,
  Bookmark,
  ArrowRight,
  RefreshCw,
  Award,
  Info,
  AlertTriangle,
  FileText,
  Printer,
  Building2,
  DollarSign,
  ChevronRight,
  Search,
  X,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { dashboardApi } from '../features/dashboard/api/dashboard.api';
import { recommendationsApi } from '../features/recommendations/api/recommendations.api';
import { useSavedSchemes } from '../features/saved-schemes/hooks/useSavedSchemes';
import { useCompareSelection } from '../features/schemes/hooks/useCompareSelection';
import { SchemeCard } from '../features/schemes/components/SchemeCard';
import { CompareTray } from '../features/schemes/components/CompareTray';
import {
  useDashboardSimulation,
  computeSchemeMatchScore,
  TrackedApplication,
} from '../features/dashboard/hooks/useDashboardSimulation';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Skeleton,
  EmptyState,
  useToast,
} from '../components/ui';
import { RecommendationCard } from '../types/recommendation';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'MATCHED' | 'APPLICATIONS' | 'ALERTS'>('MATCHED');

  // Filter state for Tab 1 (Matched Schemes)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedBenefitType, setSelectedBenefitType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Filter state for Tab 2 (Application Tracker)
  const [appStatusFilter, setAppStatusFilter] = useState<string>('ALL');

  // PDF Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Apply Modal State
  const [applyingScheme, setApplyingScheme] = useState<RecommendationCard | null>(null);

  // Hooks for saved & compare selections
  const { isSaved, toggleSave } = useSavedSchemes();
  const { selectedIds, isSelected, toggleCompare, clearCompare } = useCompareSelection();

  // 1. Fetch aggregate dashboard data
  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getDashboard(),
  });

  // 2. Real-time Reactive Simulation Layer
  const {
    lastSyncedAt,
    isSyncing,
    syncCount,
    manualSync,
    applications,
    trackApplication,
    activeApplicationsCount,
    inReviewApplicationsCount,
    approvedApplicationsCount,
    disbursedApplicationsCount,
    totalEstimatedBenefit,
  } = useDashboardSimulation(dashboard);

  // 3. Mutation to refresh recommendations deterministically via Module 4 API
  const refreshMutation = useMutation({
    mutationFn: () => recommendationsApi.refreshRecommendations(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['user-recommendations'] });
      manualSync();
      showToast('Recommendations refreshed against statutory criteria.', 'success');
    },
    onError: () => {
      showToast('Could not refresh recommendations. Please try again.', 'error');
    },
  });

  // Safe normalized dashboard properties with defensive fallbacks
  const profile = dashboard?.profile ?? {
    fullName: null,
    email: user?.email ?? null,
    state: 'Tamil Nadu',
    educationLevel: 'UNDERGRADUATE',
    category: 'OBC',
    income: 180000,
    isReadyForRecommendations: true,
    completionPercentage: 85,
    summary: 'Profile is 85% complete and actively evaluated.',
  };

  const recommendationSummary = dashboard?.recommendationSummary ?? {
    totalEvaluated: 0,
    eligible: 0,
    likelyEligible: 0,
    needsVerification: 0,
    notEligible: 0,
    expiringSoon: 0,
  };

  const topRecommendations = useMemo(() => {
    return dashboard?.topRecommendations ?? [];
  }, [dashboard?.topRecommendations]);

  const closingSoon = useMemo(() => {
    return dashboard?.closingSoon ?? [];
  }, [dashboard?.closingSoon]);

  const savedSchemesList = useMemo(() => {
    const rawSaved = dashboard?.savedSchemes;
    return rawSaved?.preview ?? rawSaved?.items ?? [];
  }, [dashboard?.savedSchemes]);

  const savedTotal = useMemo(() => {
    const rawSaved = dashboard?.savedSchemes;
    return rawSaved?.total ?? rawSaved?.totalCount ?? (savedSchemesList ?? []).length;
  }, [dashboard?.savedSchemes, savedSchemesList]);

  const actionItems = useMemo(() => {
    return dashboard?.actionItems ?? [];
  }, [dashboard?.actionItems]);

  // Extract departments from recommendations for filter dropdown
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    (topRecommendations ?? []).forEach((r) => {
      if (r?.departmentName) set.add(r.departmentName);
      else if (r?.department) set.add(r.department);
    });
    return Array.from(set);
  }, [topRecommendations]);

  // Filtered Matched Schemes (Tab 1)
  const filteredRecommendations = useMemo(() => {
    return (topRecommendations ?? []).filter((rec) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rec?.schemeName?.toLowerCase().includes(q);
        const matchesDept = (rec?.departmentName || rec?.department || '').toLowerCase().includes(q);
        const matchesDesc = (rec?.summary || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDept && !matchesDesc) return false;
      }

      // 2. Department filter
      if (selectedDepartment !== 'ALL') {
        const dept = rec?.departmentName || rec?.department || '';
        if (dept !== selectedDepartment) return false;
      }

      // 3. Benefit Type filter
      if (selectedBenefitType !== 'ALL') {
        const bType = rec?.primaryBenefit?.type || '';
        if (bType !== selectedBenefitType) return false;
      }

      // 4. Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'CLOSING_SOON') {
          if (!rec?.isExpiringSoon && (rec?.daysUntilDeadline == null || rec.daysUntilDeadline > 14)) {
            return false;
          }
        } else if (selectedStatus === 'OPEN') {
          if (rec?.applicationStatus !== 'OPEN') return false;
        }
      }

      return true;
    });
  }, [topRecommendations, searchQuery, selectedDepartment, selectedBenefitType, selectedStatus]);

  // Filtered Applications (Tab 2)
  const filteredApplications = useMemo(() => {
    return (applications ?? []).filter((app) => {
      if (appStatusFilter === 'ALL') return true;
      if (appStatusFilter === 'IN_REVIEW') {
        return app.currentStage === 'SUBMITTED' || app.currentStage === 'DOC_VERIFICATION';
      }
      if (appStatusFilter === 'APPROVED') return app.currentStage === 'DEPT_APPROVAL';
      if (appStatusFilter === 'DISBURSED') return app.currentStage === 'DISBURSED';
      return true;
    });
  }, [applications, appStatusFilter]);

  // Handle Application Submit
  const handleApplyClick = (rec: RecommendationCard) => {
    setApplyingScheme(rec);
  };

  const handleConfirmApplication = () => {
    if (!applyingScheme) return;
    trackApplication(applyingScheme);
    showToast(`Application for "${applyingScheme.schemeName}" successfully recorded in tracker!`, 'success');
    setApplyingScheme(null);
    setActiveTab('APPLICATIONS');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('ALL');
    setSelectedBenefitType('ALL');
    setSelectedStatus('ALL');
  };

  // 4. Loading Skeleton View
  if (isLoading) {
    return (
      <PageContainer className="py-8 space-y-6">
        {/* Header Skeleton */}
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 space-y-4 animate-pulse">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-6 w-44 bg-slate-800" />
              <Skeleton className="h-8 w-72 bg-slate-800" />
              <Skeleton className="h-4 w-96 bg-slate-800" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-28 bg-slate-800" />
              <Skeleton className="h-10 w-32 bg-slate-800" />
            </div>
          </div>
        </div>

        {/* KPI Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-36" />
            </Card>
          ))}
        </div>

        {/* Tab Skeleton */}
        <div className="flex gap-3 border-b border-slate-200 pb-2">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
        </div>

        {/* Cards Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 border-slate-200 space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  // 5. Error View
  if (isError) {
    return (
      <PageContainer className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Dashboard Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          We encountered an issue loading your personalized dashboard. Please check your network and try again.
        </p>
        <Button variant="outline" onClick={() => refetch()} className="text-xs">
          Try Again
        </Button>
      </PageContainer>
    );
  }

  // Currency Formatter
  const formattedBenefit = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(totalEstimatedBenefit);

  const citizenName = profile?.fullName || user?.email?.split('@')[0] || 'Citizen';
  const citizenId = `CITIZEN-${(user?.id || 'TN-9402').slice(0, 8).toUpperCase()}`;

  return (
    <PageContainer className="py-8 space-y-7">
      {/* ========================================================================= */}
      {/* 1. HEADER / USER SNAPSHOT BAR                                             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-gov-900 via-gov-900 to-gov-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gov-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gov-800 text-xs font-semibold text-amber-300 border border-gov-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Citizen Profile</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 text-[11px] font-mono text-slate-300 border border-slate-700">
                ID: {citizenId}
              </span>
              {/* Real-time reactive status indicator */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[11px] text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-medium">Live Status: Synced</span>
                <span className="text-[10px] text-emerald-400/70 hidden sm:inline">
                  ({syncCount > 1 ? `${Math.max(1, Math.round((Date.now() - lastSyncedAt.getTime()) / 1000))}s ago` : 'just now'})
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {citizenName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Executive public-benefit discovery portal. Access verified central and state welfare initiatives,
              monitor DBT disbursements, and track multi-stage statutory approvals.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => manualSync()}
              disabled={isSyncing || refreshMutation.isPending}
              className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 text-xs font-semibold"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isSyncing || refreshMutation.isPending ? 'animate-spin' : ''}`}
              />
              <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(true)}
              className="border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              <span>Export Application PDF</span>
            </Button>

            <Link to="/profile">
              <Button
                variant="primary"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-transparent text-xs"
              >
                <span>Update Profile</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Completion / Readiness Bar */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {`Profile ${profile.completionPercentage}% Complete`}
              </span>
              <span className="text-[11px] text-amber-300/90">
                ({profile.isReadyForRecommendations ? 'Ready for statutory evaluations' : 'Action required'})
              </span>
            </div>
            <p className="text-xs text-slate-300">{profile.summary}</p>
          </div>
          <div className="w-full sm:w-56 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${profile.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KEY METRICS GRID (TOP KPI ROW)                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Eligible Schemes Found */}
        <Card className="border-slate-200 bg-white hover:shadow-md transition-all">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Eligible Schemes Found
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {recommendationSummary?.eligible || (topRecommendations ?? []).length}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Verified</span>
            </div>
            <div className="pt-1 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-600">
              <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                Education (2)
              </Badge>
              <Badge variant="neutral" className="px-1.5 py-0 text-[10px]">
                Welfare (1)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Active Applications */}
        <Card className="border-slate-200 bg-white hover:shadow-md transition-all">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Active Applications
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {activeApplicationsCount}
              </span>
              <span className="text-xs text-blue-600 font-semibold">In Progress</span>
            </div>
            <div className="pt-1 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-500">
              <span className="font-medium text-slate-700">Review: {inReviewApplicationsCount}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">Approval: {approvedApplicationsCount}</span>
              <span>•</span>
              <span className="font-medium text-emerald-600">Paid: {disbursedApplicationsCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Estimated Direct Benefit */}
        <Card className="border-slate-200 bg-white hover:shadow-md transition-all">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Estimated Direct Benefit
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {formattedBenefit}
              </span>
            </div>
            <div className="pt-1 border-t border-slate-100 flex items-center gap-1 text-[11px] text-amber-800 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Direct Benefit Transfer (DBT) Ready</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Pending Verification */}
        <Card className="border-slate-200 bg-white hover:shadow-md transition-all">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Pending Verification
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <FileQuestion className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {recommendationSummary?.needsVerification || 1}
              </span>
              <span className="text-xs text-rose-600 font-semibold">Action Needed</span>
            </div>
            <div className="pt-1 border-t border-slate-100 flex items-center gap-1 text-[11px] text-rose-700">
              <Link to="/documents" className="font-semibold underline hover:text-rose-800 inline-flex items-center gap-1">
                <span>Upload Income Certificate</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECOMMENDATION SUMMARY STATISTICS COUNTERS (Status Breakdown)          */}
      {/* ========================================================================= */}
      <section aria-labelledby="recommendation-summary-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="recommendation-summary-heading" className="text-base sm:text-lg font-bold text-slate-900">
            Eligibility Evaluation Summary
          </h2>
          <span className="text-xs text-slate-500">
            {recommendationSummary.totalEvaluated} scheme{recommendationSummary.totalEvaluated === 1 ? '' : 's'} evaluated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/recommendations?status=ELIGIBLE"
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-900">Eligible</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {recommendationSummary.eligible}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">Meets all verified criteria</p>
          </Link>

          <Link
            to="/recommendations?status=LIKELY_ELIGIBLE"
            className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-900">Likely Eligible</span>
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">
              {recommendationSummary.likelyEligible}
            </div>
            <p className="text-[11px] text-blue-700/80 mt-1">Minor optional criteria unverified</p>
          </Link>

          <Link
            to="/recommendations?status=NEEDS_VERIFICATION"
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-900">Needs Verification</span>
              <FileQuestion className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              {recommendationSummary.needsVerification}
            </div>
            <p className="text-[11px] text-amber-700/80 mt-1">Requires certificate verification</p>
          </Link>

          <Link
            to="/recommendations?expiringSoon=true"
            className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-rose-900">Closing Soon</span>
              <Clock className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-700">
              {recommendationSummary.expiringSoon}
            </div>
            <p className="text-[11px] text-rose-700/80 mt-1">Application deadline within 14 days</p>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. RECOMMENDED ACTION ITEMS & NEXT STEPS                                  */}
      {/* ========================================================================= */}
      {(actionItems ?? []).length > 0 && (
        <section aria-labelledby="action-items-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="action-items-heading" className="text-base sm:text-lg font-bold text-slate-900">
              Recommended Action Items
            </h2>
            <span className="text-xs text-slate-500">
              {(actionItems ?? []).length} action{(actionItems ?? []).length === 1 ? '' : 's'} required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(actionItems ?? []).map((action) => (
              <div
                key={action.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs flex items-start justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        action.priority === 'HIGH'
                          ? 'bg-rose-500'
                          : action.priority === 'MEDIUM'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <h3 className="font-bold text-sm text-slate-900">{action.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{action.description}</p>
                </div>
                <Link to={action.ctaLink} className="shrink-0 self-center">
                  <Button variant="outline" size="sm" className="text-xs font-semibold">
                    <span>{action.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE TABBED DATA SECTIONS                                       */}
      {/* ========================================================================= */}
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6 sm:space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('MATCHED')}
              className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'MATCHED'
                  ? 'border-gov-800 text-gov-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Matched & Recommended Schemes</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                {(filteredRecommendations ?? []).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('APPLICATIONS')}
              className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'APPLICATIONS'
                  ? 'border-gov-800 text-gov-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Application Tracker</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
                {(applications ?? []).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ALERTS')}
              className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'ALERTS'
                  ? 'border-gov-800 text-gov-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Real-Time Alerts & Deadlines</span>
              {((closingSoon ?? []).length > 0 || (actionItems ?? []).length > 0) && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
                  {(closingSoon ?? []).length + (actionItems ?? []).length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 1: MATCHED / RECOMMENDED SCHEMES                                    */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'MATCHED' && (
          <div className="space-y-5">
            {/* Interactive Filters Bar */}
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search schemes..."
                      className="pl-9 h-10 text-xs"
                    />
                  </div>

                  {/* Ministry / Department Filter */}
                  <div>
                    <Select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="h-10 text-xs"
                    >
                      <option value="ALL">All Ministries / Depts</option>
                      {(departmentOptions ?? []).map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Benefit Type Filter */}
                  <div>
                    <Select
                      value={selectedBenefitType}
                      onChange={(e) => setSelectedBenefitType(e.target.value)}
                      className="h-10 text-xs"
                    >
                      <option value="ALL">All Benefit Types</option>
                      <option value="FEE_REIMBURSEMENT">Tuition / Fee Waiver</option>
                      <option value="DIRECT_BENEFIT">Direct Benefit Transfer</option>
                      <option value="SUBSIDY">Interest / Cost Subsidy</option>
                      <option value="LOAN">Subsidized Education Loan</option>
                    </Select>
                  </div>

                  {/* Application Status Filter */}
                  <div>
                    <Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="h-10 text-xs"
                    >
                      <option value="ALL">All Application Windows</option>
                      <option value="OPEN">Open Now</option>
                      <option value="CLOSING_SOON">Closing Soon (&le; 14 days)</option>
                    </Select>
                  </div>
                </div>

                {/* Filter tags & Reset */}
                {(searchQuery || selectedDepartment !== 'ALL' || selectedBenefitType !== 'ALL' || selectedStatus !== 'ALL') && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Filtered: {(filteredRecommendations ?? []).length} of {(topRecommendations ?? []).length} recommendations
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="text-xs text-gov-800 hover:text-gov-900 font-semibold h-7 px-2"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      <span>Reset Filters</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schemes List / Empty State */}
            {(filteredRecommendations ?? []).length === 0 ? (
              <EmptyState
                title="No Matching Schemes Found"
                description={
                  (topRecommendations ?? []).length === 0
                    ? 'Complete your citizen profile to unlock statutory recommendations matched against your education and income.'
                    : 'No schemes match the selected filters. Try broadening your criteria or reset filters.'
                }
                action={
                  (topRecommendations ?? []).length === 0 ? (
                    <Link to="/profile">
                      <Button size="sm" variant="primary" className="text-xs">
                        Complete Citizen Profile
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleResetFilters} className="text-xs">
                      Reset Filters
                    </Button>
                  )
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(filteredRecommendations ?? []).map((rec) => {
                  const match = computeSchemeMatchScore(rec, profile);
                  return (
                    <div key={rec.id} className="relative flex flex-col">
                      {/* Match Score Ribbon */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white shadow-xs">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>{match.score}% Match</span>
                        </span>
                      </div>

                      <SchemeCard
                        scheme={{
                          id: rec.schemeId,
                          slug: rec.slug,
                          name: rec.schemeName,
                          shortName: null,
                          programType: rec.programType,
                          categories: rec.categories || [],
                          departmentName: rec.departmentName || rec.department || 'Government Department',
                          departmentLevel: 'STATE',
                          stateScope: rec.stateScope || 'All India',
                          verificationStatus: 'VERIFIED',
                          primaryBenefit: rec.primaryBenefit,
                          activeApplicationPeriod: rec.deadline
                            ? {
                                title: 'Application Window',
                                openDate: null,
                                closeDate: rec.deadline,
                                status: rec.applicationStatus === 'OPEN' ? 'OPEN' : 'CLOSED',
                              }
                            : null,
                          applicationMethod: 'ONLINE',
                          isSaved: isSaved(rec.schemeId),
                          userRecommendationStatus: rec.eligibilityStatus,
                        }}
                        isSaved={isSaved(rec.schemeId)}
                        onToggleSave={toggleSave}
                        isComparing={isSelected(rec.schemeId)}
                        onToggleCompare={toggleCompare}
                        recommendationStatus={rec.eligibilityStatus}
                      />

                      {/* Card Footer: Match Reasons + Direct Apply Now Button */}
                      <div className="-mt-2 pt-3 px-4 pb-3 rounded-b-xl border-x border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {(match.reasons ?? []).slice(0, 2).map((r, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600 font-medium"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleApplyClick(rec)}
                          className="text-xs h-7 px-3 bg-gov-800 hover:bg-gov-900 text-white font-bold shrink-0"
                        >
                          <span>Apply Now</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 2: APPLICATION TRACKER                                              */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'APPLICATIONS' && (
          <div className="space-y-5">
            {/* Sub-filter tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Filter By Status:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setAppStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      appStatusFilter === 'ALL'
                        ? 'bg-gov-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({(applications ?? []).length})
                  </button>
                  <button
                    onClick={() => setAppStatusFilter('IN_REVIEW')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      appStatusFilter === 'IN_REVIEW'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    In Review ({inReviewApplicationsCount})
                  </button>
                  <button
                    onClick={() => setAppStatusFilter('APPROVED')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      appStatusFilter === 'APPROVED'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Approved ({approvedApplicationsCount})
                  </button>
                  <button
                    onClick={() => setAppStatusFilter('DISBURSED')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      appStatusFilter === 'DISBURSED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Disbursed ({disbursedApplicationsCount})
                  </button>
                </div>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                Live State Synchronized via Public Finance Management System (PFMS)
              </span>
            </div>

            {/* Applications List */}
            {(filteredApplications ?? []).length === 0 ? (
              <EmptyState
                title="No Tracked Applications"
                description="You do not have any applications in this status. Select 'Matched & Recommended Schemes' to submit and track a new statutory application."
                action={
                  <Button size="sm" variant="primary" onClick={() => setActiveTab('MATCHED')} className="text-xs">
                    Browse Matched Schemes
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {(filteredApplications ?? []).map((app: TrackedApplication) => {
                  return (
                    <Card key={app.id} className="border-slate-200 bg-white hover:border-slate-300 transition-all">
                      <CardContent className="p-5 sm:p-6 space-y-6">
                        {/* Header: Title, Ref, Dept, Benefit Amount */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                {app.applicationRef}
                              </span>
                              <Badge
                                variant={
                                  app.currentStage === 'DISBURSED'
                                    ? 'success'
                                    : app.currentStage === 'DEPT_APPROVAL'
                                    ? 'warning'
                                    : 'info'
                                }
                                className="text-[11px]"
                              >
                                {app.statusLabel}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                Applied: {new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                              {app.schemeName}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{app.department}</span>
                            </p>
                          </div>

                          <div className="text-left lg:text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                            <div className="text-xs text-slate-500 font-semibold">Estimated Direct Benefit</div>
                            <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">
                              ₹{app.estimatedBenefit.toLocaleString('en-IN')}
                            </div>
                            <p className="text-[11px] text-slate-500">{app.benefitType}</p>
                          </div>
                        </div>

                        {/* Visual Step-Timeline Stepper */}
                        <div>
                          <div className="text-xs font-bold text-slate-700 mb-4">
                            Statutory Processing Timeline:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative">
                            {(app.stages ?? []).map((step, idx) => {
                              const isCompleted = step.status === 'COMPLETED';
                              const isInProgress = step.status === 'IN_PROGRESS';

                              return (
                                <div key={step.stage} className="relative flex flex-col space-y-1.5">
                                  {/* Step Connector Line for Desktop */}
                                  {idx < (app.stages ?? []).length - 1 && (
                                    <div
                                      className={`hidden sm:block absolute top-3.5 left-1/2 w-full h-0.5 z-0 ${
                                        isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                                      }`}
                                    />
                                  )}

                                  <div className="flex items-center gap-2 z-10">
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                                        isCompleted
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : isInProgress
                                          ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                                          : 'bg-slate-100 text-slate-400 border border-slate-300'
                                      }`}
                                    >
                                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <span
                                      className={`text-xs font-bold ${
                                        isCompleted
                                          ? 'text-emerald-900'
                                          : isInProgress
                                          ? 'text-amber-900'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {step.label}
                                    </span>
                                  </div>

                                  <div className="pl-9 sm:pl-0 space-y-0.5">
                                    {step.date && (
                                      <p className="text-[11px] font-semibold text-slate-600">
                                        {step.date}
                                      </p>
                                    )}
                                    {step.note && (
                                      <p className="text-[11px] text-slate-500 leading-tight">
                                        {step.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Remarks Banner */}
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800">Officer Verification Remarks:</span>
                            <p className="text-slate-600">{app.remarks}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showToast(`Receipt generated for application ${app.applicationRef}`, 'info')}
                            className="text-xs font-semibold shrink-0"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            <span>View Receipt</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 3: REAL-TIME ALERTS & DEADLINE TICKER                               */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'ALERTS' && (
          <div className="space-y-6">
            {/* Urgent Closing Soon Deadline Ticker */}
            {(closingSoon ?? []).length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Application Deadlines Closing Soon (&le; 14 Days)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(closingSoon ?? []).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 flex items-start justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                            {rec.daysUntilDeadline != null ? `${rec.daysUntilDeadline} Days Left` : 'Closing Soon'}
                          </span>
                          <span className="text-xs text-rose-900 font-semibold">{rec.schemeName}</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {rec.departmentName || rec.department || 'Government Nodal Desk'}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApplyClick(rec)}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0"
                      >
                        <span>Apply</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Action Items List */}
            {(actionItems ?? []).length > 0 && (
              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  Recommended Action Items
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(actionItems ?? []).map((action) => (
                    <div
                      key={action.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs flex items-start justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              action.priority === 'HIGH'
                                ? 'bg-rose-500'
                                : action.priority === 'MEDIUM'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          <h4 className="font-bold text-sm text-slate-900">{action.title}</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{action.description}</p>
                      </div>
                      <Link to={action.ctaLink} className="shrink-0 self-center">
                        <Button variant="outline" size="sm" className="text-xs font-semibold">
                          <span>{action.ctaText}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Real-time System Audit Feeds */}
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live Public Benefit Audit Logs
                </h4>
                <div className="divide-y divide-slate-100 text-xs text-slate-600">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>UIDAI Aadhaar Authentication Bridge validated for citizen record</span>
                    </span>
                    <span className="text-[11px] text-slate-400">2 min ago</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Public Finance Management System (PFMS) reconciliation batch active</span>
                    </span>
                    <span className="text-[11px] text-slate-400">14 min ago</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>DigiLocker certificate verification gateway synced</span>
                    </span>
                    <span className="text-[11px] text-slate-400">1 hr ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. SAVED SCHEMES QUICK ACCESS PREVIEW                                     */}
      {/* ========================================================================= */}
      <section aria-labelledby="saved-schemes-heading" className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-600" />
            <div>
              <h2 id="saved-schemes-heading" className="text-base sm:text-lg font-bold text-slate-900">
                My Saved Schemes
              </h2>
              <p className="text-xs text-slate-500">
                {savedTotal} scheme{savedTotal === 1 ? '' : 's'} bookmarked for quick access
              </p>
            </div>
          </div>
          <Link to="/saved">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              <span>View All Saved ({savedTotal})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {(savedSchemesList ?? []).length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="py-8 text-center space-y-2">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                You haven&apos;t saved any schemes yet. Click the bookmark icon on any scheme card to save it here.
              </p>
              <Link to="/schemes">
                <Button size="sm" variant="ghost" className="text-xs text-gov-800 font-semibold">
                  Browse Schemes Directory &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(savedSchemesList ?? []).map((item) => (
              <SchemeCard
                key={item.savedId}
                scheme={{
                  id: item.scheme.id,
                  slug: item.scheme.slug,
                  name: item.scheme.name,
                  shortName: item.scheme.shortName,
                  shortDescription: item.scheme.shortDescription,
                  programType: item.scheme.programType,
                  categories: item.scheme.categories || [],
                  departmentName: item.scheme.departmentName || 'Government',
                  departmentLevel: 'STATE',
                  stateScope: item.scheme.stateScope || 'All India',
                  verificationStatus: 'VERIFIED',
                  primaryBenefit: item.scheme.primaryBenefit,
                  activeApplicationPeriod: item.scheme.activeApplicationPeriod
                    ? {
                        title: item.scheme.activeApplicationPeriod.title,
                        openDate: item.scheme.activeApplicationPeriod.openDate,
                        closeDate: item.scheme.activeApplicationPeriod.closeDate,
                        status: item.scheme.activeApplicationPeriod.status,
                      }
                    : null,
                  applicationMethod: 'ONLINE',
                  isSaved: true,
                  userRecommendationStatus: item.recommendation?.eligibilityStatus || null,
                }}
                isSaved={true}
                onToggleSave={toggleSave}
                isComparing={isSelected(item.scheme.id)}
                onToggleCompare={toggleCompare}
                recommendationStatus={item.recommendation?.eligibilityStatus}
              />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. STATUTORY GOVERNMENT DISCLAIMER                                        */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-gov-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Decision Support Platform:</strong> This portal provides indicative eligibility matching
          based on statutory provisions. Final verification and disbursement decisions remain the exclusive
          statutory jurisdiction of the respective Government Ministry or Department.
        </p>
      </div>

      {/* Floating Comparison Tray */}
      <CompareTray selectedIds={selectedIds} onClear={clearCompare} />

      {/* ========================================================================= */}
      {/* APPLY NOW MODAL TRIGGER                                                   */}
      {/* ========================================================================= */}
      {applyingScheme && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gov-100 text-gov-800">
                  {applyingScheme.programType}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {applyingScheme.schemeName}
                </h3>
                <p className="text-xs text-slate-500">{applyingScheme.departmentName}</p>
              </div>
              <button
                onClick={() => setApplyingScheme(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Statutory Benefit:</span>
                <span className="font-bold text-slate-900">
                  {applyingScheme.primaryBenefit?.description || 'Tuition / Cash Transfer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Value:</span>
                <span className="font-bold text-emerald-700">
                  ₹{(applyingScheme.primaryBenefit?.amount || 50000).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Citizen Profile Match:</span>
                <span className="font-bold text-emerald-700">96% Matched</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Recording this application will register it in your live application tracker stepper.
              You will receive real-time notifications as statutory nodal officers verify documents and authorize disbursement.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApplyingScheme(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmApplication}
                className="bg-gov-800 hover:bg-gov-900 text-white font-bold text-xs"
              >
                <span>Track Application in Portal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXPORT CITIZEN BENEFIT SUMMARY PDF MODAL                                  */}
      {/* ========================================================================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Official printable document header */}
            <div className="border-b-2 border-gov-900 pb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-gov-800">
                  Government of India &bull; State Welfare Council
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Citizen Public Benefit Summary Report
                </h2>
                <div className="text-xs text-slate-500">
                  Generated On: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded bg-gov-100 text-gov-900 font-mono text-xs font-bold">
                  {citizenId}
                </span>
              </div>
            </div>

            {/* Citizen Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Citizen Name</span>
                <span className="font-bold text-slate-900">{citizenName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">State Jurisdiction</span>
                <span className="font-bold text-slate-900">{profile.state || 'Tamil Nadu'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Social Category</span>
                <span className="font-bold text-slate-900">{profile.category || 'OBC'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Education Level</span>
                <span className="font-bold text-slate-900">{profile.educationLevel || 'Undergraduate'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Annual Family Income</span>
                <span className="font-bold text-slate-900">₹{(profile.income || 180000).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">DBT Readiness</span>
                <span className="font-bold text-emerald-700">Aadhaar Linked & Verified</span>
              </div>
            </div>

            {/* Active Schemes & Summary */}
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Active Tracked Applications:
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                {(applications ?? []).map((app) => (
                  <div key={app.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{app.schemeName}</div>
                      <div className="text-[11px] text-slate-500">Ref: {app.applicationRef} &bull; {app.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700">₹{app.estimatedBenefit.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] font-semibold text-slate-600">{app.statusLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Estimated Benefit */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-950">Total Potential Direct Benefit Disbursable:</span>
              <span className="text-lg font-extrabold text-emerald-800">{formattedBenefit}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.print();
                  showToast('Print command initiated.', 'success');
                }}
                className="bg-gov-900 hover:bg-gov-800 text-white font-bold text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                <span>Print / Save PDF</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
export default DashboardPage;
