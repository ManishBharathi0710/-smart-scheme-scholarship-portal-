import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Camera,
  CheckSquare,
  Square,
  ShieldAlert,
} from 'lucide-react';
import { UserDocument, CONTROLLED_DOCUMENT_TYPES } from '../../../types/document';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
  replaceDoc?: UserDocument | null;
  defaultDocumentType?: string;
}

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  replaceDoc,
  defaultDocumentType,
}) => {
  const [selectedType, setSelectedType] = useState<string>(
    replaceDoc?.documentType || defaultDocumentType || 'INCOME_CERTIFICATE',
  );
  const [file, setFile] = useState<File | null>(null);
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [documentNumberMasked, setDocumentNumberMasked] = useState('');
  const [ocrConsent, setOcrConsent] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replaceDoc) {
      setSelectedType(replaceDoc.documentType);
      if (replaceDoc.issuingAuthority) setIssuingAuthority(replaceDoc.issuingAuthority);
      if (replaceDoc.documentNumberMasked) setDocumentNumberMasked(replaceDoc.documentNumberMasked);
    } else if (defaultDocumentType) {
      setSelectedType(defaultDocumentType);
    }
  }, [replaceDoc, defaultDocumentType]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (candidate: File) => {
    setError(null);
    if (!ALLOWED_MIME_TYPES.includes(candidate.type)) {
      setError('Invalid file format. Only PDF, JPEG, and PNG files are supported.');
      return;
    }
    const sizeMb = candidate.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      setError(`File size (${sizeMb.toFixed(1)} MB) exceeds the maximum allowed limit of ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setFile(candidate);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please choose or capture a document file to upload.');
      return;
    }

    if (!selectedType) {
      setError('Please select a valid document type.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', selectedType);
      if (issuedAt) formData.append('issuedAt', issuedAt);
      if (expiresAt) formData.append('expiresAt', expiresAt);
      if (issuingAuthority.trim()) formData.append('issuingAuthority', issuingAuthority.trim());
      if (documentNumberMasked.trim()) {
        formData.append('documentNumberMasked', documentNumberMasked.trim());
      }
      formData.append('ocrConsent', String(ocrConsent));
      if (replaceDoc) {
        formData.append('replaceDocumentId', replaceDoc.id);
      }

      await onUpload(formData);
      onClose();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Failed to upload document. Please verify the file and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 id="upload-modal-title" className="text-lg font-bold text-slate-900">
              {replaceDoc ? `Upload New Version of ${replaceDoc.documentTypeLabel}` : 'Upload Document'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely upload and organize statutory documents for scheme applications
            </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Upload failed</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Document Type Selector */}
          <div>
            <label htmlFor="document-type-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Document Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="document-type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              disabled={Boolean(replaceDoc)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-gov-600 focus:outline-none focus:ring-2 focus:ring-gov-600/20 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {CONTROLLED_DOCUMENT_TYPES.map((dt) => (
                <option key={dt.type} value={dt.type}>
                  [{dt.category}] {dt.label} {dt.supportsOCR ? '⚡ (OCR supported)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Choose Document File <span className="text-rose-500">*</span>
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive
                  ? 'border-gov-600 bg-gov-50/50 scale-[1.01]'
                  : file
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleFileInputChange}
                className="hidden"
                id="doc-file-input"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
                id="doc-camera-input"
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileCheck className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB &bull; Ready to upload
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-xs text-rose-600 font-semibold hover:underline mt-1"
                  >
                    Change file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gov-100 text-gov-800 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Drag &amp; drop document here, or browse
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supported formats: PDF, JPG, PNG &bull; Maximum size: {MAX_FILE_SIZE_MB} MB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm"
                    >
                      Browse Files
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Statutory Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label htmlFor="authority-input" className="block text-xs font-medium text-slate-700 mb-1">
                Issuing Authority (Optional)
              </label>
              <input
                id="authority-input"
                type="text"
                placeholder="e.g. Tahsildar / Revenue Dept"
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                maxLength={150}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-600/20"
              />
            </div>
            <div>
              <label htmlFor="doc-number-input" className="block text-xs font-medium text-slate-700 mb-1">
                Document / Certificate No. (Optional)
              </label>
              <input
                id="doc-number-input"
                type="text"
                placeholder="e.g. INC/2026/89421"
                value={documentNumberMasked}
                onChange={(e) => setDocumentNumberMasked(e.target.value)}
                maxLength={50}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-600/20"
              />
            </div>
            <div>
              <label htmlFor="issued-at-input" className="block text-xs font-medium text-slate-700 mb-1">
                Issued Date (Optional)
              </label>
              <input
                id="issued-at-input"
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-600/20"
              />
            </div>
            <div>
              <label htmlFor="expires-at-input" className="block text-xs font-medium text-slate-700 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                id="expires-at-input"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-600/20"
              />
            </div>
          </div>

          {/* OCR Consent Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mt-2">
            <button
              type="button"
              onClick={() => setOcrConsent(!ocrConsent)}
              className="flex items-start gap-2.5 text-left w-full focus:outline-none"
            >
              {ocrConsent ? (
                <CheckSquare className="w-4 h-4 text-gov-700 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div className="text-xs text-slate-700">
                <span className="font-semibold text-slate-900">
                  Enable OCR information extraction
                </span>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  I understand that the uploaded document may be processed to extract information
                  needed for scheme assistance. Extracted details require my explicit review before
                  being confirmed.
                </p>
              </div>
            </button>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span>Files are encrypted at rest and accessible only to your authenticated account.</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
              disabled={submitting || !file}
              className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-gov-800 hover:bg-gov-900 focus:outline-none focus:ring-2 focus:ring-gov-600 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading securely...</span>
                </>
              ) : (
                <span>Upload Document</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
