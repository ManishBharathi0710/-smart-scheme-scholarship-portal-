import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import { createApp } from '../src/app.js';
import { generateAccessToken } from '../src/modules/auth/auth.utils.js';
import {
  UserRole,
  UserStatus,
  DocumentCategory,
  DocumentStatus,
  OcrStatus,
  DocumentVerificationStatus,
  OcrExtractionStatus,
} from '@prisma/client';
import { documentsRepository } from '../src/modules/documents/documents.repository.js';
import { documentStorageService } from '../src/modules/documents/documents.storage.js';
import { profileService } from '../src/modules/profile/profile.service.js';
import { recommendationService } from '../src/modules/recommendations/recommendations.service.js';

describe('Module 6: Document Management, OCR & Verification Readiness', () => {
  const app = createApp();

  const userAId = '11111111-2222-3333-4444-555555555555';
  const userBId = '99999999-8888-7777-6666-555555555555';
  const documentId = '33333333-4444-5555-6666-777777777777';
  const schemeId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  const userAToken = generateAccessToken({
    id: userAId,
    email: 'citizenA@example.gov.in',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  const userBToken = generateAccessToken({
    id: userBId,
    email: 'citizenB@example.gov.in',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  // Valid minimal PDF buffer with %PDF magic bytes
  const validPdfBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF',
  );

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Document Upload & Security Validation', () => {
    it('POST /api/v1/documents requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .attach('file', validPdfBuffer, 'test.pdf')
        .field('documentType', 'INCOME_CERTIFICATE');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/documents rejects request without file', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ documentType: 'INCOME_CERTIFICATE' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/documents rejects invalid documentType not in catalog', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', validPdfBuffer, 'test.pdf')
        .field('documentType', 'UNOFFICIAL_RANDOM_DOCUMENT');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/documents rejects unsupported MIME type or magic byte spoofing', async () => {
      vi.spyOn(documentsRepository, 'findDuplicateByChecksum').mockResolvedValue(null);

      const maliciousBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00FAKE_EXECUTABLE_CONTENT');

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', maliciousBuffer, 'exploit.pdf')
        .field('documentType', 'INCOME_CERTIFICATE');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/signature does not match|Invalid file content/i);
    });

    it('POST /api/v1/documents rejects duplicate file upload with same checksum', async () => {
      vi.spyOn(documentsRepository, 'findDuplicateByChecksum').mockResolvedValue({
        id: 'existing-doc-id',
        userId: userAId,
        originalFileName: 'income.pdf',
      } as any);

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', validPdfBuffer, 'income.pdf')
        .field('documentType', 'INCOME_CERTIFICATE');

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/already been uploaded/i);
    });

    it('POST /api/v1/documents successfully uploads valid document and stores privately', async () => {
      vi.spyOn(documentsRepository, 'findDuplicateByChecksum').mockResolvedValue(null);
      vi.spyOn(documentsRepository, 'findUserDocumentsForTypes').mockResolvedValue([]);
      vi.spyOn(documentStorageService, 'saveFile').mockResolvedValue({
        storageKey: 'doc_123',
        storedFileName: 'doc_123.pdf',
        fileSize: validPdfBuffer.length,
        checksum: 'fake-checksum-sha256',
        storageProvider: 'LOCAL_SECURE_STORAGE',
      });

      const mockSavedDoc = {
        id: documentId,
        userId: userAId,
        documentGroupId: 'group-1',
        version: 1,
        isCurrent: true,
        documentType: 'INCOME_CERTIFICATE',
        documentCategory: DocumentCategory.INCOME,
        originalFileName: 'income_cert_2026.pdf',
        storedFileName: 'doc_123.pdf',
        storageKey: 'doc_123',
        mimeType: 'application/pdf',
        fileSize: validPdfBuffer.length,
        checksum: 'fake-checksum-sha256',
        storageProvider: 'LOCAL_SECURE_STORAGE',
        documentStatus: DocumentStatus.READY,
        ocrStatus: OcrStatus.NOT_REQUESTED,
        verificationStatus: DocumentVerificationStatus.PENDING_REVIEW,
        issuedAt: new Date('2026-01-10'),
        expiresAt: new Date('2027-01-10'),
        issuingAuthority: 'Tahsildar',
        documentNumberMasked: 'INC-XXXX-1234',
        ocrConsent: false,
        ocrConsentedAt: null,
        ocrVersion: null,
        extractions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        deletedBy: null,
      };

      vi.spyOn(documentsRepository, 'createDocument').mockResolvedValue(mockSavedDoc as any);
      vi.spyOn(documentsRepository, 'createAuditLog').mockResolvedValue({} as any);
      vi.spyOn(documentsRepository, 'findDocumentById').mockResolvedValue(mockSavedDoc as any);

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', validPdfBuffer, 'income_cert_2026.pdf')
        .field('documentType', 'INCOME_CERTIFICATE')
        .field('issuingAuthority', 'Tahsildar');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(documentId);
      expect(res.body.data.documentType).toBe('INCOME_CERTIFICATE');
      expect(res.body.data.documentCategory).toBe('INCOME');
      expect(res.body.data.version).toBe(1);
    });
  });

  describe('Document Access & User Isolation', () => {
    it('GET /api/v1/documents lists user documents', async () => {
      vi.spyOn(documentsRepository, 'findUserDocuments').mockResolvedValue({
        items: [
          {
            id: documentId,
            userId: userAId,
            documentGroupId: 'group-1',
            version: 1,
            isCurrent: true,
            documentType: 'INCOME_CERTIFICATE',
            documentCategory: DocumentCategory.INCOME,
            originalFileName: 'income.pdf',
            storedFileName: 'doc_123.pdf',
            storageKey: 'doc_123',
            mimeType: 'application/pdf',
            fileSize: 1024,
            checksum: 'chk123',
            storageProvider: 'LOCAL_SECURE_STORAGE',
            documentStatus: DocumentStatus.READY,
            ocrStatus: OcrStatus.NOT_REQUESTED,
            verificationStatus: DocumentVerificationStatus.PENDING_REVIEW,
            issuedAt: null,
            expiresAt: null,
            issuingAuthority: null,
            documentNumberMasked: null,
            ocrConsent: false,
            ocrConsentedAt: null,
            ocrVersion: null,
            extractions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            deletedBy: null,
          } as any,
        ],
        total: 1,
      });

      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(documentId);
    });

    it('GET /api/v1/documents/:documentId prevents User B from accessing User A document', async () => {
      vi.spyOn(documentsRepository, 'findDocumentById').mockResolvedValue({
        id: documentId,
        userId: userAId, // Belongs to User A
        deletedAt: null,
      } as any);

      const res = await request(app)
        .get(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${userBToken}`); // Requested by User B

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/permission/i);
    });

    it('GET /api/v1/documents/:documentId/download prevents User B from downloading User A document', async () => {
      vi.spyOn(documentsRepository, 'findDocumentById').mockResolvedValue({
        id: documentId,
        userId: userAId, // Belongs to User A
        deletedAt: null,
      } as any);

      const res = await request(app)
        .get(`/api/v1/documents/${documentId}/download`)
        .set('Authorization', `Bearer ${userBToken}`); // Requested by User B

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('DELETE /api/v1/documents/:documentId prevents User B from deleting User A document', async () => {
      vi.spyOn(documentsRepository, 'findDocumentById').mockResolvedValue({
        id: documentId,
        userId: userAId,
        deletedAt: null,
      } as any);

      const res = await request(app)
        .delete(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('DELETE /api/v1/documents/:documentId soft-deletes document for owner', async () => {
      vi.spyOn(documentsRepository, 'findDocumentById').mockResolvedValue({
        id: documentId,
        userId: userAId,
        deletedAt: null,
      } as any);
      vi.spyOn(documentsRepository, 'softDeleteDocument').mockResolvedValue({} as any);
      vi.spyOn(documentsRepository, 'createAuditLog').mockResolvedValue({} as any);

      const res = await request(app)
        .delete(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/removed/i);
    });
  });

  describe('Signed Download URLs', () => {
    it('POST /api/v1/documents/:documentId/signed-download generates short-lived token', async () => {
      vi.spyOn(documentsRepository, 'findDocumentById').mockResolvedValue({
        id: documentId,
        userId: userAId,
        storageKey: 'doc_123',
        deletedAt: null,
      } as any);

      const res = await request(app)
        .post(`/api/v1/documents/${documentId}/signed-download`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.expiresInSeconds).toBe(300);
    });

    it('GET /api/v1/documents/download/signed rejects missing or invalid signed token', async () => {
      const res = await request(app).get(
        '/api/v1/documents/download/signed?token=invalid.token.123',
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/invalid or has expired/i);
    });
  });

  describe('OCR Processing, Consent & User Confirmation', () => {
    it('POST /api/v1/documents/:documentId/ocr requires explicit user consent', async () => {
      const res = await request(app)
        .post(`/api/v1/documents/${documentId}/ocr`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ ocrConsent: false }); // Consent withheld

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.details || res.body.error?.message).toBeDefined();
    });

    it('POST /api/v1/documents/:documentId/ocr executes OCR with consent and extracts structured fields', async () => {
      const mockDoc = {
        id: documentId,
        userId: userAId,
        documentType: 'INCOME_CERTIFICATE',
        storedFileName: 'income.pdf',
        originalFileName: 'income.pdf',
        storageKey: 'doc_123',
        ocrStatus: OcrStatus.NOT_REQUESTED,
        deletedAt: null,
        extractions: [],
      };

      vi.spyOn(documentsRepository, 'findDocumentById').mockResolvedValue(mockDoc as any);
      vi.spyOn(documentsRepository, 'findLatestExtractionForDocument').mockResolvedValue(null);
      vi.spyOn(documentsRepository, 'updateDocument').mockResolvedValue(mockDoc as any);
      vi.spyOn(documentsRepository, 'createAuditLog').mockResolvedValue({} as any);

      vi.spyOn(documentStorageService, 'getFile').mockResolvedValue({
        filePath: '/tmp/test.pdf',
        fileSize: 1024,
      });

      vi.spyOn(fs.promises, 'readFile').mockResolvedValue(validPdfBuffer);

      const mockExtraction = {
        id: 'ext-123',
        documentId,
        ocrText: 'Government Income Certificate\nAnnual Family Income: Rs. 1,80,000',
        structuredFields: [
          {
            field: 'annualIncome',
            label: 'Annual Family Income',
            extractedValue: 180000,
            confidence: 0.94,
            confidenceBand: 'HIGH',
            suggestedProfileField: 'financial.annualFamilyIncome',
          },
        ],
        confidence: 0.94,
        provider: 'LOCAL_HEURISTIC_OCR',
        providerVersion: '1.0.0',
        status: OcrExtractionStatus.PENDING_REVIEW,
        confirmedValues: null,
        confirmedBy: null,
        confirmedAt: null,
        appliedToProfile: false,
        appliedToProfileAt: null,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(documentsRepository, 'createExtraction').mockResolvedValue(mockExtraction as any);
      vi.spyOn(documentsRepository, 'findExtractionById').mockResolvedValue(mockExtraction as any);

      const res = await request(app)
        .post(`/api/v1/documents/${documentId}/ocr`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ ocrConsent: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.structuredFields).toBeDefined();
      expect(res.body.data.structuredFields[0].field).toBe('annualIncome');
      expect(res.body.data.structuredFields[0].extractedValue).toBe(180000);
      expect(res.body.data.confidenceBand).toBe('HIGH');
    });

    it('POST /api/v1/documents/:documentId/confirm-extraction updates profile ONLY with explicit user consent', async () => {
      const mockDoc = {
        id: documentId,
        userId: userAId,
        documentType: 'INCOME_CERTIFICATE',
        deletedAt: null,
      };

      vi.spyOn(documentsRepository, 'findDocumentById').mockResolvedValue(mockDoc as any);

      const mockExtraction = {
        id: 'ext-123',
        documentId,
        ocrText: 'Government Income Certificate',
        structuredFields: [
          {
            field: 'annualIncome',
            label: 'Annual Family Income',
            extractedValue: 180000,
            confidence: 0.94,
            confidenceBand: 'HIGH',
            suggestedProfileField: 'financial.annualFamilyIncome',
          },
        ],
        confidence: 0.94,
        provider: 'LOCAL_HEURISTIC_OCR',
        providerVersion: '1.0.0',
        status: OcrExtractionStatus.PENDING_REVIEW,
        confirmedValues: null,
        confirmedBy: null,
        confirmedAt: null,
        appliedToProfile: false,
        appliedToProfileAt: null,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(documentsRepository, 'findLatestExtractionForDocument').mockResolvedValue(
        mockExtraction as any,
      );
      vi.spyOn(documentsRepository, 'updateExtraction').mockResolvedValue({
        ...mockExtraction,
        status: OcrExtractionStatus.CONFIRMED,
        confirmedValues: { annualIncome: 180000 },
        confirmedAt: new Date(),
      } as any);
      vi.spyOn(documentsRepository, 'findExtractionById').mockResolvedValue({
        ...mockExtraction,
        status: OcrExtractionStatus.CONFIRMED,
        appliedToProfile: true,
      } as any);
      vi.spyOn(documentsRepository, 'updateDocument').mockResolvedValue({} as any);
      vi.spyOn(documentsRepository, 'createAuditLog').mockResolvedValue({} as any);

      const profileSpy = vi.spyOn(profileService, 'updateFinancial').mockResolvedValue({} as any);
      const recSpy = vi
        .spyOn(recommendationService, 'refreshUserRecommendations')
        .mockResolvedValue([] as any);

      const res = await request(app)
        .post(`/api/v1/documents/${documentId}/confirm-extraction`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          confirmedFields: { annualIncome: 180000 },
          applyToProfile: true,
          userConsentToUpdateProfile: true, // User gave explicit consent
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(profileSpy).toHaveBeenCalledWith(userAId, { annualFamilyIncome: 180000 });
      expect(recSpy).toHaveBeenCalledWith(userAId);
    });

    it('POST /api/v1/documents/:documentId/confirm-extraction DOES NOT touch profile without explicit consent', async () => {
      const mockDoc = {
        id: documentId,
        userId: userAId,
        documentType: 'INCOME_CERTIFICATE',
        deletedAt: null,
      };

      vi.spyOn(documentsRepository, 'findDocumentById').mockResolvedValue(mockDoc as any);

      const mockExtraction = {
        id: 'ext-123',
        documentId,
        structuredFields: [],
        confidence: 0.9,
        status: OcrExtractionStatus.PENDING_REVIEW,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(documentsRepository, 'findLatestExtractionForDocument').mockResolvedValue(
        mockExtraction as any,
      );
      vi.spyOn(documentsRepository, 'updateExtraction').mockResolvedValue({
        ...mockExtraction,
        status: OcrExtractionStatus.CONFIRMED,
      } as any);
      vi.spyOn(documentsRepository, 'findExtractionById').mockResolvedValue({
        ...mockExtraction,
        status: OcrExtractionStatus.CONFIRMED,
      } as any);
      vi.spyOn(documentsRepository, 'updateDocument').mockResolvedValue({} as any);
      vi.spyOn(documentsRepository, 'createAuditLog').mockResolvedValue({} as any);

      const profileSpy = vi.spyOn(profileService, 'updateFinancial');

      const res = await request(app)
        .post(`/api/v1/documents/${documentId}/confirm-extraction`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          confirmedFields: { annualIncome: 180000 },
          applyToProfile: false, // Consent NOT given to update profile
          userConsentToUpdateProfile: false,
        });

      expect(res.status).toBe(200);
      expect(profileSpy).not.toHaveBeenCalled();
    });
  });

  describe('Scheme Document Readiness Evaluation', () => {
    it('GET /api/v1/schemes/:schemeId/document-readiness returns readiness checklist', async () => {
      vi.spyOn(documentsRepository, 'findSchemeWithRequirements').mockResolvedValue({
        id: schemeId,
        name: 'National Merit Scholarship',
        documents: [
          {
            id: 'req-1',
            schemeId,
            name: 'Income Certificate',
            documentType: 'INCOME_CERTIFICATE',
            mandatory: true,
            description: 'Annual family income certificate issued by competent authority',
          },
          {
            id: 'req-2',
            schemeId,
            name: 'Community Certificate',
            documentType: 'COMMUNITY_CERTIFICATE',
            mandatory: true,
            description: 'OBC/SC/ST certificate if applicable',
          },
          {
            id: 'req-3',
            schemeId,
            name: 'Higher Secondary Marksheet',
            documentType: 'MARKSHEET',
            mandatory: false,
            description: '12th standard marksheet',
          },
        ],
      } as any);

      // User has Income Certificate (READY) but missing Community Certificate and Marksheet
      vi.spyOn(documentsRepository, 'findUserDocumentsForTypes').mockResolvedValue([
        {
          id: documentId,
          documentType: 'INCOME_CERTIFICATE',
          originalFileName: 'income.pdf',
          documentStatus: DocumentStatus.READY,
          ocrStatus: OcrStatus.COMPLETED,
          expiresAt: new Date('2027-12-31'),
        } as any,
      ]);

      const res = await request(app)
        .get(`/api/v1/schemes/${schemeId}/document-readiness`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.schemeId).toBe(schemeId);
      expect(res.body.data.totalRequirements).toBe(3);
      expect(res.body.data.readyCount).toBe(1);
      expect(res.body.data.missingCount).toBe(1); // Community cert is mandatory and missing
      expect(res.body.data.isFullyPrepared).toBe(false);

      const items = res.body.data.requirements;
      expect(items[0].readinessStatus).toBe('READY');
      expect(items[0].documentType).toBe('INCOME_CERTIFICATE');
      expect(items[1].readinessStatus).toBe('MISSING');
      expect(items[1].documentType).toBe('COMMUNITY_CERTIFICATE');

      // Crucial constraint: must provide disclaimer and NOT declare official eligibility
      expect(res.body.data.disclaimer).toMatch(
        /help organize application requirements.*Final document acceptance and legal eligibility decisions are made by the respective scheme authority/i,
      );
    });
  });
});
