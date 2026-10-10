import React from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
  AlertCircle,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { schemesApi } from '../api/schemes.api';
import { useSavedSchemes } from '../../saved-schemes/hooks/useSavedSchemes';
import { useCompareSelection } from '../hooks/useCompareSelection';
import {
  PageContainer,
  Button,
  Badge,
  Spinner,
} from '../../../components/ui';

export const CompareSchemesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get('ids') || '';
  const schemeIds = idsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const { isSaved, toggleSave } = useSavedSchemes();
  const { clearCompare } = useCompareSelection();

  const { data: comparisonData, isLoading, isError, refetch } = useQuery({
    queryKey: ['schemes-compare', schemeIds.sort().join(',')],
    queryFn: () => schemesApi.compareSchemes(schemeIds),
    enabled: schemeIds.length > 0,
  });

  const schemes = comparisonData?.schemes || [];

  const handleRemoveScheme = (idToRemove: string) => {
    const nextIds = schemeIds.filter((id) => id !== idToRemove);
    if (nextIds.length === 0) {
      navigate('/schemes');
    } else {
      navigate(`/compare?ids=${nextIds.join(',')}`);
    }
  };

  if (schemeIds.length === 0) {
    return (
      <PageContainer className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">No Schemes Selected for Comparison</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Select between 1 and 4 schemes from the directory or your saved list to view a side-by-side factual comparison.
        </p>
        <Link to="/schemes">
          <Button variant="primary" size="sm" className="text-xs font-semibold">
            <span>Browse Schemes Directory</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer className="py-20 text-center space-y-3">
        <Spinner size="lg" label="Generating factual comparison..." />
        <p className="text-xs text-slate-500 font-medium">
          Retrieving verified parameters and eligibility criteria across selected programs...
        </p>
      </PageContainer>
    );
  }

  if (isError || schemes.length === 0) {
    return (
      <PageContainer className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Comparison Data Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          One or more selected schemes could not be found or verified.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
            Retry
          </Button>
          <Link to="/schemes">
            <Button variant="primary" size="sm" className="text-xs">
              Back to Catalog
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            to="/schemes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Schemes Directory</span>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500 font-medium">
            Comparing <strong>{schemes.length}</strong> of <strong>4</strong> allowed schemes
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={clearCompare}
            className="text-xs text-slate-600 hover:text-rose-600"
          >
            Clear Selection
          </Button>

          {schemes.length < 4 && (
            <Link to="/schemes">
              <Button size="sm" variant="outline" className="text-xs font-semibold text-gov-800">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Scheme</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gov-900 via-gov-900 to-gov-950 text-white rounded-2xl p-6 shadow-sm border border-gov-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gov-800 text-xs font-semibold text-amber-300 mb-2 border border-gov-700">
          <Layers className="w-3.5 h-3.5" />
          <span>Factual Side-by-Side Comparison</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Statutory Schemes Comparison Matrix
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Side-by-side neutral comparison of benefits, eligibility, required documents, and application periods.
          This platform does not algorithmically rank or pick a &ldquo;winner&rdquo; among government assistance programs.
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="p-4 w-48 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                Scheme Parameter
              </th>
              {schemes.map((s) => (
                <th key={s.id} className="p-4 align-top border-r last:border-r-0 border-slate-200 w-72">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="neutral" className="text-[10px] font-semibold">
                        {s.programType.replace(/_/g, ' ')}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleRemoveScheme(s.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded"
                        title="Remove from comparison"
                        aria-label={`Remove ${s.name} from comparison`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Link to={`/schemes/${s.slug || s.id}`} className="hover:text-gov-800 block">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                        {s.name}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant={isSaved(s.id) ? 'outline' : 'ghost'}
                        onClick={() => toggleSave(s.id)}
                        className="text-xs h-7 px-2"
                      >
                        <span>{isSaved(s.id) ? 'Bookmarked' : 'Save'}</span>
                      </Button>

                      <Link to={`/schemes/${s.slug || s.id}`}>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                          <span>Details</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {/* 1. Indicative User Eligibility */}
            <tr className="bg-slate-50/40">
              <td className="p-4 font-bold text-slate-800 sticky left-0 bg-slate-50 border-r border-slate-200">
                Your Eligibility Assessment
              </td>
              {schemes.map((s) => {
                const el = s.userEligibility;
                if (!el) {
                  return (
                    <td key={s.id} className="p-4 border-r last:border-r-0 border-slate-200 text-slate-400">
                      Sign in or complete profile to evaluate
                    </td>
                  );
                }

                let badge = <Badge variant="neutral">Not Eligible</Badge>;
                if (el.status === 'ELIGIBLE') {
                  badge = (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Eligible
                    </div>
                  );
                } else if (el.status === 'LIKELY_ELIGIBLE') {
                  badge = (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                      Likely Eligible
                    </div>
                  );
                } else if (el.status === 'NEEDS_VERIFICATION') {
                  badge = (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <FileQuestion className="w-3.5 h-3.5 text-amber-600" />
                      Needs Verification
                    </div>
                  );
                }

                return (
                  <td key={s.id} className="p-4 border-r last:border-r-0 border-slate-200 space-y-1">
                    {badge}
                    {el.missingRequirements && el.missingRequirements.length > 0 && (
                      <p className="text-[11px] text-slate-500 pt-1">
                        Pending: {el.missingRequirements.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* 2. Department & Level */}
            <tr>
              <td className="p-4 font-semibold text-slate-600 sticky left-0 bg-white border-r border-slate-200">
                Department / Ministry
              </td>
              {schemes.map((s) => (
                <td key={s.id} className="p-4 border-r last:border-r-0 border-slate-200 space-y-1">
                  <p className="font-semibold text-slate-900">{s.departmentName}</p>
                  <span className="text-[11px] text-slate-500 capitalize">
                    {s.departmentLevel.toLowerCase()} Level
                  </span>
                </td>
              ))}
            </tr>

            {/* 3. Geographic Scope */}
            <tr>
              <td className="p-4 font-semibold text-slate-600 sticky left-0 bg-white border-r border-slate-200">
                Geographic Scope
              </td>
              {schemes.map((s) => (
                <td key={s.id} className="p-4 border-r last:border-r-0 border-slate-200 font-medium text-slate-800">
                  {s.geographicScope === 'ALL_INDIA' ? 'All India (Central Scheme)' : s.geographicScope}
                </td>
              ))}
            </tr>

            {/* 4. Category */}
            <tr>
              <td className="p-4 font-semibold text-slate-600 sticky left-0 bg-white border-r border-slate-200">
                Scheme Categories
              </td>
              {schemes.map((s) => (
                <td key={s.id} className="p-4 border-r last:border-r-0 border-slate-200">
                  <div className="flex flex-wrap gap-1">
                    {s.categories.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            {/* 5. Benefits Summary */}
            <tr className="bg-slate-50/20">
              <td className="p-4 font-semibold text-slate-600 sticky left-0 bg-slate-50 border-r border-slate-200">
                Benefits &amp; Assistance
              </td>
              {schemes.map((s) => (
                <td key={s.id} className="p-4 border-r last:border-r-0 border-slate-200">
                  {!s.benefitsSummary || s.benefitsSummary.length === 0 ? (
                    <span className="text-slate-400">Refer to official notification</span>
                  ) : (
                    <ul className="space-y-1.5 list-disc list-inside text-slate-800 font-medium">
                      {s.benefitsSummary.map((b, i) => (
                        <li key={i} className="leading-relaxed">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              ))}
            </tr>

            {/* 6. Application Status & Window */}
            <tr>
              <td className="p-4 font-semibold text-slate-600 sticky left-0 bg-white border-r border-slate-200">
                Application Cycle
              </td>
              {schemes.map((s) => (
                <td key={s.id} className="p-4 border-r last:border-r-0 border-slate-200 space-y-1">
                  <div>
                    {s.applicationStatus === 'OPEN' ? (
                      <Badge variant="success">Open</Badge>
                    ) : s.applicationStatus === 'UPCOMING' ? (
                      <Badge variant="info">Upcoming</Badge>
                    ) : (
                      <Badge variant="neutral">Closed</Badge>
                    )}
                  </div>
                  {s.applicationCloseDate && (
                    <p className="text-[11px] text-slate-500 font-medium pt-1">
                      Closes: {new Date(s.applicationCloseDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </td>
              ))}
            </tr>

            {/* 7. Application Method */}
            <tr>
              <td className="p-4 font-semibold text-slate-600 sticky left-0 bg-white border-r border-slate-200">
                Application Method
              </td>
              {schemes.map((s) => (
                <td key={s.id} className="p-4 border-r last:border-r-0 border-slate-200 capitalize font-medium text-slate-800">
                  {s.applicationMethod.toLowerCase()} Application
                </td>
              ))}
            </tr>

            {/* 8. Required Documents */}
            <tr className="bg-slate-50/20">
              <td className="p-4 font-semibold text-slate-600 sticky left-0 bg-slate-50 border-r border-slate-200">
                Required Documents
              </td>
              {schemes.map((s) => (
                <td key={s.id} className="p-4 border-r last:border-r-0 border-slate-200">
                  {!s.requiredDocuments || s.requiredDocuments.length === 0 ? (
                    <span className="text-slate-400">Refer to scheme guidelines</span>
                  ) : (
                    <ul className="space-y-1 text-slate-700">
                      {s.requiredDocuments.map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-slate-400">&bull;</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              ))}
            </tr>

            {/* 9. Official Application Portal */}
            <tr>
              <td className="p-4 font-semibold text-slate-600 sticky left-0 bg-white border-r border-slate-200">
                Official Links
              </td>
              {schemes.map((s) => (
                <td key={s.id} className="p-4 border-r last:border-r-0 border-slate-200 space-y-2">
                  {s.officialApplicationUrl && (
                    <a
                      href={s.officialApplicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-800 hover:underline block"
                    >
                      <span>Visit Application Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {s.officialSourceUrl && (
                    <a
                      href={s.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:underline block"
                    >
                      <span>Official Source Gazette</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Decision Support Disclaimer */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-gov-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Decision Support Platform:</strong> Comparison is strictly factual to assist citizens in understanding
          differing provisions. No algorithmically assigned score or superiority ranking exists. Final decisions are made by respective authorities.
        </p>
      </div>
    </PageContainer>
  );
};
