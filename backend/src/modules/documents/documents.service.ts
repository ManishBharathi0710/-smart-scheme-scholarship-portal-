import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  DocumentStatus,
  OcrStatus,
  DocumentVerificationStatus,
  DocumentAuditAction,
  UserDocument,
  DocumentExtraction,
  SocialCategory,
  Gender,
  Prisma,
} from '@prisma/client';
import { DocumentsRepository, documentsRepository } from './documents.repository.js';
import { DocumentStorageService, documentStorageService } from './documents.storage.js';
import { OcrService, ocrService } from './documents.ocr.js';
import {
  getDocumentTypeDefinition,
  getDocumentCategoryForType,
  isAllowedMimeType,
} from './documents.catalog.js';
import {
  UserDocumentDto,
  DocumentListQuery,
  DocumentUploadInput,
  DocumentExtractionDto,
  ConfirmExtractionInput,
  SchemeDocumentReadinessDto,
  SchemeRequirementReadinessItem,
  ExtractedFieldItem,
} from './documents.types.js';
import {
  ProfileService,
  profileService as defaultProfileService,
} from '../profile/profile.service.js';
import {
  RecommendationService,
  recommendationService as defaultRecommendationService,
} from '../recommendations/recommendations.service.js';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '../../errors/app-error.js';
import { notificationEventService } from '../notifications/notifications.event-service.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class DocumentsService {
  private readonly repo: DocumentsRepository;
  private readonly storage: DocumentStorageService;
  private readonly ocr: OcrService;
  private readonly profile: ProfileService;
  private readonly recommendations: RecommendationService;

  constructor(
    repo: DocumentsRepository = documentsRepository,
    storage: DocumentStorageService = documentStorageService,
    ocr: OcrService = ocrService,
    profile: ProfileService = defaultProfileService,
    recommendations: RecommendationService = defaultRecommendationService,
  ) {
    this.repo = repo;
    this.storage = storage;
    this.ocr = ocr;
    this.profile = profile;
    this.recommendations = recommendations;
  }

  private mapDocumentToDto(
    doc: UserDocument & { extractions?: DocumentExtraction[] },
  ): UserDocumentDto {
    const typeDef = getDocumentTypeDefinition(doc.documentType);
    const now = new Date();
    const isExpired = doc.expiresAt ? new Date(doc.expiresAt) < now : false;

    // Effective status considering expiry
    let effectiveStatus = doc.documentStatus;
    if (isExpired && doc.documentStatus !== DocumentStatus.REJECTED) {
      effectiveStatus = DocumentStatus.EXPIRED;
    }

    const latestExtraction =
      doc.extractions && doc.extractions.length > 0 ? doc.extractions[0] : null;

    return {
      id: doc.id,
      userId: doc.userId,
      documentGroupId: doc.documentGroupId,
      version: doc.version,
      isCurrent: doc.isCurrent,
      documentType: doc.documentType,
      documentTypeLabel: typeDef.label,
      documentCategory: doc.documentCategory,
      originalFileName: doc.originalFileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      checksum: doc.checksum,
      documentStatus: effectiveStatus,
      ocrStatus: doc.ocrStatus,
      verificationStatus: doc.verificationStatus,
      issuedAt: doc.issuedAt ? (new Date(doc.issuedAt).toISOString().split('T')[0] ?? null) : null,
      expiresAt: doc.expiresAt
        ? (new Date(doc.expiresAt).toISOString().split('T')[0] ?? null)
        : null,
      isExpired,
      issuingAuthority: doc.issuingAuthority,
      documentNumberMasked: doc.documentNumberMasked,
      ocrConsent: doc.ocrConsent,
      ocrConsentedAt: doc.ocrConsentedAt ? doc.ocrConsentedAt.toISOString() : null,
      hasExtraction: Boolean(latestExtraction),
      latestExtractionId: latestExtraction?.id || null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private mapExtractionToDto(extraction: DocumentExtraction): DocumentExtractionDto {
    const structuredFields = (extraction.structuredFields as unknown as ExtractedFieldItem[]) || [];

    const canApplyToProfile = structuredFields.some((f) => Boolean(f.suggestedProfileField));

    let band: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
    if (extraction.confidence < env.OCR_CONFIDENCE_THRESHOLD) {
      band = 'LOW';
    } else if (extraction.confidence < 0.85) {
      band = 'MEDIUM';
    }

    return {
      id: extraction.id,
      documentId: extraction.documentId,
      confidence: extraction.confidence,
      confidenceBand: band,
      provider: extraction.provider,
      providerVersion: extraction.providerVersion,
      status: extraction.status,
      structuredFields,
      confirmedValues: (extraction.confirmedValues as Record<string, unknown>) || null,
      confirmedAt: extraction.confirmedAt ? extraction.confirmedAt.toISOString() : null,
      confirmedBy: extraction.confirmedBy,
      appliedToProfile: extraction.appliedToProfile,
      appliedToProfileAt: extraction.appliedToProfileAt
        ? extraction.appliedToProfileAt.toISOString()
        : null,
      processedAt: extraction.processedAt
        ? extraction.processedAt.toISOString()
        : new Date().toISOString(),
      createdAt: extraction.createdAt
        ? extraction.createdAt.toISOString()
        : new Date().toISOString(),
      canApplyToProfile,
    };
  }

  /**
   * Secure upload document with validation, checksumming, versioning, and private storage.
   */
  async uploadDocument(
    input: DocumentUploadInput,
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    auditMeta?: { ipAddress?: string; userAgent?: string },
  ): Promise<UserDocumentDto> {
    const {
      userId,
      documentType,
      issuedAt,
      expiresAt,
      issuingAuthority,
      documentNumberMasked,
      replaceDocumentId,
      ocrConsent,
    } = input;

    // 1. File size enforcement
    const maxBytes = env.DOCUMENT_MAX_SIZE_MB * 1024 * 1024;
    if (fileBuffer.length > maxBytes) {
      throw new ValidationError(
        `File size (${(fileBuffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${env.DOCUMENT_MAX_SIZE_MB} MB.`,
      );
    }

    // 2. MIME type & document catalog validation
    if (!isAllowedMimeType(documentType, mimeType)) {
      throw new ValidationError(
        `Unsupported format ${mimeType} for document type ${documentType}. Allowed: PDF, JPEG, PNG.`,
      );
    }

    // 3. Compute checksum & check for exact duplicate
    const checksum = this.storage.computeChecksum(fileBuffer);
    const existingDuplicate = await this.repo.findDuplicateByChecksum(userId, checksum);
    if (existingDuplicate) {
      throw new ConflictError(
        'This exact document file has already been uploaded to your library.',
      );
    }

    // 4. Save to private storage with magic bytes validation
    const storageResult = await this.storage.saveFile(fileBuffer, originalFileName, mimeType);

    // 5. Versioning logic
    let documentGroupId = uuidv4();
    let version = 1;

    if (replaceDocumentId) {
      const prevDoc = await this.repo.findDocumentById(replaceDocumentId);
      if (prevDoc && prevDoc.userId === userId) {
        documentGroupId = prevDoc.documentGroupId;
        version = prevDoc.version + 1;
        await this.repo.demoteCurrentVersions(documentGroupId);
      }
    } else {
      // Check if user already has an active document of this same type
      const currentOfSameType = await this.repo.findUserDocumentsForTypes(userId, [documentType]);
      const activeExisting = currentOfSameType[0];
      if (activeExisting) {
        documentGroupId = activeExisting.documentGroupId;
        version = activeExisting.version + 1;
        await this.repo.demoteCurrentVersions(documentGroupId);
      }
    }

    // 6. Category and initial status
    const category = input.documentCategory || getDocumentCategoryForType(documentType);
    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
    const isAlreadyExpired = parsedExpiresAt ? parsedExpiresAt < new Date() : false;

    const initialStatus = isAlreadyExpired ? DocumentStatus.EXPIRED : DocumentStatus.READY;

    // 7. Create database record
    const createdDoc = await this.repo.createDocument({
      user: { connect: { id: userId } },
      documentGroupId,
      version,
      isCurrent: true,
      documentType,
      documentCategory: category,
      originalFileName: originalFileName.slice(0, 255),
      storedFileName: storageResult.storedFileName,
      storageKey: storageResult.storageKey,
      mimeType,
      fileSize: storageResult.fileSize,
      checksum: storageResult.checksum,
      storageProvider: storageResult.storageProvider,
      documentStatus: initialStatus,
      ocrStatus: OcrStatus.NOT_REQUESTED,
      verificationStatus: DocumentVerificationStatus.UNVERIFIED,
      issuedAt: issuedAt ? new Date(issuedAt) : null,
      expiresAt: parsedExpiresAt,
      issuingAuthority: issuingAuthority || null,
      documentNumberMasked: documentNumberMasked || null,
      ocrConsent: Boolean(ocrConsent),
      ocrConsentedAt: ocrConsent ? new Date() : null,
    });

    // 8. Record audit log
    await this.repo.createAuditLog(
      userId,
      replaceDocumentId
        ? DocumentAuditAction.DOCUMENT_REPLACED
        : DocumentAuditAction.DOCUMENT_UPLOADED,
      createdDoc.id,
      {
        documentType,
        version,
        fileSize: storageResult.fileSize,
      },
      auditMeta?.ipAddress,
      auditMeta?.userAgent,
    );

    // 9. If OCR consent given and document supports OCR, process OCR automatically
    const typeDef = getDocumentTypeDefinition(documentType);
    if (ocrConsent && typeDef.supportsOCR) {
      try {
        await this.executeOcr(userId, createdDoc.id, fileBuffer, originalFileName);
      } catch (err) {
        logger.warn({ err, documentId: createdDoc.id }, 'Initial OCR processing encountered error');
      }
    }

    const reloaded = await this.repo.findDocumentById(createdDoc.id);
    return this.mapDocumentToDto(reloaded || createdDoc);
  }

  /**
   * List authenticated user's documents with pagination and filters
   */
  async getUserDocuments(
    userId: string,
    query: DocumentListQuery,
  ): Promise<{
    items: UserDocumentDto[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { items, total } = await this.repo.findUserDocuments(userId, query);
    const limit = query.limit || 20;
    const page = query.page || 1;

    return {
      items: items.map((doc) => this.mapDocumentToDto(doc)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single document with strict ownership verification
   */
  async getDocumentById(userId: string, documentId: string): Promise<UserDocumentDto> {
    const doc = await this.repo.findDocumentById(documentId);
    if (!doc || doc.deletedAt) {
      throw new NotFoundError('Document not found in library.');
    }

    if (doc.userId !== userId) {
      throw new AuthorizationError('You do not have permission to access this document.');
    }

    return this.mapDocumentToDto(doc);
  }

  /**
   * Download user document with strict ownership check
   */
  async getDocumentForDownload(
    userId: string,
    documentId: string,
    auditMeta?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ filePath: string; originalFileName: string; mimeType: string; fileSize: number }> {
    const doc = await this.repo.findDocumentById(documentId);
    if (!doc || doc.deletedAt) {
      throw new NotFoundError('Document not found.');
    }

    if (doc.userId !== userId) {
      throw new AuthorizationError('You do not have permission to download this document.');
    }

    const file = await this.storage.getFile(doc.storageKey, doc.storedFileName);

    await this.repo.createAuditLog(
      userId,
      DocumentAuditAction.DOCUMENT_DOWNLOADED,
      doc.id,
      undefined,
      auditMeta?.ipAddress,
      auditMeta?.userAgent,
    );

    return {
      filePath: file.filePath,
      originalFileName: doc.originalFileName,
      mimeType: doc.mimeType,
      fileSize: file.fileSize,
    };
  }

  /**
   * Generate short-lived signed download token
   */
  async generateSignedDownloadUrl(
    userId: string,
    documentId: string,
  ): Promise<{ token: string; expiresInSeconds: number; downloadPath: string }> {
    const doc = await this.repo.findDocumentById(documentId);
    if (!doc || doc.deletedAt) {
      throw new NotFoundError('Document not found.');
    }

    if (doc.userId !== userId) {
      throw new AuthorizationError('You do not have permission to access this document.');
    }

    const token = this.storage.generateDownloadToken(userId, documentId, doc.storageKey);

    return {
      token,
      expiresInSeconds: env.DOCUMENT_SIGNED_URL_EXPIRES_SECONDS,
      downloadPath: `/api/v1/documents/${documentId}/download?token=${token}`,
    };
  }

  /**
   * Download using short-lived signed token
   */
  async downloadBySignedToken(
    token: string,
  ): Promise<{ filePath: string; originalFileName: string; mimeType: string; fileSize: number }> {
    const payload = this.storage.verifyDownloadToken(token);
    return this.getDocumentForDownload(payload.userId, payload.documentId);
  }

  /**
   * Soft-delete user document
   */
  async deleteDocument(
    userId: string,
    documentId: string,
    auditMeta?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const doc = await this.repo.findDocumentById(documentId);
    if (!doc || doc.deletedAt) {
      throw new NotFoundError('Document not found.');
    }

    if (doc.userId !== userId) {
      throw new AuthorizationError('You do not have permission to delete this document.');
    }

    await this.repo.softDeleteDocument(documentId, userId);

    await this.repo.createAuditLog(
      userId,
      DocumentAuditAction.DOCUMENT_DELETED,
      documentId,
      undefined,
      auditMeta?.ipAddress,
      auditMeta?.userAgent,
    );
  }

  /**
   * Trigger OCR processing on document with user consent
   */
  async requestOcr(
    userId: string,
    documentId: string,
    ocrConsent: boolean,
    auditMeta?: { ipAddress?: string; userAgent?: string },
  ): Promise<DocumentExtractionDto> {
    if (!ocrConsent) {
      throw new ValidationError(
        'Explicit user consent is mandatory before optical character recognition (OCR) can process documents.',
      );
    }

    const doc = await this.repo.findDocumentById(documentId);
    if (!doc || doc.deletedAt) {
      throw new NotFoundError('Document not found.');
    }

    if (doc.userId !== userId) {
      throw new AuthorizationError('You do not have permission to process this document.');
    }

    const typeDef = getDocumentTypeDefinition(doc.documentType);
    if (!typeDef.supportsOCR) {
      throw new ValidationError(
        `OCR extraction is not supported for document type "${doc.documentType}".`,
      );
    }

    // OCR Cost Control: Check if existing valid extraction already exists for this exact checksum and OCR version
    const existingExtraction = await this.repo.findLatestExtractionForDocument(documentId);
    if (existingExtraction && doc.ocrStatus === OcrStatus.COMPLETED) {
      logger.info({ documentId }, 'Reusing existing extraction under OCR cost-control policy');
      return this.mapExtractionToDto(existingExtraction);
    }

    // Update OCR consent on document
    await this.repo.updateDocument(documentId, {
      ocrConsent: true,
      ocrConsentedAt: new Date(),
      ocrStatus: OcrStatus.PROCESSING,
    });

    await this.repo.createAuditLog(
      userId,
      DocumentAuditAction.OCR_REQUESTED,
      documentId,
      undefined,
      auditMeta?.ipAddress,
      auditMeta?.userAgent,
    );

    // Read file bytes from storage
    const file = await this.storage.getFile(doc.storageKey, doc.storedFileName);
    const fileBuffer = await fs.promises.readFile(file.filePath);

    return this.executeOcr(userId, documentId, fileBuffer, doc.originalFileName);
  }

  private async executeOcr(
    userId: string,
    documentId: string,
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<DocumentExtractionDto> {
    const doc = await this.repo.findDocumentById(documentId);
    if (!doc) throw new NotFoundError('Document not found');

    try {
      const ocrResult = await this.ocr.extract(doc.documentType, fileBuffer, fileName);

      const extraction = await this.repo.createExtraction({
        document: { connect: { id: documentId } },
        ocrText: ocrResult.ocrText,
        structuredFields: ocrResult.structuredFields as unknown as Prisma.InputJsonValue,
        confidence: ocrResult.confidence,
        provider: ocrResult.provider,
        providerVersion: ocrResult.providerVersion,
        status: 'PENDING_REVIEW',
      });

      const ocrStatus = ocrResult.isLowConfidence ? OcrStatus.LOW_CONFIDENCE : OcrStatus.COMPLETED;
      const documentStatus = ocrResult.isLowConfidence
        ? DocumentStatus.NEEDS_REVIEW
        : DocumentStatus.READY;

      await this.repo.updateDocument(documentId, {
        ocrStatus,
        documentStatus,
        ocrVersion: ocrResult.providerVersion,
      });

      await this.repo.createAuditLog(userId, DocumentAuditAction.OCR_COMPLETED, documentId, {
        confidence: ocrResult.confidence,
        isLowConfidence: ocrResult.isLowConfidence,
      });

      // Module 7 notification hook
      notificationEventService
        .publishDocumentEvent({
          userId,
          documentId,
          documentType: doc.documentType,
          originalFileName: doc.originalFileName,
          type: ocrResult.isLowConfidence
            ? 'DOCUMENT_REVIEW_REQUIRED'
            : 'DOCUMENT_PROCESSING_COMPLETED',
        })
        .catch((notifyErr) => {
          logger.warn({ notifyErr }, 'Failed to dispatch document notification event');
        });

      return this.mapExtractionToDto(extraction);
    } catch (err) {
      await this.repo.updateDocument(documentId, {
        ocrStatus: OcrStatus.FAILED,
        documentStatus: DocumentStatus.NEEDS_REVIEW,
      });

      await this.repo.createAuditLog(userId, DocumentAuditAction.OCR_FAILED, documentId);

      // Module 7 notification hook
      notificationEventService
        .publishDocumentEvent({
          userId,
          documentId,
          documentType: doc.documentType,
          originalFileName: doc.originalFileName,
          type: 'DOCUMENT_PROCESSING_FAILED',
        })
        .catch((notifyErr) => {
          logger.warn({ notifyErr }, 'Failed to dispatch document failure notification event');
        });

      throw err;
    }
  }

  /**
   * Get latest OCR extraction for a document
   */
  async getDocumentExtraction(userId: string, documentId: string): Promise<DocumentExtractionDto> {
    const doc = await this.repo.findDocumentById(documentId);
    if (!doc || doc.deletedAt) {
      throw new NotFoundError('Document not found.');
    }

    if (doc.userId !== userId) {
      throw new AuthorizationError('You do not have permission to access this extraction.');
    }

    const extraction = await this.repo.findLatestExtractionForDocument(documentId);
    if (!extraction) {
      throw new NotFoundError('No OCR extraction found for this document.');
    }

    return this.mapExtractionToDto(extraction);
  }

  /**
   * Confirm or correct extracted OCR fields, and optionally apply to verified User Profile (Module 2)
   * with explicit user approval, triggering recommendation refresh (Module 4).
   */
  async confirmExtraction(
    userId: string,
    documentId: string,
    input: ConfirmExtractionInput,
    auditMeta?: { ipAddress?: string; userAgent?: string },
  ): Promise<DocumentExtractionDto> {
    const doc = await this.repo.findDocumentById(documentId);
    if (!doc || doc.deletedAt) {
      throw new NotFoundError('Document not found.');
    }

    if (doc.userId !== userId) {
      throw new AuthorizationError('You do not have permission to confirm this extraction.');
    }

    const extraction = await this.repo.findLatestExtractionForDocument(documentId);
    if (!extraction) {
      throw new NotFoundError('No OCR extraction found to confirm.');
    }

    const { confirmedFields, applyToProfile, userConsentToUpdateProfile } = input;

    // Update extraction status and confirmed values
    const updatedExtraction = await this.repo.updateExtraction(extraction.id, {
      status: 'CONFIRMED',
      confirmedValues: confirmedFields as unknown as Prisma.InputJsonValue,
      confirmedAt: new Date(),
      confirmedBy: userId,
    });

    await this.repo.updateDocument(documentId, {
      verificationStatus: DocumentVerificationStatus.VERIFIED_FOR_USE,
      documentStatus: DocumentStatus.READY,
    });

    await this.repo.createAuditLog(
      userId,
      DocumentAuditAction.EXTRACTION_CONFIRMED,
      documentId,
      { fieldCount: Object.keys(confirmedFields).length },
      auditMeta?.ipAddress,
      auditMeta?.userAgent,
    );

    // Apply to Module 2 user profile ONLY IF user gave explicit consent
    if (applyToProfile && userConsentToUpdateProfile) {
      try {
        await this.applyConfirmedFieldsToProfile(userId, doc.documentType, confirmedFields);

        await this.repo.updateExtraction(extraction.id, {
          appliedToProfile: true,
          appliedToProfileAt: new Date(),
        });

        await this.repo.createAuditLog(
          userId,
          DocumentAuditAction.PROFILE_UPDATE_FROM_DOCUMENT_CONFIRMED,
          documentId,
        );

        // Deterministically refresh Module 4 recommendations
        await this.recommendations.refreshUserRecommendations(userId);
      } catch (err) {
        logger.warn(
          { err, userId, documentId },
          'Failed to apply confirmed fields to user profile',
        );
      }
    }

    const reloaded = await this.repo.findExtractionById(extraction.id);
    return this.mapExtractionToDto(reloaded || updatedExtraction);
  }

  private async applyConfirmedFieldsToProfile(
    userId: string,
    documentType: string,
    confirmedFields: Record<string, unknown>,
  ): Promise<void> {
    const typeDef = getDocumentTypeDefinition(documentType);
    if (!typeDef.profileMapping) return;

    if (documentType === 'INCOME_CERTIFICATE' && confirmedFields['annualIncome']) {
      const income = Number(confirmedFields['annualIncome']);
      if (!isNaN(income) && income > 0) {
        await this.profile.updateFinancial(userId, { annualFamilyIncome: income });
      }
    }

    if (documentType === 'COMMUNITY_CERTIFICATE' && confirmedFields['category']) {
      const cat = String(confirmedFields['category']).toUpperCase();
      const validCats: SocialCategory[] = ['GENERAL', 'OBC', 'SC', 'ST', 'EWS'];
      if (validCats.includes(cat as SocialCategory)) {
        await this.profile.updateSocial(userId, { category: cat as SocialCategory });
      }
    }

    if (documentType === 'MARKSHEET' && confirmedFields['percentage']) {
      const pct = Number(confirmedFields['percentage']);
      if (!isNaN(pct) && pct > 0 && pct <= 100) {
        await this.profile.updateEducation(userId, { academicPercentage: pct });
      }
    }

    if (documentType === 'DISABILITY_CERTIFICATE') {
      const hasDisability = true;
      const disabilityPercentage = confirmedFields['disabilityPercentage']
        ? Number(confirmedFields['disabilityPercentage'])
        : undefined;
      const disabilityType = confirmedFields['disabilityType']
        ? String(confirmedFields['disabilityType'])
        : undefined;

      await this.profile.updateSocial(userId, {
        disabilityStatus: hasDisability,
        disabilityPercentage,
        disabilityType,
      });
    }

    if (documentType === 'AADHAAR' || documentType === 'PAN') {
      const updates: { fullName?: string; dateOfBirth?: Date; gender?: Gender } = {};
      if (confirmedFields['name']) updates.fullName = String(confirmedFields['name']);
      if (confirmedFields['dateOfBirth']) {
        const parsed = new Date(String(confirmedFields['dateOfBirth']));
        if (!isNaN(parsed.getTime())) updates.dateOfBirth = parsed;
      }
      if (confirmedFields['gender']) {
        const gen = String(confirmedFields['gender']).toUpperCase();
        const validGenders: Gender[] = [
          'MALE',
          'FEMALE',
          'TRANSGENDER',
          'OTHER',
          'PREFER_NOT_TO_SAY',
        ];
        if (validGenders.includes(gen as Gender)) {
          updates.gender = gen as Gender;
        }
      }

      if (Object.keys(updates).length > 0) {
        await this.profile.updatePersonal(userId, updates);
      }
    }
  }

  /**
   * Determine scheme-specific document readiness based on Module 3 statutory requirements
   */
  async getSchemeDocumentReadiness(
    userId: string,
    schemeId: string,
  ): Promise<SchemeDocumentReadinessDto> {
    const scheme = await this.repo.findSchemeWithRequirements(schemeId);
    if (!scheme) {
      throw new NotFoundError('Scheme not found.');
    }

    const requirements = scheme.documents || [];
    const requiredTypes = requirements.map((r) => r.documentType);

    const userDocs = await this.repo.findUserDocumentsForTypes(userId, requiredTypes);
    const docMap = new Map<string, UserDocument>();
    for (const d of userDocs) {
      if (!docMap.has(d.documentType)) {
        docMap.set(d.documentType, d);
      }
    }

    let readyCount = 0;
    let missingCount = 0;
    let needsReviewCount = 0;
    let expiredCount = 0;

    const requirementItems: SchemeRequirementReadinessItem[] = requirements.map((req) => {
      const matched = docMap.get(req.documentType);

      if (!matched) {
        if (req.mandatory) {
          missingCount++;
        }
        return {
          requirementId: req.id,
          requirementName: req.name,
          documentType: req.documentType,
          mandatory: req.mandatory,
          description: req.description,
          readinessStatus: 'MISSING',
          matchedDocument: null,
          readinessNote: `Missing ${req.mandatory ? 'mandatory' : 'optional'} document. Upload to proceed with scheme application.`,
        };
      }

      const isExpired = matched.expiresAt ? new Date(matched.expiresAt) < new Date() : false;

      if (isExpired) {
        expiredCount++;
        return {
          requirementId: req.id,
          requirementName: req.name,
          documentType: req.documentType,
          mandatory: req.mandatory,
          description: req.description,
          readinessStatus: 'EXPIRED',
          matchedDocument: {
            id: matched.id,
            originalFileName: matched.originalFileName,
            documentStatus: DocumentStatus.EXPIRED,
            ocrStatus: matched.ocrStatus,
            expiresAt: matched.expiresAt
              ? (new Date(matched.expiresAt).toISOString().split('T')[0] ?? null)
              : null,
            isExpired: true,
          },
          readinessNote: 'This document has expired. Upload an updated valid version.',
        };
      }

      if (
        matched.documentStatus === DocumentStatus.NEEDS_REVIEW ||
        matched.ocrStatus === OcrStatus.LOW_CONFIDENCE
      ) {
        needsReviewCount++;
        return {
          requirementId: req.id,
          requirementName: req.name,
          documentType: req.documentType,
          mandatory: req.mandatory,
          description: req.description,
          readinessStatus: 'NEEDS_REVIEW',
          matchedDocument: {
            id: matched.id,
            originalFileName: matched.originalFileName,
            documentStatus: matched.documentStatus,
            ocrStatus: matched.ocrStatus,
            expiresAt: matched.expiresAt
              ? (new Date(matched.expiresAt).toISOString().split('T')[0] ?? null)
              : null,
            isExpired: false,
          },
          readinessNote: 'Document information extracted requires your review and confirmation.',
        };
      }

      readyCount++;
      return {
        requirementId: req.id,
        requirementName: req.name,
        documentType: req.documentType,
        mandatory: req.mandatory,
        description: req.description,
        readinessStatus: 'READY',
        matchedDocument: {
          id: matched.id,
          originalFileName: matched.originalFileName,
          documentStatus: matched.documentStatus,
          ocrStatus: matched.ocrStatus,
          expiresAt: matched.expiresAt
            ? (new Date(matched.expiresAt).toISOString().split('T')[0] ?? null)
            : null,
          isExpired: false,
        },
        readinessNote: 'Ready for use. Certificate details organized.',
      };
    });

    const isFullyPrepared = missingCount === 0 && expiredCount === 0;

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      totalRequirements: requirements.length,
      readyCount,
      missingCount,
      needsReviewCount,
      expiredCount,
      isFullyPrepared,
      requirements: requirementItems,
      evaluatedAt: new Date().toISOString(),
      disclaimer:
        'Documents uploaded here are used to help organize application requirements and extract information. Final document acceptance and legal eligibility decisions are made by the respective scheme authority.',
    };
  }
}

export const documentsService = new DocumentsService();
