import {
  DocumentCategory,
  DocumentStatus,
  OcrStatus,
  DocumentVerificationStatus,
  OcrExtractionStatus,
} from '@prisma/client';

export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ExtractedFieldItem {
  field: string;
  label: string;
  value: unknown;
  confidence: number;
  confidenceBand: ConfidenceBand;
  suggestedProfileField?: string | null;
}

export interface UserDocumentDto {
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
  latestExtractionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentListQuery {
  page?: number;
  limit?: number;
  documentType?: string;
  documentCategory?: DocumentCategory;
  documentStatus?: DocumentStatus;
  ocrStatus?: OcrStatus;
  verificationStatus?: DocumentVerificationStatus;
  onlyCurrent?: boolean;
}

export interface DocumentUploadInput {
  userId: string;
  documentType: string;
  documentCategory?: DocumentCategory;
  issuedAt?: string | null;
  expiresAt?: string | null;
  issuingAuthority?: string | null;
  documentNumberMasked?: string | null;
  replaceDocumentId?: string | null;
  ocrConsent?: boolean;
}

export interface DocumentExtractionDto {
  id: string;
  documentId: string;
  confidence: number;
  confidenceBand: ConfidenceBand;
  provider: string;
  providerVersion: string;
  status: OcrExtractionStatus;
  structuredFields: ExtractedFieldItem[];
  confirmedValues?: Record<string, unknown> | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  appliedToProfile: boolean;
  appliedToProfileAt?: string | null;
  processedAt: string;
  createdAt: string;
  canApplyToProfile: boolean;
}

export interface ConfirmExtractionInput {
  confirmedFields: Record<string, unknown>;
  applyToProfile?: boolean;
  userConsentToUpdateProfile?: boolean;
}

export interface SchemeRequirementReadinessItem {
  requirementId: string;
  requirementName: string;
  documentType: string;
  mandatory: boolean;
  description: string | null;
  readinessStatus: 'READY' | 'NEEDS_REVIEW' | 'MISSING' | 'EXPIRED' | 'NOT_REQUIRED';
  matchedDocument?: {
    id: string;
    originalFileName: string;
    documentStatus: DocumentStatus;
    ocrStatus: OcrStatus;
    expiresAt: string | null;
    isExpired: boolean;
  } | null;
  readinessNote: string;
}

export interface SchemeDocumentReadinessDto {
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
