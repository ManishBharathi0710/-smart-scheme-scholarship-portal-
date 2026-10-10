import React, { useState } from 'react';
import {
  FileText,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  Calendar,
  Building,
  Hash,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { UserDocument } from '../../../types/document';
import { DocumentStatusBadge } from './DocumentStatusBadge';

interface DocumentCardProps {
  document: UserDocument;
  onDownload: (doc: UserDocument) => Promise<void>;
  onDelete: (doc: UserDocument) => Promise<void>;
  onRunOcr: (doc: UserDocument) => void;
  onReviewExtraction: (doc: UserDocument) => void;
  onReplace: (doc: UserDocument) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  onDownload,
  onDelete,
  onRunOcr,
  onReviewExtraction,
  onReplace,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await onDownload(doc);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onDelete(doc);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${
        doc.isExpired
          ? 'border-red-300 ring-1 ring-red-100'
          : doc.documentStatus === 'NEEDS_REVIEW'
            ? 'border-amber-300 ring-1 ring-amber-100'
            : 'border-slate-200'
      }`}
    >
      {/* Top Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gov-100 text-gov-800 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {doc.documentTypeLabel}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  v{doc.version}
                </span>
                {doc.isCurrent && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono truncate mt-0.5" title={doc.originalFileName}>
                {doc.originalFileName} ({formatFileSize(doc.fileSize)})
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <DocumentStatusBadge status={doc.documentStatus} />
          </div>
        </div>
      </div>

      {/* Metadata Body */}
      <div className="p-5 space-y-3 flex-1 text-sm text-slate-600">
        {/* Status badges bar */}
        <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-slate-100">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            {doc.documentCategory}
          </span>
          <span className="text-slate-300">•</span>
          <DocumentStatusBadge ocrStatus={doc.ocrStatus} size="sm" />
          {doc.verificationStatus === 'VERIFIED_FOR_USE' && (
            <DocumentStatusBadge verificationStatus={doc.verificationStatus} size="sm" />
          )}
        </div>

        {/* Masked document number */}
        {doc.documentNumberMasked && (
          <div className="flex items-center gap-2 text-xs">
            <Hash className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="text-slate-500">Document No:</span>
            <span className="font-mono font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
              {doc.documentNumberMasked}
            </span>
          </div>
        )}

        {/* Issuing Authority */}
        {doc.issuingAuthority && (
          <div className="flex items-center gap-2 text-xs">
            <Building className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="text-slate-500">Issuing Authority:</span>
            <span className="font-medium text-slate-800 truncate">{doc.issuingAuthority}</span>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</span>
          </div>
          {doc.expiresAt && (
            <div
              className={`flex items-center gap-1.5 font-medium ${
                doc.isExpired ? 'text-red-700' : 'text-slate-600'
              }`}
            >
              <Calendar
                className={`w-3.5 h-3.5 shrink-0 ${doc.isExpired ? 'text-red-600' : 'text-slate-400'}`}
                aria-hidden="true"
              />
              <span>
                Expires: {doc.expiresAt} {doc.isExpired ? '(Expired)' : ''}
              </span>
            </div>
          )}
        </div>

        {/* OCR note if needs review */}
        {doc.documentStatus === 'NEEDS_REVIEW' && (
          <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">Information Extracted</p>
              <p className="text-amber-800 mt-0.5">
                Review extracted fields and confirm accuracy before using in applications.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-600 disabled:opacity-50 transition-colors"
            title="Download document securely"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{downloading ? 'Downloading...' : 'Download'}</span>
          </button>

          {/* OCR Trigger or Review */}
          {doc.hasExtraction ? (
            <button
              type="button"
              onClick={() => onReviewExtraction(doc)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-gov-800 bg-gov-50 border border-gov-200 hover:bg-gov-100 focus:outline-none focus:ring-2 focus:ring-gov-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Review Data</span>
            </button>
          ) : doc.ocrStatus === 'PROCESSING' ? (
            <span className="text-xs text-blue-700 flex items-center gap-1 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Processing OCR</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onRunOcr(doc)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-amber-900 bg-amber-50 border border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 transition-colors"
              title="Extract structured details from certificate"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              <span>Extract Details</span>
            </button>
          )}

          {/* Replace new version */}
          <button
            type="button"
            onClick={() => onReplace(doc)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 focus:outline-none transition-colors"
            title="Upload an updated version of this document"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Replace</span>
          </button>
        </div>

        {/* Delete */}
        <div>
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-rose-700 font-medium">Delete?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-2 py-1 rounded text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600"
              >
                {deleting ? '...' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 rounded text-xs text-slate-600 hover:bg-slate-200"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
              title="Delete document from library"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Delete {doc.documentTypeLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
