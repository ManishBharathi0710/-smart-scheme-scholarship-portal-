import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { useSchemeDocumentReadiness } from '../hooks/useSchemeDocumentReadiness';

interface DocumentChecklistProps {
  schemeId: string;
  onUploadRequested?: (documentType: string) => void;
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  schemeId,
  onUploadRequested,
}) => {
  const { readiness, loading, error, refetch } = useSchemeDocumentReadiness(schemeId);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3" />
        <div className="space-y-3">
          <div className="h-12 bg-slate-100 rounded-lg" />
          <div className="h-12 bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !readiness) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-600 mb-3">
          {error || 'Unable to check document readiness for this scheme.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs font-semibold text-gov-800 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    requirements,
    totalRequirements,
    readyCount,
    missingCount,
    isFullyPrepared,
    disclaimer,
  } = readiness;

  if (totalRequirements === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No Statutory Documents Required</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              This scheme does not require statutory certificate uploads prior to application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const readyPct = Math.round((readyCount / totalRequirements) * 100);

  const getStatusIcon = (status: 'READY' | 'NEEDS_REVIEW' | 'MISSING' | 'EXPIRED') => {
    switch (status) {
      case 'READY':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />;
      case 'NEEDS_REVIEW':
        return <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />;
      case 'EXPIRED':
        return <Clock className="w-4 h-4 text-red-600" aria-hidden="true" />;
      case 'MISSING':
      default:
        return <XCircle className="w-4 h-4 text-rose-600" aria-hidden="true" />;
    }
  };

  const getStatusBadge = (status: 'READY' | 'NEEDS_REVIEW' | 'MISSING' | 'EXPIRED') => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ Ready
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            ! Needs Review
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
            ⧖ Expired
          </span>
        );
      case 'MISSING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            × Missing
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gov-800" aria-hidden="true" />
              <span>Document Verification Readiness</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Check if your uploaded documents fulfill requirements for this scheme
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isFullyPrepared
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {readyCount} of {totalRequirements} Documents Ready
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isFullyPrepared ? 'bg-emerald-600' : 'bg-gov-600'
            }`}
            style={{ width: `${readyPct}%` }}
          />
        </div>
      </div>

      {/* Requirements list */}
      <div className="divide-y divide-slate-100 p-2 sm:p-4">
        {requirements.map((req) => (
          <div
            key={req.requirementId}
            className="p-3.5 rounded-lg hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 shrink-0">{getStatusIcon(req.readinessStatus)}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-slate-900">{req.requirementName}</h4>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
                      req.mandatory
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {req.mandatory ? 'Mandatory' : 'Optional'}
                  </span>
                </div>
                {req.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{req.description}</p>
                )}
                {req.matchedDocument ? (
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    Matched: {req.matchedDocument.originalFileName}
                  </p>
                ) : (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{req.readinessNote}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-center">
              {getStatusBadge(req.readinessStatus)}
              {req.readinessStatus === 'MISSING' && (
                onUploadRequested ? (
                  <button
                    type="button"
                    onClick={() => onUploadRequested(req.documentType)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-gov-50 text-gov-800 hover:bg-gov-100 border border-gov-200 transition-colors"
                  >
                    <Upload className="w-3 h-3" aria-hidden="true" />
                    <span>Upload</span>
                  </button>
                ) : (
                  <Link
                    to="/documents"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-gov-50 text-gov-800 hover:bg-gov-100 border border-gov-200 transition-colors"
                  >
                    <Upload className="w-3 h-3" aria-hidden="true" />
                    <span>Upload</span>
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer & Disclaimer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-start gap-2 text-slate-500 text-[11px] leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{disclaimer}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
          <span className="text-xs text-slate-500">
            {missingCount > 0
              ? `${missingCount} mandatory document(s) pending upload`
              : 'All mandatory documents uploaded'}
          </span>
          <Link
            to="/documents"
            className="inline-flex items-center gap-1 text-xs font-bold text-gov-800 hover:text-gov-900 hover:underline"
          >
            <span>Go to My Document Library</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
};
