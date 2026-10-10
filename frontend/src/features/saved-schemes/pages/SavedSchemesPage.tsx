import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bookmark,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { savedSchemesApi } from '../api/saved-schemes.api';
import { useSavedSchemes } from '../hooks/useSavedSchemes';
import { useCompareSelection } from '../../schemes/hooks/useCompareSelection';
import { SchemeCard } from '../../schemes/components/SchemeCard';
import { CompareTray } from '../../schemes/components/CompareTray';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Skeleton,
} from '../../../components/ui';

export const SavedSchemesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const { toggleSave } = useSavedSchemes();
  const { selectedIds, isSelected, toggleCompare, clearCompare } = useCompareSelection();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['saved-schemes', page, filterType],
    queryFn: () =>
      savedSchemesApi.getSavedSchemes({
        page,
        pageSize: 12,
        programType: filterType || undefined,
      }),
  });

  const filteredItems = (data?.items || []).filter((item) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      item.scheme.name.toLowerCase().includes(term) ||
      (item.scheme.shortDescription && item.scheme.shortDescription.toLowerCase().includes(term)) ||
      item.scheme.departmentName.toLowerCase().includes(term)
    );
  });

  return (
    <PageContainer className="py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gov-900 via-gov-900 to-gov-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gov-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gov-800 text-xs font-semibold text-amber-300 border border-gov-700">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Personal Bookmarks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            My Saved Schemes &amp; Scholarships
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Keep track of government schemes, subsidies, and scholarships you are interested in.
            Monitor application deadlines, view indicative eligibility, and compare multiple programs.
          </p>
        </div>

        <Link to="/schemes">
          <Button
            variant="outline"
            className="border-slate-600 bg-slate-800/80 text-white hover:bg-slate-700 text-xs font-semibold shrink-0"
          >
            <span>Explore More Schemes</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search your saved schemes..."
              className="pl-10 text-xs sm:text-sm h-10 w-full"
            />
          </div>

          <div className="w-full sm:w-64 shrink-0">
            <Select
              id="filter-saved-program-type-select"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="text-xs h-10"
            >
              <option value="">All Program Types</option>
              <option value="SCHOLARSHIP">Scholarships</option>
              <option value="WELFARE_SCHEME">Welfare Schemes</option>
              <option value="SUBSIDY">Subsidies</option>
              <option value="EDUCATION">Education</option>
              <option value="AGRICULTURE">Agriculture</option>
              <option value="HEALTHCARE">Healthcare</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Saved Schemes List */}
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
          <p className="text-sm font-bold text-red-900">Failed to load saved schemes</p>
          <p className="text-xs text-red-600">Please check your connection and try again.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900">
              {searchFilter ? 'No matching saved schemes' : "You haven't saved any schemes yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchFilter
                ? 'Try modifying your search term or filter selection.'
                : 'Explore government programs and click the bookmark icon on any scheme card to save it for easy access.'}
            </p>
          </div>
          <Link to="/schemes">
            <Button variant="primary" size="sm" className="text-xs font-semibold">
              <span>Explore Schemes Directory</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
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

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Comparison Tray */}
      <CompareTray selectedIds={selectedIds} onClear={clearCompare} />
    </PageContainer>
  );
};
