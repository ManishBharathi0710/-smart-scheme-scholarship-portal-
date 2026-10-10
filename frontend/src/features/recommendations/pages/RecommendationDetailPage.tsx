import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  recommendationsApi,
} from '../api/recommendations.api';
import type { RecommendationDetailDto } from '../../../types/recommendation';
import { RecommendationStatusBadge } from '../components/RecommendationStatusBadge';
import { MatchExplanation } from '../components/MatchExplanation';
import { MissingInformationCard } from '../components/MissingInformationCard';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileText,
  Award,
  AlertCircle,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const RecommendationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [recommendation, setRecommendation] = useState<RecommendationDetailDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await recommendationsApi.getById(id);
      if (data) {
        setRecommendation(data);
      } else {
        setError('Failed to load recommendation details');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(e.response?.data?.error?.message || e.message || 'Network error loading evaluation details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not specified';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatEvaluatedAt = (dateStr?: string | null) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl" data-testid="recommendation-detail-loading">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div className="container py-8 max-w-4xl" data-testid="recommendation-detail-error">
        <Link
          to="/recommendations"
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="mr-1.5 w-4 h-4" /> Back to Recommendations
        </Link>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
            Unable to Load Evaluation
          </h2>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1 max-w-md mx-auto">
            {error || 'The requested recommendation could not be found or has expired.'}
          </p>
          <div className="mt-4">
            <Link
              to="/recommendations"
              className="btn btn-outline text-sm"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl space-y-6" data-testid="recommendation-detail-page">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/recommendations"
          className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <ArrowLeft className="mr-1.5 w-4 h-4" /> Back to All Recommendations
        </Link>
      </div>

      {/* Header & Status Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                {recommendation.scheme.programType.replace(/_/g, ' ')}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {recommendation.scheme.department}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {recommendation.scheme.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <RecommendationStatusBadge
                eligibilityStatus={recommendation.eligibilityStatus}
                applicationStatus={recommendation.applicationStatus}
                isExpiringSoon={recommendation.isExpiringSoon}
                daysUntilDeadline={recommendation.daysUntilDeadline}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Evaluated: {formatEvaluatedAt(recommendation.evaluatedAt)} (Version {recommendation.schemeVersion.versionNumber})
              </span>
            </div>
          </div>

          {/* Quick Apply Button */}
          {recommendation.scheme.officialPortalUrl && (
            <div className="shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={() => setShowExitModal(true)}
                className="btn btn-primary inline-flex items-center gap-2 shadow-sm w-full md:w-auto justify-center"
                data-testid="apply-official-portal-btn"
              >
                <span>Apply on Official Portal</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Short Executive Summary */}
        <div className="mt-5 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-sm text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">Evaluation Assessment: </span>
          {recommendation.explanation.summary}
        </div>
      </div>

      {/* Missing Information CTA (if any) */}
      {recommendation.missingInformation.length > 0 && (
        <MissingInformationCard missingInformation={recommendation.missingInformation} />
      )}

      {/* Deterministic Match Explanation */}
      <MatchExplanation explanation={recommendation.explanation} />

      {/* Scheme Benefits Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Award className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Program Benefits & Financial Support
          </h2>
        </div>

        {recommendation.scheme.benefits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendation.scheme.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-primary-600 dark:text-primary-400">
                    {benefit.type}
                  </span>
                  {benefit.coverage && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Coverage: {benefit.coverage}
                    </span>
                  )}
                </div>
                {benefit.amount ? (
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    ₹{benefit.amount.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      {benefit.frequency ? `(${benefit.frequency})` : ''}
                    </span>
                  </div>
                ) : null}
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No detailed benefit items specified.</p>
        )}
      </div>

      {/* Required Documents */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Required Documents for Verification
          </h2>
        </div>

        {recommendation.scheme.requiredDocuments.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recommendation.scheme.requiredDocuments.map((doc, idx) => (
              <div key={idx} className="py-3 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {doc.name}
                  </span>
                  {doc.mandatory && (
                    <span className="ml-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                      Mandatory
                    </span>
                  )}
                  {doc.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No specific documents specified at this time.</p>
        )}
      </div>

      {/* Application Period & Official Sources */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Calendar className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Application Window & Official Channels
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              Opening Date
            </span>
            <span className="font-semibold text-slate-900 dark:text-white mt-1 block">
              {formatDate(recommendation.scheme.applicationPeriod?.applicationOpenDate)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              Closing Date
            </span>
            <span className="font-semibold text-slate-900 dark:text-white mt-1 block">
              {formatDate(recommendation.scheme.applicationPeriod?.applicationCloseDate)}
            </span>
          </div>
        </div>

        {recommendation.scheme.officialPortalUrl && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="btn btn-outline inline-flex items-center gap-2 text-sm"
              data-testid="bottom-apply-portal-btn"
            >
              <span>Visit Official Government Portal</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mandatory Regulatory Disclaimer */}
      <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl p-5 text-xs text-blue-800 dark:text-blue-300 leading-relaxed flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-1">Official Decision-Support Notice</span>
          Eligibility shown here is based on the information provided in your profile and the structured scheme rules currently stored in the portal. Final eligibility, verification, approval, and benefit disbursement are solely determined by the concerned government authority. Please verify all application guidelines on the official portal before applying.
        </div>
      </div>

      {/* External Portal Exit Modal */}
      {showExitModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          data-testid="exit-portal-modal"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <ExternalLink className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Leaving to Official Portal
              </h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              You are being directed to the official government portal:
              <br />
              <span className="font-mono text-xs text-primary-600 dark:text-primary-400 break-all block mt-1">
                {recommendation.scheme.officialPortalUrl}
              </span>
            </p>

            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              This platform provides decision support and eligibility screening. We do not accept applications, charge fees, or guarantee scheme approval.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="btn btn-outline text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  if (recommendation.scheme.officialPortalUrl) {
                    window.open(recommendation.scheme.officialPortalUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="btn btn-primary text-sm inline-flex items-center gap-1.5"
                data-testid="confirm-external-link-btn"
              >
                <span>Proceed to Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
