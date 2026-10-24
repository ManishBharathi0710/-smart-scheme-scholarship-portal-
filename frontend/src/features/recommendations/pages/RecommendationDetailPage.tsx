import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { recommendationsApi } from '../api/recommendations.api';
import type { RecommendationDetailDto } from '../../../types/recommendation';
import { RecommendationStatusBadge } from '../components/RecommendationStatusBadge';
import { MatchExplanation } from '../components/MatchExplanation';
import { MissingInformationCard } from '../components/MissingInformationCard';
import {
  PageContainer,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from '../../../components/ui';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileText,
  Award,
  AlertCircle,
  Info,
  CheckCircle2,
  Building2,
  ShieldCheck,
  MapPin,
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

  const safeFormatText = (str?: string | null): string => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/_/g, ' ');
  };

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
      <PageContainer className="py-8" data-testid="recommendation-detail-loading">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-36 bg-slate-200 rounded" />
          <div className="h-44 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-slate-200 rounded-xl" />
              <div className="h-64 bg-slate-200 rounded-xl" />
            </div>
            <div className="h-80 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !recommendation) {
    return (
      <PageContainer className="py-8" data-testid="recommendation-detail-error">
        <Link
          to="/recommendations"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-gov-800 transition-colors mb-6"
        >
          <ArrowLeft className="mr-1.5 w-4 h-4" /> Back to All Recommendations
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-xl mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-red-800">
            Unable to Load Evaluation
          </h2>
          <p className="text-sm text-red-600 mt-2">
            {error || 'The requested recommendation could not be found or has expired.'}
          </p>
          <div className="mt-6">
            <Link to="/recommendations">
              <Button variant="outline" size="sm">
                Return to Recommendations
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const officialPortalUrl =
    recommendation.scheme?.officialPortalUrl ||
    recommendation.scheme?.officialApplicationUrl ||
    recommendation.scheme?.officialSourceUrl ||
    null;

  const missingInfoList =
    recommendation.missingInformation ||
    recommendation.evaluationDetails?.missingInformation ||
    [];

  const benefitsList = recommendation.scheme?.benefits || [];
  const documentsList =
    recommendation.scheme?.requiredDocuments ||
    recommendation.scheme?.documents ||
    [];

  const programTypeFormatted =
    safeFormatText(recommendation.scheme?.programType || recommendation.programType) || 'SCHEME';
  const departmentName =
    recommendation.scheme?.department ||
    recommendation.departmentName ||
    'Government Department';

  const schemeName = recommendation.scheme?.name || recommendation.schemeName;
  const assessmentSummary =
    recommendation.explanation?.summary ||
    recommendation.evaluationDetails?.summary ||
    recommendation.summary ||
    'Statutory evaluation completed against registered citizen profile.';

  const openDate =
    recommendation.scheme?.applicationPeriod?.applicationOpenDate ||
    recommendation.scheme?.applicationPeriods?.[0]?.openDate;
  const closeDate =
    recommendation.scheme?.applicationPeriod?.applicationCloseDate ||
    recommendation.scheme?.applicationPeriods?.[0]?.closeDate ||
    recommendation.deadline;

  return (
    <PageContainer className="py-8 space-y-6" data-testid="recommendation-detail-page">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/recommendations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gov-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Recommendations</span>
        </Link>
      </div>

      {/* Header & Status Hero Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gov-100 text-gov-800">
                {programTypeFormatted}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                <Building2 className="w-3.5 h-3.5 text-gov-600" />
                {departmentName}
              </span>
              {recommendation.scheme?.stateScope && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {recommendation.scheme.stateScope}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {schemeName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <RecommendationStatusBadge
                eligibilityStatus={recommendation.eligibilityStatus}
                applicationStatus={recommendation.applicationStatus}
                isExpiringSoon={recommendation.isExpiringSoon}
                daysUntilDeadline={recommendation.daysUntilDeadline}
              />
              <span className="text-xs text-slate-500">
                Evaluated: {formatEvaluatedAt(recommendation.evaluatedAt)} &bull; Rule Spec v
                {recommendation.schemeVersion?.versionNumber ||
                  recommendation.schemeVersionNumber ||
                  1}
              </span>
            </div>
          </div>

          {/* Quick Apply Button on top right */}
          {officialPortalUrl && (
            <div className="shrink-0 pt-1">
              <Button
                variant="primary"
                onClick={() => setShowExitModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 shadow-sm text-sm font-semibold rounded-lg bg-gov-900 hover:bg-gov-800 text-white"
                data-testid="apply-official-portal-btn"
              >
                <span>Apply on Official Portal</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Short Executive Summary */}
        <div className="mt-6 p-4 rounded-xl bg-gov-50/80 border border-gov-100 text-sm text-slate-700">
          <span className="font-bold text-gov-950">
            Evaluation Assessment:{' '}
          </span>
          {assessmentSummary}
        </div>
      </div>

      {/* 2-Column Responsive Grid: Main Content (2/3) + Sticky Sidebar (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Requirements, Explanations, Benefits, Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Missing Information CTA (if any) */}
          {missingInfoList.length > 0 && (
            <MissingInformationCard missingInformation={missingInfoList} />
          )}

          {/* Deterministic Match Explanation */}
          <MatchExplanation
            explanation={recommendation.explanation || recommendation.evaluationDetails}
          />

          {/* Scheme Benefits Breakdown */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gov-50 text-gov-700">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Program Benefits & Financial Support
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Approved financial assistance and subsidies provided under this scheme
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {benefitsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {benefitsList.map((benefit, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs uppercase font-extrabold text-gov-700 tracking-wide">
                            {safeFormatText(benefit?.type) || benefit?.type || 'BENEFIT'}
                          </span>
                          {benefit?.coverage && (
                            <span className="text-xs text-slate-500 font-medium">
                              Coverage: {benefit.coverage}
                            </span>
                          )}
                        </div>
                        {benefit?.amount ? (
                          <div className="text-xl font-extrabold text-slate-900 mt-1.5">
                            ₹{benefit.amount.toLocaleString('en-IN')}{' '}
                            <span className="text-xs font-normal text-slate-500">
                              {benefit?.frequency
                                ? `(${safeFormatText(benefit.frequency) || benefit.frequency})`
                                : ''}
                            </span>
                          </div>
                        ) : null}
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {benefit?.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  No detailed benefit items specified in gazetted rules.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Required Documents for Verification
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Documents required by administrative authorities during application processing
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {documentsList.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {documentsList.map((doc, idx) => (
                    <div key={idx} className="py-3 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="text-sm flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {doc.name}
                          </span>
                          {doc.mandatory && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200/60">
                              Mandatory
                            </span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-xs text-slate-500 mt-1">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  No specific documents listed. General citizen identification documents apply.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sticky Sidebar with Application Details & Disclaimers */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-20">
          {/* Application Window & Channels Card */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
              <Calendar className="w-4 h-4 text-gov-700" />
              <CardTitle className="text-sm font-bold text-slate-900">
                Application Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">
                    Opening Date
                  </span>
                  <span className="font-bold text-slate-900 mt-1 block">
                    {formatDate(openDate)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">
                    Closing Date
                  </span>
                  <span className="font-bold text-slate-900 mt-1 block">
                    {formatDate(closeDate)}
                  </span>
                </div>
              </div>

              {officialPortalUrl && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setShowExitModal(true)}
                    className="w-full py-2.5 text-sm font-bold shadow-sm inline-flex items-center justify-center gap-2 rounded-lg bg-gov-900 hover:bg-gov-800 text-white"
                    data-testid="bottom-apply-portal-btn"
                  >
                    <span>Proceed to Official Portal</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    Applications are received only through official portals.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department & Integrity Summary Card */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold text-slate-900">
                Statutory Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Ministry / Dept:</span>
                <span className="font-semibold text-slate-900 text-right max-w-[60%]">
                  {departmentName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Program Category:</span>
                <span className="font-semibold text-slate-900">
                  {programTypeFormatted}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Evaluation Logic:</span>
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Deterministic Engine
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Rule Version:</span>
                <span className="font-semibold text-slate-900">
                  v{recommendation.schemeVersion?.versionNumber || recommendation.schemeVersionNumber || 1}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Mandatory Regulatory Disclaimer */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1 text-blue-950">Official Decision-Support Notice</span>
              Eligibility shown here is calculated deterministically against gazetted statutory rules and your citizen profile facts. Final selection, approval, and disbursement are executed solely by concerned authorities.
            </div>
          </div>
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
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-blue-100 text-blue-600">
                <ExternalLink className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Leaving to Official Government Portal
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              You are being directed to the official government portal:
              <br />
              <span className="font-mono text-xs text-gov-700 break-all block mt-1.5 p-2 bg-slate-50 rounded-md border border-slate-200">
                {officialPortalUrl}
              </span>
            </p>

            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              This platform provides decision support and eligibility screening. We do not accept applications, charge fees, or guarantee scheme approval.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExitModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowExitModal(false);
                  if (officialPortalUrl) {
                    window.open(officialPortalUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-gov-900 hover:bg-gov-800 text-white"
                data-testid="confirm-external-link-btn"
              >
                <span>Proceed to Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
