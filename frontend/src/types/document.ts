export type DocumentCategory =
  | 'IDENTITY'
  | 'INCOME'
  | 'COMMUNITY'
  | 'DISABILITY'
  | 'EDUCATION'
  | 'RESIDENCE'
  | 'BANK'
  | 'EMPLOYMENT'
  | 'AGRICULTURE'
  | 'BUSINESS'
  | 'AGE_PROOF'
  | 'ADDRESS_PROOF'
  | 'OTHER';

export type DocumentStatus =
  | 'NOT_UPLOADED'
  | 'UPLOAD_STARTED'
  | 'UPLOADED'
  | 'SECURITY_VALIDATING'
  | 'PROCESSING'
  | 'READY'
  | 'NEEDS_REVIEW'
  | 'EXPIRED'
  | 'REJECTED'
  | 'DELETED';

export type OcrStatus =
  | 'NOT_REQUESTED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'LOW_CONFIDENCE';

export type DocumentVerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING_REVIEW'
  | 'VERIFIED_FOR_USE'
  | 'OFFICIALLY_VERIFIED'
  | 'REJECTED';

export type OcrExtractionStatus =
  | 'PENDING_REVIEW'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'SUPERSEDED';

export interface ExtractedFieldItem {
  field: string;
  label: string;
  extractedValue: unknown;
  confidence: number;
  confidenceBand: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedProfileField: string | null;
}

export interface UserDocument {
  id: string;
  userId: string;
  documentGroupId: string;
  version: number;
  isCurrent: boolean;
  documentType: string;
  documentTypeLabel: string;
  documentCategory: DocumentCategory;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  documentStatus: DocumentStatus;
  ocrStatus: OcrStatus;
  verificationStatus: DocumentVerificationStatus;
  issuedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  issuingAuthority: string | null;
  documentNumberMasked: string | null;
  ocrConsent: boolean;
  ocrConsentedAt: string | null;
  hasExtraction: boolean;
  latestExtractionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentExtraction {
  id: string;
  documentId: string;
  confidence: number;
  confidenceBand: 'HIGH' | 'MEDIUM' | 'LOW';
  provider: string;
  providerVersion: string;
  status: OcrExtractionStatus;
  structuredFields: ExtractedFieldItem[];
  confirmedValues: Record<string, unknown> | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  appliedToProfile: boolean;
  appliedToProfileAt: string | null;
  processedAt: string;
  createdAt: string;
  canApplyToProfile: boolean;
}

export interface ConfirmExtractionInput {
  confirmedFields: Record<string, unknown>;
  applyToProfile: boolean;
  userConsentToUpdateProfile: boolean;
}

export interface MatchedDocumentSummary {
  id: string;
  originalFileName: string;
  documentStatus: DocumentStatus;
  ocrStatus: OcrStatus;
  expiresAt: string | null;
  isExpired: boolean;
}

export interface SchemeRequirementReadinessItem {
  requirementId: string;
  requirementName: string;
  documentType: string;
  mandatory: boolean;
  description: string | null;
  readinessStatus: 'READY' | 'NEEDS_REVIEW' | 'MISSING' | 'EXPIRED';
  matchedDocument: MatchedDocumentSummary | null;
  readinessNote: string;
}

export interface SchemeDocumentReadiness {
  schemeId: string;
  schemeName: string;
  totalRequirements: number;
  readyCount: number;
  missingCount: number;
  needsReviewCount: number;
  expiredCount: number;
  isFullyPrepared: boolean;
  requirements: SchemeRequirementReadinessItem[];
  evaluatedAt: string;
  disclaimer: string;
}

export interface DocumentTypeOption {
  type: string;
  label: string;
  category: DocumentCategory;
  supportsOCR: boolean;
}

export const CONTROLLED_DOCUMENT_TYPES: DocumentTypeOption[] = [
  { type: 'AADHAAR', label: 'Aadhaar Card', category: 'IDENTITY', supportsOCR: true },
  { type: 'PAN', label: 'PAN Card', category: 'IDENTITY', supportsOCR: true },
  { type: 'PASSPORT', label: 'Passport', category: 'IDENTITY', supportsOCR: true },
  { type: 'VOTER_ID', label: 'Voter ID (EPIC)', category: 'IDENTITY', supportsOCR: true },
  { type: 'DRIVING_LICENSE', label: 'Driving License', category: 'IDENTITY', supportsOCR: true },
  { type: 'INCOME_CERTIFICATE', label: 'Income Certificate', category: 'INCOME', supportsOCR: true },
  { type: 'COMMUNITY_CERTIFICATE', label: 'Community / Caste Certificate', category: 'COMMUNITY', supportsOCR: true },
  { type: 'EWS_CERTIFICATE', label: 'Economically Weaker Section (EWS) Certificate', category: 'COMMUNITY', supportsOCR: true },
  { type: 'OBC_CERTIFICATE', label: 'OBC Certificate (Non-Creamy Layer)', category: 'COMMUNITY', supportsOCR: true },
  { type: 'DISABILITY_CERTIFICATE', label: 'Disability Certificate (UDID)', category: 'DISABILITY', supportsOCR: true },
  { type: 'MARKSHEET', label: 'Marksheet / Academic Transcript', category: 'EDUCATION', supportsOCR: true },
  { type: 'DEGREE_CERTIFICATE', label: 'Degree / Diploma Certificate', category: 'EDUCATION', supportsOCR: true },
  { type: 'BONAFIDE_CERTIFICATE', label: 'Bonafide Student Certificate', category: 'EDUCATION', supportsOCR: true },
  { type: 'STUDENT_ID', label: 'Student Identity Card', category: 'EDUCATION', supportsOCR: false },
  { type: 'BANK_PASSBOOK', label: 'Bank Passbook (Front Page)', category: 'BANK', supportsOCR: true },
  { type: 'BANK_STATEMENT', label: 'Bank Statement', category: 'BANK', supportsOCR: false },
  { type: 'CANCELLED_CHEQUE', label: 'Cancelled Cheque', category: 'BANK', supportsOCR: false },
  { type: 'DOMICILE_CERTIFICATE', label: 'Domicile / Nativity Certificate', category: 'RESIDENCE', supportsOCR: true },
  { type: 'RESIDENCE_CERTIFICATE', label: 'Residence Certificate', category: 'RESIDENCE', supportsOCR: true },
  { type: 'LAND_RECORD', label: 'Agricultural Land Record (Patta/Chitta/7-12)', category: 'AGRICULTURE', supportsOCR: false },
  { type: 'FARMER_CERTIFICATE', label: 'Small / Marginal Farmer Certificate', category: 'AGRICULTURE', supportsOCR: true },
  { type: 'EMPLOYMENT_CERTIFICATE', label: 'Employment Certificate / Salary Slip', category: 'EMPLOYMENT', supportsOCR: false },
  { type: 'BUSINESS_REGISTRATION', label: 'Udyam / Business Registration', category: 'BUSINESS', supportsOCR: true },
  { type: 'OTHER', label: 'Other Statutory Document', category: 'OTHER', supportsOCR: false },
];
