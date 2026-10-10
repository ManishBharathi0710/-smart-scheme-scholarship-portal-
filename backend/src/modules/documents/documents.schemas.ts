import { z } from 'zod';
import {
  DocumentCategory,
  DocumentStatus,
  OcrStatus,
  DocumentVerificationStatus,
} from '@prisma/client';
import { isDocumentTypeValid } from './documents.catalog.js';

export const documentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  documentType: z.string().optional(),
  documentCategory: z.nativeEnum(DocumentCategory).optional(),
  documentStatus: z.nativeEnum(DocumentStatus).optional(),
  ocrStatus: z.nativeEnum(OcrStatus).optional(),
  verificationStatus: z.nativeEnum(DocumentVerificationStatus).optional(),
  onlyCurrent: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
});

export const documentUploadBodySchema = z.object({
  documentType: z
    .string()
    .min(1, 'Document type is required')
    .refine((val) => isDocumentTypeValid(val), {
      message: 'Invalid or unsupported document type. Must match controlled catalog.',
    }),
  documentCategory: z.nativeEnum(DocumentCategory).optional(),
  issuedAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .nullable(),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .nullable(),
  issuingAuthority: z.string().max(150).optional().nullable(),
  documentNumberMasked: z.string().max(50).optional().nullable(),
  replaceDocumentId: z.string().uuid().optional().nullable(),
  ocrConsent: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
});

export const requestOcrSchema = z.object({
  ocrConsent: z.boolean().refine((val) => val === true, {
    message: 'Explicit user consent is required before performing OCR on documents.',
  }),
});

export const confirmExtractionSchema = z.object({
  confirmedFields: z.record(z.unknown()),
  applyToProfile: z.boolean().default(false),
  userConsentToUpdateProfile: z.boolean().default(false),
});

export const documentIdParamSchema = z.object({
  documentId: z.string().uuid('Invalid document identifier'),
});

export const schemeIdParamSchema = z.object({
  schemeId: z.string().uuid('Invalid scheme identifier'),
});
