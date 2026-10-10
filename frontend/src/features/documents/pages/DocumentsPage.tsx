import React, { useState } from 'react';
import {
  Upload,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentCard } from '../components/DocumentCard';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { ExtractionReviewModal } from '../components/ExtractionReviewModal';
import { UserDocument, DocumentCategory, DocumentStatus } from '../../../types/document';

const CATEGORY_TABS: { label: string; value: DocumentCategory | 'ALL' }[] = [
  { label: 'All Documents', value: 'ALL' },
  { label: 'Identity', value: 'IDENTITY' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Community', value: 'COMMUNITY' },
  { label: 'Education', value: 'EDUCATION' },
  { label: 'Bank', value: 'BANK' },
  { label: 'Residence', value: 'RESIDENCE' },
  { label: 'Disability', value: 'DISABILITY' },
  { label: 'Agriculture', value: 'AGRICULTURE' },
];

export const DocumentsPage: React.FC = () => {
  const {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    requestOcr,
    downloadDocument,
    refetch,
  } = useDocuments();

  const [activeCategory, setActiveCategory] = useState<DocumentCategory | 'ALL'>('ALL');
  const [activeStatus, setActiveStatus] = useState<DocumentStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [docToReplace, setDocToReplace] = useState<UserDocument | null>(null);
  const [docToReview, setDocToReview] = useState<UserDocument | null>(null);

  // Filter documents in memory for instant responsiveness
  const filteredDocs = documents.filter((doc) => {
    if (activeCategory !== 'ALL' && doc.documentCategory !== activeCategory) {
      return false;
    }
    if (activeStatus !== 'ALL' && doc.documentStatus !== activeStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.documentTypeLabel.toLowerCase().includes(q);
      const matchFile = doc.originalFileName.toLowerCase().includes(q);
      const matchAuth = doc.issuingAuthority?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchFile && !matchAuth) return false;
    }
    return true;
  });

  const readyCount = documents.filter((d) => d.documentStatus === 'READY').length;
  const reviewCount = documents.filter((d) => d.documentStatus === 'NEEDS_REVIEW').length;
  const expiredCount = documents.filter((d) => d.isExpired).length;

  const handleOpenUpload = (replace?: UserDocument) => {
    setDocToReplace(replace || null);
    setUploadModalOpen(true);
  };

  const handleRunOcr = async (doc: UserDocument) => {
    try {
      await requestOcr(doc.id, true);
    } catch {
      // Handled in hook
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-gov-800 text-xs font-bold uppercase tracking-wider mb-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Secure Citizen Document Vault</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Documents &amp; Verification Readiness
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Upload, organize, and extract information from your certificates. Prepare your
                required documents to apply effortlessly for government schemes and scholarships.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenUpload()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gov-800 hover:bg-gov-900 focus:outline-none focus:ring-2 focus:ring-gov-600 transition-all shadow-sm hover:shadow"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Total Documents</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{documents.length}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <p className="text-xs text-emerald-800 font-medium">Ready for Use</p>
              </div>
              <p className="text-xl font-bold text-emerald-950 mt-1">{readyCount}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <p className="text-xs text-amber-800 font-medium">Needs Review</p>
              </div>
              <p className="text-xl font-bold text-amber-950 mt-1">{reviewCount}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                <p className="text-xs text-red-800 font-medium">Expired</p>
              </div>
              <p className="text-xl font-bold text-red-950 mt-1">{expiredCount}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by certificate type, authority..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gov-600/20 text-slate-900"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              <select
                aria-label="Filter documents by status"
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value as DocumentStatus | 'ALL')}
                className="text-xs font-medium rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="READY">Ready</option>
                <option value="NEEDS_REVIEW">Needs Review</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100 no-scrollbar">
            {CATEGORY_TABS.map((tab) => {
              const active = activeCategory === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveCategory(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-gov-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Document Grid / Empty State */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-gov-700/20 border-t-gov-800 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading document library...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gov-50 text-gov-800 flex items-center justify-center mx-auto">
              <FolderOpen className="w-8 h-8" aria-hidden="true" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-bold text-slate-900">No Documents Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {searchQuery || activeCategory !== 'ALL' || activeStatus !== 'ALL'
                  ? 'No documents matched your search and filter criteria. Try clearing some filters.'
                  : 'Your document vault is currently empty. Upload your certificates to start checking readiness for schemes and scholarships.'}
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => handleOpenUpload()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gov-800 hover:bg-gov-900 transition-colors shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Upload First Document</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDownload={() => downloadDocument(doc.id, doc.originalFileName)}
                onDelete={() => deleteDocument(doc.id)}
                onRunOcr={handleRunOcr}
                onReviewExtraction={(d) => setDocToReview(d)}
                onReplace={(d) => handleOpenUpload(d)}
              />
            ))}
          </div>
        )}

        {/* Statutory Legal Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-800">Legal Notice &amp; Disclaimer:</p>
          <p>
            Documents uploaded here are used to help citizens organize statutory application requirements
            and extract relevant details. OCR results may contain inaccuracies and should always be reviewed
            prior to submission. Document readiness in this portal does not constitute legal authenticity certification
            or a guarantee of scheme approval. Final document acceptance and eligibility decisions are made
            solely by the respective scheme or scholarship authority.
          </p>
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setDocToReplace(null);
        }}
        onUpload={async (fd) => {
          await uploadDocument(fd);
        }}
        replaceDoc={docToReplace}
      />

      {/* Extraction Review Modal */}
      {docToReview && (
        <ExtractionReviewModal
          isOpen={Boolean(docToReview)}
          onClose={() => setDocToReview(null)}
          document={docToReview}
          onConfirmed={() => refetch()}
        />
      )}
    </div>
  );
};
