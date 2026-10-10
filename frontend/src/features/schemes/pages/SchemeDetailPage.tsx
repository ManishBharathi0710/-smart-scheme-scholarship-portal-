import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Building2,
  IndianRupee,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Info,
  MapPin,
  CheckSquare,
  Square,
  HelpCircle,
  FileQuestion,
  Bookmark,
  BookmarkCheck,
  Layers,
} from 'lucide-react';
import { schemesApi } from '../api/schemes.api';
import { useSavedSchemes } from '../../saved-schemes/hooks/useSavedSchemes';
import { useCompareSelection } from '../hooks/useCompareSelection';
import { CompareTray } from '../components/CompareTray';
import { useOptionalAuth } from '../../auth/context/AuthContext';
import { DocumentChecklist } from '../../documents/components/DocumentChecklist';
import {
  PageContainer,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Spinner,
  Modal,
} from '../../../components/ui';

export const SchemeDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [showExitModal, setShowExitModal] = useState(false);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const { isSaved, toggleSave } = useSavedSchemes();
  const { selectedIds, isSelected, toggleCompare, clearCompare } = useCompareSelection();
  const auth = useOptionalAuth();
  const isAuthenticated = Boolean(auth?.isAuthenticated && auth?.user);

  const { data: scheme, isLoading, isError } = useQuery({
    queryKey: ['public-scheme-detail', idOrSlug],
    queryFn: () => schemesApi.getPublishedSchemeDetail(idOrSlug!),
    enabled: !!idOrSlug,
  });

  const toggleDoc = (id: string) => {
    setCheckedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <PageContainer className="py-20 text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500 font-medium">Loading official scheme record...</p>
      </PageContainer>
    );
  }

  if (isError || !scheme) {
    return (
      <PageContainer className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Scheme Record Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested scheme could not be found, or it may still be pending official verification.
        </p>
        <Link to="/schemes">
          <Button variant="outline" className="text-xs">
            Return to Scheme Directory
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const activePeriod = scheme.applicationPeriods[0];

  return (
    <PageContainer className="py-8 space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gov-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Schemes Catalog</span>
        </Link>
      </div>

      {/* Official Verification Trust Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-emerald-900">
                Officially Verified Public Program
              </span>
              <Badge variant="success" className="text-[10px]">
                Verified Source
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-700 mt-0.5">
              Verified by departmental authorities. Source reference:{' '}
              <a
                href={scheme.officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-emerald-950 inline-flex items-center gap-0.5"
              >
                Official Notification <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
            </p>
          </div>
        </div>

        {scheme.lastVerifiedAt && (
          <div className="text-[11px] text-emerald-800 bg-white/80 px-3 py-1.5 rounded-md border border-emerald-200 font-medium shrink-0">
            Last Verified:{' '}
            <span className="font-bold">
              {new Date(scheme.lastVerifiedAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Main Title Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral" className="text-xs bg-gov-900 text-white border-transparent">
            {scheme.programType.replace(/_/g, ' ')}
          </Badge>
          {scheme.shortName && (
            <Badge variant="neutral" className="text-xs font-semibold">
              {scheme.shortName}
            </Badge>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium ml-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {scheme.stateScope}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            {scheme.name}
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={isSaved(scheme.id) ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => toggleSave(scheme.id)}
              className="text-xs font-semibold"
            >
              {isSaved(scheme.id) ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 mr-1.5 text-amber-600 fill-amber-500" />
                  <span>Bookmarked</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save Scheme</span>
                </>
              )}
            </Button>

            <Button
              variant={isSelected(scheme.id) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => toggleCompare(scheme.id, scheme.name)}
              className="text-xs font-semibold"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              <span>{isSelected(scheme.id) ? 'In Comparison' : 'Compare'}</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Building2 className="w-4 h-4 text-gov-700" />
          <span className="font-semibold">{scheme.department.name}</span>
          {scheme.ministry && <span className="text-slate-400">&bull; {scheme.ministry}</span>}
        </div>
      </div>

      {/* 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Specifications & Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Eligibility Assessment (Module 4 Result) */}
          {scheme.userRecommendation && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="bg-blue-50/60 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Your Indicative Eligibility Assessment</span>
                </CardTitle>
                <div className="shrink-0">
                  {scheme.userRecommendation.status === 'ELIGIBLE' && (
                    <Badge variant="success">Eligible</Badge>
                  )}
                  {scheme.userRecommendation.status === 'LIKELY_ELIGIBLE' && (
                    <Badge variant="info">Likely Eligible</Badge>
                  )}
                  {scheme.userRecommendation.status === 'NEEDS_VERIFICATION' && (
                    <Badge variant="warning">Needs Verification</Badge>
                  )}
                  {scheme.userRecommendation.status === 'NOT_ELIGIBLE' && (
                    <Badge variant="neutral">Not Eligible</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Evaluated deterministically by the Module 4 recommendation engine against your current verified profile parameters.
                </p>

                {scheme.userRecommendation.matchingRequirements.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-900 block">Satisfied Requirements:</span>
                    <ul className="space-y-1">
                      {scheme.userRecommendation.matchingRequirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-2 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {scheme.userRecommendation.missingRequirements.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="font-bold text-amber-900 block">Pending or Missing Information:</span>
                    <ul className="space-y-1">
                      {scheme.userRecommendation.missingRequirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-2 text-amber-800">
                          <FileQuestion className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-blue-200/60 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>
                    Evaluated:{' '}
                    {new Date(scheme.userRecommendation.evaluatedAt).toLocaleDateString('en-IN')}
                  </span>
                  <Link to="/recommendations" className="text-blue-700 font-semibold hover:underline">
                    View Full Explainability &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overview & Description */}
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-3">
              <CardTitle className="text-base font-bold text-slate-800">
                Scheme Overview &amp; Objectives
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {scheme.description}
              </p>

              {scheme.referenceNumber && (
                <div className="p-2.5 bg-slate-50 rounded text-xs text-slate-500 font-mono">
                  Official Reference: <span className="font-semibold text-slate-800">{scheme.referenceNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Structured Benefits */}
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-3">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-gov-700" />
                <span>Benefit Provisions &amp; Financial Coverage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {scheme.benefits.length === 0 ? (
                <p className="text-xs text-slate-500">As prescribed under official government rules.</p>
              ) : (
                scheme.benefits.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 text-sm">
                        {b.amount
                          ? `₹${b.amount.toLocaleString('en-IN')}`
                          : b.maxAmount
                          ? `Up to ₹${b.maxAmount.toLocaleString('en-IN')}`
                          : 'Institutional Assistance'}
                      </span>
                      <p className="text-slate-600 text-xs">{b.description || b.benefitType}</p>
                      {b.duration && (
                        <span className="text-[11px] text-slate-500 block">Duration: {b.duration}</span>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end gap-1 shrink-0">
                      <Badge variant="info" className="text-[10px]">
                        {b.frequency}
                      </Badge>
                      {b.isVariable && (
                        <span className="text-[10px] text-slate-500">Variable by Course/Quota</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Statutory Eligibility Requirements */}
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-800">
                Statutory Eligibility Requirements
              </CardTitle>
              <Badge variant="warning" className="text-[10px]">
                Prescribed Rules
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-3 rounded bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  The following requirements reflect the verified official criteria for this scheme.
                  Deterministic citizen compatibility matching will be available in Module 4.
                </span>
              </div>

              {scheme.eligibilityRequirements.length === 0 ? (
                <p className="text-xs text-slate-500">General eligibility rules apply as per notification.</p>
              ) : (
                <ul className="space-y-2.5">
                  {scheme.eligibilityRequirements.map((req, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-lg border border-slate-100 bg-white hover:border-slate-200 flex items-start gap-2.5 text-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-gov-700 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-800 leading-relaxed block">
                          {req.description}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                          Condition: {req.field.replace(/_/g, ' ')} ({req.operator})
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Required Documents Section (Module 6 Dynamic Document Readiness when logged in) */}
          {isAuthenticated ? (
            <DocumentChecklist schemeId={scheme.id} />
          ) : (
            <Card className="border-slate-200">
              <CardHeader className="bg-slate-50/50 pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gov-700" />
                    <span>Required Documents Checklist</span>
                  </CardTitle>
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-gov-800 hover:underline"
                  >
                    Sign in to verify documents →
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Use this interactive checklist to verify that you have all official documents ready prior to applying.
                </p>

                {scheme.documents.length === 0 ? (
                  <p className="text-xs text-slate-500">Standard identity and academic documents required.</p>
                ) : (
                  <div className="space-y-2">
                    {scheme.documents.map((doc, idx) => {
                      const docKey = doc.id || `doc-${idx}`;
                      const isChecked = !!checkedDocs[docKey];

                      return (
                        <div
                          key={docKey}
                          onClick={() => toggleDoc(docKey)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-3 transition-colors ${
                            isChecked
                              ? 'bg-emerald-50/60 border-emerald-300'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            className="mt-0.5 text-gov-800 focus:outline-none"
                            aria-label={isChecked ? 'Mark document as missing' : 'Mark document as ready'}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isChecked ? 'text-emerald-950 line-through' : 'text-slate-800'}`}>
                                {doc.name}
                              </span>
                              {doc.mandatory && (
                                <span className="text-[10px] font-bold text-red-600 uppercase">Mandatory</span>
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-[11px] text-slate-500">{doc.description}</p>
                            )}
                            {doc.issuingAuthority && (
                              <span className="text-[10px] text-slate-400 block">
                                Issuing Authority: {doc.issuingAuthority}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Application Instructions */}
          {scheme.applicationInstructions && (
            <Card className="border-slate-200">
              <CardHeader className="bg-slate-50/50 pb-3">
                <CardTitle className="text-base font-bold text-slate-800">
                  Official Application Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {scheme.applicationInstructions}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Actions & Official Links */}
        <div className="space-y-6">
          {/* Application Window & Action Card */}
          <Card className="border-slate-200 shadow-sm sticky top-20 bg-white">
            <CardHeader className="bg-slate-50/50 pb-3">
              <CardTitle className="text-base font-bold text-slate-800">
                Application Cycle &amp; Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Cycle Status</span>
                  <Badge
                    variant={activePeriod?.status === 'OPEN' ? 'success' : 'warning'}
                    className="text-[10px]"
                  >
                    {activePeriod?.status || 'CLOSED'}
                  </Badge>
                </div>

                {activePeriod ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Closing Date</span>
                      <span className="font-bold text-slate-900">
                        {activePeriod.applicationCloseDate
                          ? new Date(activePeriod.applicationCloseDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Not specified'}
                      </span>
                    </div>
                    {activePeriod.academicYear && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Academic Year</span>
                        <span className="font-semibold text-slate-800">{activePeriod.academicYear}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-slate-500 pt-1">
                    No active deadline announced. Please check official portal for upcoming cycles.
                  </p>
                )}
              </div>

              {/* Action Button */}
              {scheme.officialApplicationUrl ? (
                <Button
                  variant="primary"
                  onClick={() => setShowExitModal(true)}
                  className="w-full text-xs sm:text-sm font-bold justify-center py-2.5 shadow-sm"
                >
                  <span>Apply on Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => window.open(scheme.officialSourceUrl, '_blank', 'noopener,noreferrer')}
                  className="w-full text-xs font-bold justify-center py-2.5"
                >
                  <span>View Official Source</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              )}

              <p className="text-[11px] text-center text-slate-400 leading-tight">
                Application submissions are processed exclusively on the government department&apos;s authorized portal.
              </p>
            </CardContent>
          </Card>

          {/* Department Information Card */}
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">
                Administering Department
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Department</span>
                <span className="font-semibold text-slate-800">{scheme.department.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Governance Level</span>
                <span className="font-medium text-slate-700">{scheme.department.level} Government</span>
              </div>
              {scheme.department.officialWebsite && (
                <div className="pt-1">
                  <a
                    href={scheme.department.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gov-700 font-semibold hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    <span>Visit Department Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statutory Legal Disclaimer */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-[11px] text-slate-500 leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Official Decision-Support Notice</span>
            </div>
            <p>
              This portal provides indicative benefit information compiled from verified notifications.
              The portal does not guarantee selection, approval, or disbursement. All applications are subject
              to statutory scrutiny and verification by the concerned government authority.
            </p>
          </div>
        </div>
      </div>

      {/* External Portal Redirect Confirmation Modal */}
      {showExitModal && (
        <Modal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          title="Leaving Portal for Official Website"
        >
          <div className="space-y-4 pt-2 text-xs sm:text-sm text-slate-600">
            <p>
              You are being directed to the official authorized portal for this scheme:
            </p>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-xs text-gov-800 break-all">
              {scheme.officialApplicationUrl || scheme.officialSourceUrl}
            </div>
            <p className="text-xs text-slate-500">
              Please ensure you carry all required documents listed on this page before submitting your application.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setShowExitModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowExitModal(false);
                  window.open(
                    scheme.officialApplicationUrl || scheme.officialSourceUrl,
                    '_blank',
                    'noopener,noreferrer',
                  );
                }}
                className="text-xs"
              >
                Proceed to Official Site ↗
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Floating Comparison Selection Tray */}
      <CompareTray selectedIds={selectedIds} onClear={clearCompare} />
    </PageContainer>
  );
};
