import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  FileCheck,
  HelpCircle,
} from 'lucide-react';
import { DocumentStatus, OcrStatus, DocumentVerificationStatus } from '../../../types/document';

interface DocumentStatusBadgeProps {
  status?: DocumentStatus | 'READY' | 'NEEDS_REVIEW' | 'MISSING' | 'EXPIRED';
  ocrStatus?: OcrStatus;
  verificationStatus?: DocumentVerificationStatus;
  size?: 'sm' | 'md';
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  ocrStatus,
  verificationStatus,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  // 1. OCR status badge if specified alone
  if (ocrStatus && !status) {
    switch (ocrStatus) {
      case 'COMPLETED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
          >
            <CheckCircle2 className={`${iconSize} text-emerald-600`} aria-hidden="true" />
            <span>OCR Extracted</span>
          </span>
        );
      case 'PROCESSING':
      case 'QUEUED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
          >
            <Loader2 className={`${iconSize} text-blue-600 animate-spin`} aria-hidden="true" />
            <span>OCR Processing</span>
          </span>
        );
      case 'LOW_CONFIDENCE':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}
          >
            <AlertTriangle className={`${iconSize} text-amber-600`} aria-hidden="true" />
            <span>Low Confidence</span>
          </span>
        );
      case 'FAILED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
          >
            <XCircle className={`${iconSize} text-rose-600`} aria-hidden="true" />
            <span>OCR Failed</span>
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}
          >
            <HelpCircle className={`${iconSize} text-slate-500`} aria-hidden="true" />
            <span>Not Extracted</span>
          </span>
        );
    }
  }

  // 2. Verification status badge if specified alone
  if (verificationStatus && !status) {
    if (verificationStatus === 'VERIFIED_FOR_USE') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-sky-50 text-sky-800 border border-sky-200 ${sizeClasses}`}
        >
          <FileCheck className={`${iconSize} text-sky-600`} aria-hidden="true" />
          <span>Verified for Use</span>
        </span>
      );
    }
    if (verificationStatus === 'OFFICIALLY_VERIFIED') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}
        >
          <CheckCircle2 className={`${iconSize} text-emerald-600`} aria-hidden="true" />
          <span>Officially Verified</span>
        </span>
      );
    }
  }

  // 3. Document readiness / document status badge
  switch (status) {
    case 'READY':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}
        >
          <CheckCircle2 className={`${iconSize} text-emerald-600`} aria-hidden="true" />
          <span>✓ Ready</span>
        </span>
      );
    case 'NEEDS_REVIEW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300 ${sizeClasses}`}
        >
          <AlertTriangle className={`${iconSize} text-amber-600`} aria-hidden="true" />
          <span>! Needs Review</span>
        </span>
      );
    case 'MISSING':
    case 'NOT_UPLOADED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses}`}
        >
          <XCircle className={`${iconSize} text-rose-600`} aria-hidden="true" />
          <span>× Missing</span>
        </span>
      );
    case 'EXPIRED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-300 ${sizeClasses}`}
        >
          <Clock className={`${iconSize} text-red-600`} aria-hidden="true" />
          <span>⧖ Expired</span>
        </span>
      );
    case 'PROCESSING':
    case 'SECURITY_VALIDATING':
    case 'UPLOAD_STARTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300 ${sizeClasses}`}
        >
          <Loader2 className={`${iconSize} text-blue-600 animate-spin`} aria-hidden="true" />
          <span>⋯ Processing</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-200 text-slate-800 border border-slate-300 ${sizeClasses}`}
        >
          <XCircle className={`${iconSize} text-slate-600`} aria-hidden="true" />
          <span>Rejected</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <HelpCircle className={`${iconSize} text-slate-500`} aria-hidden="true" />
          <span>Uploaded</span>
        </span>
      );
  }
};
