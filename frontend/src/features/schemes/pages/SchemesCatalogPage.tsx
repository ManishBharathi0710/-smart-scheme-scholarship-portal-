import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  ShieldCheck,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { schemesApi } from '../api/schemes.api';
import {
  ProgramType,
  SchemeCategory,
  ApplicationCycleStatus,
} from '../../../types/scheme';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Skeleton,
} from '../../../components/ui';
import { SchemeCard } from '../components/SchemeCard';
import { CompareTray } from '../components/CompareTray';
import { useSavedSchemes } from '../../saved-schemes/hooks/useSavedSchemes';
import { useCompareSelection } from '../hooks/useCompareSelection';

const PROGRAM_TYPES: { value: ProgramType; label: string }[] = [
  { value: 'SCHOLARSHIP', label: 'Scholarship' },
  { value: 'WELFARE_SCHEME', label: 'Welfare Scheme' },
  { value: 'SUBSIDY', label: 'Subsidy' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'PENSION', label: 'Pension' },
  { value: 'TRAINING', label: 'Training & Skill Development' },
  { value: 'EMPLOYMENT', label: 'Employment Assistance' },
  { value: 'ENTREPRENEURSHIP', label: 'Entrepreneurship Grant' },
  { value: 'HEALTHCARE', label: 'Healthcare Assistance' },
  { value: 'HOUSING', label: 'Housing Grant' },
  { value: 'AGRICULTURE', label: 'Agriculture & Farming' },
  { value: 'EDUCATION', label: 'Education Support' },
  { value: 'OTHER', label: 'Other Public Benefits' },
];

const CATEGORIES: { value: SchemeCategory; label: string }[] = [
  { value: 'EDUCATION', label: 'Education' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'EMPLOYMENT', label: 'Employment' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'HOUSING', label: 'Housing' },
  { value: 'FINANCIAL_ASSISTANCE', label: 'Financial Assistance' },
  { value: 'ENTREPRENEURSHIP', label: 'Entrepreneurship' },
  { value: 'SOCIAL_SECURITY', label: 'Social Security' },
  { value: 'SKILL_DEVELOPMENT', label: 'Skill Development' },
  { value: 'WOMEN', label: 'Women Empowerment' },
  { value: 'CHILDREN', label: 'Child Welfare' },
  { value: 'SENIOR_CITIZENS', label: 'Senior Citizens' },
  { value: 'PERSONS_WITH_DISABILITIES', label: 'Persons with Disabilities' },
  { value: 'STUDENT_SUPPORT', label: 'Student Support' },
  { value: 'OTHER', label: 'Other Categories' },
];

