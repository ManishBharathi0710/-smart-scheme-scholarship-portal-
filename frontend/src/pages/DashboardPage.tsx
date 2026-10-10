import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
  Clock,
  Bookmark,
  ArrowRight,
  RefreshCw,
  Award,
  BookOpen,
  Wheat,
  Briefcase,
  HeartPulse,
  Home,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { dashboardApi } from '../features/dashboard/api/dashboard.api';
import { recommendationsApi } from '../features/recommendations/api/recommendations.api';
import { useSavedSchemes } from '../features/saved-schemes/hooks/useSavedSchemes';
import { useCompareSelection } from '../features/schemes/hooks/useCompareSelection';
import { SchemeCard } from '../features/schemes/components/SchemeCard';
import { CompareTray } from '../features/schemes/components/CompareTray';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Input,
  Spinner,
  useToast,
} from '../components/ui';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [quickSearch, setQuickSearch] = useState('');

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

  // 2. Mutation to refresh recommendations deterministically via Module 4 API
  const refreshMutation = useMutation({
    mutationFn: () => recommendationsApi.refreshRecommendations(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['user-recommendations'] });
      showToast('Recommendations refreshed against latest scheme criteria.', 'success');
    },
    onError: () => {
      showToast('Could not refresh recommendations. Please try again.', 'error');
    },
  });

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/schemes?q=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      navigate('/schemes');
    }
  };

  const handleCategoryPillClick = (category: string) => {
    navigate(`/schemes?category=${category}`);
  };

  if (isLoading) {
    return (
      <PageContainer className="py-20 text-center space-y-3">
        <Spinner size="lg" label="Loading citizen discovery dashboard..." />
        <p className="text-xs text-slate-500 font-medium">
          Retrieving personalized recommendations and verified benefit status...
        </p>
      </PageContainer>
    );
  }

  if (isError || !dashboard) {
    return (
      <PageContainer className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Dashboard Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          We encountered an issue loading your personalized dashboard. Please check your connection and try again.
        </p>
        <Button variant="outline" onClick={() => refetch()} className="text-xs">
          Try Again
        </Button>
      </PageContainer>
    );
  }

  const { profile, recommendationSummary, topRecommendations, closingSoon, savedSchemes, actionItems } =
    dashboard;

  return (
    <PageContainer className="py-8 space-y-8">
      {/* 1. Welcome & Profile Readiness Banner */}
      <div className="bg-gradient-to-r from-gov-900 via-gov-900 to-gov-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border border-gov-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gov-800 text-xs font-semibold text-amber-300 border border-gov-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Citizen Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {profile.fullName || user?.email?.split('@')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Discover verified public scholarships, welfare initiatives, and educational fee subsidies
            evaluated deterministically against your profile criteria.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="border-slate-600 bg-slate-800/80 text-white hover:bg-slate-700 text-xs font-semibold"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${refreshMutation.isPending ? 'animate-spin' : ''}`}
            />
            <span>Refresh Matches</span>
          </Button>

          <Link to="/profile">
            <Button
              variant="primary"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-transparent text-xs w-full sm:w-auto"
            >
              <span>Edit Profile</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Completion / Readiness Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {`Profile ${profile.completionPercentage}% Complete`}
            </span>
            <span className="text-[11px] text-slate-500">
              ({profile.isReadyForRecommendations ? 'Ready for evaluations' : 'Action required'})
            </span>
          </div>
          <p className="text-xs text-slate-600">{profile.summary}</p>
        </div>
        <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gov-800 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${profile.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* 2. Quick Search & Category Shortcuts Bar */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <form onSubmit={handleQuickSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <Input
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="What scheme, scholarship, or subsidy are you looking for?..."
                className="pl-10 text-xs sm:text-sm h-11"
              />
            </div>
            <Button type="submit" variant="primary" className="h-11 px-6 text-xs sm:text-sm font-bold">
              <span>Search Directory</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Category Quick Pills */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold shrink-0 text-[11px] uppercase tracking-wider">
              Popular:
            </span>
            <button
              type="button"
              onClick={() => handleCategoryPillClick('EDUCATION')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-gov-700" />
              <span>Education</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryPillClick('AGRICULTURE')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors shrink-0"
            >
              <Wheat className="w-3.5 h-3.5 text-emerald-700" />
              <span>Agriculture</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryPillClick('EMPLOYMENT')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors shrink-0"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-700" />
              <span>Employment</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryPillClick('HEALTH')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors shrink-0"
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-700" />
              <span>Health</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryPillClick('HOUSING')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors shrink-0"
            >
              <Home className="w-3.5 h-3.5 text-amber-700" />
              <span>Housing</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Recommendation Summary Statistics Counters */}
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
          {/* Eligible */}
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

          {/* Likely Eligible */}
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

          {/* Needs Verification */}
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

          {/* Closing Soon */}
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

      {/* 4. Action Items & Profile Readiness */}
      {actionItems.length > 0 && (
        <section aria-labelledby="action-items-heading" className="space-y-3">
          <h2 id="action-items-heading" className="text-base sm:text-lg font-bold text-slate-900">
            Recommended Action Items
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {actionItems.map((action) => (
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

      {/* 5. Recommended For You Section */}
      <section aria-labelledby="top-recommendations-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="top-recommendations-heading" className="text-lg sm:text-xl font-bold text-slate-900">
              Recommended For You
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory benefits matched deterministically against your verified criteria
            </p>
          </div>
          <Link to="/recommendations">
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-gov-800">
              <span>View All Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {topRecommendations.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="py-12 text-center space-y-3">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">No Recommendations Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Complete your citizen profile to allow the deterministic recommendation engine to identify
                schemes matching your qualifications.
              </p>
              <Link to="/profile">
                <Button size="sm" variant="primary" className="text-xs">
                  Complete Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {topRecommendations.map((rec) => (
              <SchemeCard
                key={rec.id}
                scheme={{
                  id: rec.schemeId,
                  slug: rec.slug,
                  name: rec.schemeName,
                  shortName: null,
                  programType: rec.programType,
                  categories: rec.categories || [],
                  departmentName: rec.departmentName || rec.department || 'Government',
                  departmentLevel: 'STATE',
                  stateScope: rec.stateScope || 'All India',
                  verificationStatus: 'VERIFIED',
                  primaryBenefit: rec.primaryBenefit,
                  activeApplicationPeriod: rec.deadline
                    ? {
                        title: 'Application Window',
                        openDate: null,
                        closeDate: rec.deadline,
                        status: rec.applicationStatus === 'OPEN' ? 'OPEN' : rec.applicationStatus === 'UPCOMING' ? 'UPCOMING' : 'CLOSED',
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
            ))}
          </div>
        )}
      </section>

      {/* 6. Closing Soon Schemes (if available) */}
      {closingSoon.length > 0 && (
        <section aria-labelledby="closing-soon-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-600" />
              <div>
                <h2 id="closing-soon-heading" className="text-lg font-bold text-slate-900">
                  Application Deadlines Closing Soon
                </h2>
                <p className="text-xs text-slate-500">
                  Verified programs with application windows closing within 14 days
                </p>
              </div>
            </div>
            <Link to="/schemes?sort=deadline">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-700">
                <span>View All Deadlines</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {closingSoon.map((rec) => (
              <SchemeCard
                key={rec.id}
                scheme={{
                  id: rec.schemeId,
                  slug: rec.slug,
                  name: rec.schemeName,
                  shortName: null,
                  programType: rec.programType,
                  categories: rec.categories || [],
                  departmentName: rec.departmentName || rec.department || 'Government',
                  departmentLevel: 'STATE',
                  stateScope: rec.stateScope || 'All India',
                  verificationStatus: 'VERIFIED',
                  primaryBenefit: rec.primaryBenefit,
                  activeApplicationPeriod: rec.deadline
                    ? {
                        title: 'Application Window',
                        openDate: null,
                        closeDate: rec.deadline,
                        status: rec.applicationStatus === 'OPEN' ? 'OPEN' : rec.applicationStatus === 'UPCOMING' ? 'UPCOMING' : 'CLOSED',
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
            ))}
          </div>
        </section>
      )}

      {/* 7. Saved Schemes Preview Section */}
      <section aria-labelledby="saved-schemes-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-600" />
            <div>
              <h2 id="saved-schemes-heading" className="text-lg font-bold text-slate-900">
                My Saved Schemes
              </h2>
              <p className="text-xs text-slate-500">
                {savedSchemes.total} scheme{savedSchemes.total === 1 ? '' : 's'} bookmarked for quick access
              </p>
            </div>
          </div>
          <Link to="/saved">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              <span>View All Saved ({savedSchemes.total})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {savedSchemes.preview.length === 0 ? (
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
            {savedSchemes.preview.map((item) => (
              <SchemeCard
                key={item.savedId}
                scheme={{
                  id: item.scheme.id,
                  slug: item.scheme.slug,
                  name: item.scheme.name,
                  shortName: item.scheme.shortName,
                  shortDescription: item.scheme.shortDescription,
                  programType: item.scheme.programType,
                  categories: item.scheme.categories,
                  departmentName: item.scheme.departmentName,
                  departmentLevel: 'STATE',
                  stateScope: item.scheme.stateScope,
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

      {/* 8. Factual Government Disclaimer */}
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
    </PageContainer>
  );
};
