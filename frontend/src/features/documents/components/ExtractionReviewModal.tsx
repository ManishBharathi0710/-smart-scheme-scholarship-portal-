import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { UserDocument, DocumentExtraction, ConfirmExtractionInput } from '../../../types/document';
import { documentsApi } from '../api/documents.api';

interface ExtractionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: UserDocument;
  onConfirmed: () => void;
}

export const ExtractionReviewModal: React.FC<ExtractionReviewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onConfirmed,
}) => {
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [applyToProfile, setApplyToProfile] = useState(false);
  const [userConsentToUpdateProfile, setUserConsentToUpdateProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    documentsApi
      .getExtraction(doc.id)
      .then((ext) => {
        if (!isMounted) return;
        setExtraction(ext);

        // Pre-populate fields with confirmed values or extracted values
        const initial: Record<string, unknown> = {};
        for (const item of ext.structuredFields) {
          const confirmedVal = ext.confirmedValues?.[item.field];
          initial[item.field] = confirmedVal !== undefined ? confirmedVal : item.extractedValue;
        }
        setFieldValues(initial);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const errObj = err as { message?: string };
        setError(errObj.message || 'Failed to load OCR extraction data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, doc.id]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, val: string | number) => {
    setFieldValues((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      const input: ConfirmExtractionInput = {
        confirmedFields: fieldValues,
        applyToProfile: applyToProfile && userConsentToUpdateProfile,
        userConsentToUpdateProfile: applyToProfile && userConsentToUpdateProfile,
      };

      await documentsApi.confirmExtraction(doc.id, input);
      onConfirmed();
      onClose();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Failed to save confirmed data.');
    } finally {
      setSubmitting(false);
    }
  };

  const getConfidenceBadge = (band: 'HIGH' | 'MEDIUM' | 'LOW', conf: number) => {
    switch (band) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
            <span>High ({(conf * 100).toFixed(0)}%)</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600" aria-hidden="true" />
            <span>Medium ({(conf * 100).toFixed(0)}%)</span>
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-600" aria-hidden="true" />
            <span>Low ({(conf * 100).toFixed(0)}%)</span>
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="review-modal-title" className="text-lg font-bold text-slate-900">
                Review Extracted Information
              </h2>
              <p className="text-xs text-slate-500">
                {doc.documentTypeLabel} &bull; v{doc.version} &bull; {doc.originalFileName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-gov-600"
          >
            <X className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
              <div className="w-8 h-8 border-3 border-gov-600/30 border-t-gov-700 rounded-full animate-spin" />
              <p className="text-sm">Retrieving structured document extractions...</p>
            </div>
          ) : !extraction || extraction.structuredFields.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Structured Fields Extracted</p>
              <p className="text-xs text-slate-500 mt-1">
                OCR was unable to extract recognized structured attributes for this document type.
                You can still use this document for manual scheme applications.
              </p>
            </div>
          ) : (
            <form id="review-extraction-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Document Comparison banner */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="leading-relaxed">
                  <span className="font-semibold">Review and Correct</span>: Automated OCR extracts
                  information to save time. Please verify each field against your statutory certificate
                  and edit any inaccuracies.
                </div>
              </div>

              {/* Extraction fields list */}
              <div className="space-y-3">
                {extraction.structuredFields.map((field) => (
                  <div
                    key={field.field}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <label
                        htmlFor={`field-${field.field}`}
                        className="text-xs font-bold text-slate-800 uppercase tracking-wider"
                      >
                        {field.label}
                      </label>
                      <div className="flex items-center gap-2">
                        {getConfidenceBadge(field.confidenceBand, field.confidence)}
                        {field.suggestedProfileField && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Maps to Profile
                          </span>
                        )}
                      </div>
                    </div>
                    <input
                      id={`field-${field.field}`}
                      type="text"
                      value={String(fieldValues[field.field] ?? '')}
                      onChange={(e) => handleFieldChange(field.field, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-600/20 font-medium"
                    />
                  </div>
                ))}
              </div>

              {/* Profile Synchronization Option */}
              {extraction.canApplyToProfile && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 mt-4">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-950">
                        Synchronize with Citizen Profile
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        You can optionally apply these confirmed facts (e.g. annual income, marks)
                        to your Module 2 Profile to automatically refresh your scheme recommendations.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !applyToProfile;
                        setApplyToProfile(next);
                        if (!next) setUserConsentToUpdateProfile(false);
                      }}
                      className="flex items-start gap-2 text-left focus:outline-none w-full"
                    >
                      {applyToProfile ? (
                        <CheckSquare className="w-4 h-4 text-gov-800 shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <span className="text-xs font-semibold text-slate-800">
                        Apply confirmed values to my citizen profile
                      </span>
                    </button>

                    {applyToProfile && (
                      <button
                        type="button"
                        onClick={() => setUserConsentToUpdateProfile(!userConsentToUpdateProfile)}
                        className="flex items-start gap-2 text-left focus:outline-none w-full pl-6"
                      >
                        {userConsentToUpdateProfile ? (
                          <CheckSquare className="w-4 h-4 text-gov-800 shrink-0 mt-0.5" aria-hidden="true" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                        )}
                        <span className="text-xs text-slate-700">
                          I explicitly consent to updating my saved profile data with these verified document values.
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Statutory Disclaimer */}
              <div className="p-3 rounded-lg bg-slate-100 text-slate-600 text-[11px] leading-relaxed">
                <strong>Important Notice:</strong> OCR results provide assistance in organizing information.
                They do not constitute government certification or legal eligibility. Official determinations
                are exclusively made by the respective scheme authority upon formal application.
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="review-extraction-form"
            disabled={submitting || loading || !extraction}
            className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-gov-800 hover:bg-gov-900 focus:outline-none focus:ring-2 focus:ring-gov-600 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Confirmation...</span>
              </>
            ) : (
              <span>Confirm &amp; Save Information</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