export const SchemesCatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL search params with fallback
  const urlSearch = searchParams.get('q') || searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlType = searchParams.get('programType') || '';
  const urlStatus = searchParams.get('applicationStatus') || '';
  const urlSort = searchParams.get('sort') || 'updatedAt';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Synchronize search input if URL changes externally
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const { isSaved, toggleSave } = useSavedSchemes();
  const { selectedIds, isSelected, toggleCompare, clearCompare } = useCompareSelection();

  // Query published schemes with URL persistence
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'published-schemes',
      urlPage,
      urlSearch,
      urlCategory,
      urlType,
      urlStatus,
      urlSort,
    ],
    queryFn: () =>
      schemesApi.getPublishedSchemes({
        page: urlPage,
        pageSize: 12,
        search: urlSearch || undefined,
        category: (urlCategory as SchemeCategory) || undefined,
        programType: (urlType as ProgramType) || undefined,
        applicationStatus: (urlStatus as ApplicationCycleStatus) || undefined,
        sortBy: urlSort === 'name' ? 'name' : urlSort === 'newest' ? 'createdAt' : 'updatedAt',
        sortOrder: urlSort === 'name' ? 'asc' : 'desc',
      }),
  });

  const updateFilters = (newParams: Record<string, string | number | undefined>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === '' || (key === 'page' && value === 1)) {
        updated.delete(key);
      } else {
        updated.set(key, String(value));
      }
    });
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput.trim() || undefined, page: 1 });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(urlSearch || urlCategory || urlType || urlStatus || (urlSort && urlSort !== 'updatedAt'));

  return (
    <PageContainer className="py-8 space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-gov-900 via-gov-900 to-gov-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gov-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gov-800 text-xs font-semibold text-amber-300 mb-3 border border-gov-700">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Government Central &amp; State Schemes</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Public Scheme &amp; Scholarship Discovery Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Browse all publicly available welfare schemes, educational fee subsidies, scholarships, and grants.
          Verified against official gazettes with transparent statutory eligibility requirements.
        </p>
      </div>

      {/* 2. Search & Sort Top Bar */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by scheme name, keywords, ministry, or department..."
                className="pl-10 text-xs sm:text-sm h-11"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateFilters({ q: undefined, page: 1 });
                  }}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Button type="submit" variant="primary" className="h-11 px-6 text-xs sm:text-sm font-bold shrink-0">
              Search
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="h-11 md:hidden flex items-center justify-center gap-1.5 text-xs font-semibold"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters {hasActiveFilters && '(Active)'}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Main Discovery Workspace: Filter Sidebar + Scheme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Filter Sidebar (Desktop + Mobile Drawer) */}
        <aside
          className={`space-y-6 md:block ${
            isMobileFilterOpen
              ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block'
              : 'hidden md:block'
          }`}
        >
          <div className="bg-white md:border border-slate-200 rounded-xl p-5 md:p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gov-800" />
                <h2 className="font-bold text-sm text-slate-900">Discovery Filters</h2>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Reset All
                </button>
              )}
              {isMobileFilterOpen && (
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="md:hidden text-slate-400 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5">
              <label htmlFor="filter-sort-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sort Results
              </label>
              <Select
                id="filter-sort-select"
                value={urlSort}
                onChange={(e) => updateFilters({ sort: e.target.value, page: 1 })}
                className="text-xs"
              >
                <option value="updatedAt">Recently Updated</option>
                <option value="newest">Newest First</option>
                <option value="name">Name (A &rarr; Z)</option>
              </Select>
            </div>

            {/* Program Type */}
            <div className="space-y-1.5">
              <label htmlFor="filter-program-type-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Program Type
              </label>
              <Select
                id="filter-program-type-select"
                value={urlType}
                onChange={(e) => updateFilters({ programType: e.target.value || undefined, page: 1 })}
                className="text-xs"
              >
                <option value="">All Program Types</option>
                {PROGRAM_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Scheme Category */}
            <div className="space-y-1.5">
              <label htmlFor="filter-category-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Category
              </label>
              <Select
                id="filter-category-select"
                value={urlCategory}
                onChange={(e) => updateFilters({ category: e.target.value || undefined, page: 1 })}
                className="text-xs"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Application Cycle Status */}
            <div className="space-y-1.5">
              <label htmlFor="filter-app-status-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Application Status
              </label>
              <Select
                id="filter-app-status-select"
                value={urlStatus}
                onChange={(e) =>
                  updateFilters({ applicationStatus: e.target.value || undefined, page: 1 })
                }
                className="text-xs"
              >
                <option value="">All Application Statuses</option>
                <option value="OPEN">Application Open</option>
                <option value="UPCOMING">Upcoming Cycle</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </div>

            {isMobileFilterOpen && (
              <Button
                variant="primary"
                className="w-full mt-4 text-xs font-bold"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Apply Filters
              </Button>
            )}
          </div>
        </aside>

        {/* Scheme Grid & Pagination */}
        <section aria-label="Available Schemes" className="md:col-span-3 space-y-6">
          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold text-[11px] uppercase">Active:</span>

              {urlSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                  Search: <strong>&ldquo;{urlSearch}&rdquo;</strong>
                  <button
                    type="button"
                    onClick={() => updateFilters({ q: undefined, page: 1 })}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}

              {urlType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                  Type: <strong>{urlType.replace(/_/g, ' ')}</strong>
                  <button
                    type="button"
                    onClick={() => updateFilters({ programType: undefined, page: 1 })}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}

              {urlCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                  Category: <strong>{urlCategory.replace(/_/g, ' ')}</strong>
                  <button
                    type="button"
                    onClick={() => updateFilters({ category: undefined, page: 1 })}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}

              {urlStatus && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                  Status: <strong>{urlStatus}</strong>
                  <button
                    type="button"
                    onClick={() => updateFilters({ applicationStatus: undefined, page: 1 })}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-auto"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Scheme Items Grid / Loading / Empty State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx} className="h-64 border-slate-200 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="pt-6 flex justify-between items-center">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card className="border-red-200 bg-red-50/50 p-8 text-center space-y-3">
              <p className="text-sm font-bold text-red-900">Failed to load published schemes</p>
              <p className="text-xs text-red-600">Please verify your connection and try again.</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </Card>
          ) : data?.items.length === 0 ? (
            <Card className="border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-900">No schemes found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                No verified public schemes matched your current search and filter combination.
                Try adjusting your criteria or clearing filters.
              </p>
              <Button size="sm" variant="outline" onClick={clearAllFilters} className="text-xs font-semibold">
                Clear Filters
              </Button>
            </Card>
          ) : (
            <>
              {/* Scheme Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {data?.items.map((scheme) => (
                  <SchemeCard
                    key={scheme.id}
                    scheme={scheme}
                    isSaved={isSaved(scheme.id)}
                    onToggleSave={toggleSave}
                    isComparing={isSelected(scheme.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>

              {/* Pagination Bar */}
              {data && data.pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
                  <p className="text-slate-500">
                    Showing{' '}
                    <strong>
                      {(data.pagination.page - 1) * data.pagination.pageSize + 1} -{' '}
                      {Math.min(
                        data.pagination.page * data.pagination.pageSize,
                        data.pagination.total,
                      )}
                    </strong>{' '}
                    of <strong>{data.pagination.total}</strong> schemes
                  </p>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.pagination.page <= 1}
                      onClick={() => updateFilters({ page: data.pagination.page - 1 })}
                      className="text-xs px-2.5 h-8"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                      <span>Previous</span>
                    </Button>

                    <span className="px-3 py-1 font-semibold text-slate-700 bg-slate-100 rounded-md">
                      Page {data.pagination.page} of {data.pagination.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.pagination.page >= data.pagination.totalPages}
                      onClick={() => updateFilters({ page: data.pagination.page + 1 })}
                      className="text-xs px-2.5 h-8"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Floating Comparison Tray */}
      <CompareTray selectedIds={selectedIds} onClear={clearCompare} />
    </PageContainer>
  );
};
