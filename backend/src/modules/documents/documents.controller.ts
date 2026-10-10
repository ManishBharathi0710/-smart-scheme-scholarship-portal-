import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { documentsService } from './documents.service.js';
import { HttpStatusCodes } from '../../types/api.js';
import { AuthenticationError, ValidationError } from '../../errors/app-error.js';
import { DocumentListQuery, ConfirmExtractionInput } from './documents.types.js';

export class DocumentsController {
  /**
   * Upload a new document (or new version of existing document)
   * POST /api/v1/documents
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      const file = req.file;
      if (!file) {
        throw new ValidationError('No document file was uploaded');
      }

      const doc = await documentsService.uploadDocument(
        {
          userId,
          documentType: req.body.documentType,
          documentCategory: req.body.documentCategory,
          issuedAt: req.body.issuedAt,
          expiresAt: req.body.expiresAt,
          issuingAuthority: req.body.issuingAuthority,
          documentNumberMasked: req.body.documentNumberMasked,
          replaceDocumentId: req.body.replaceDocumentId,
          ocrConsent: req.body.ocrConsent,
        },
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      );

      res.status(HttpStatusCodes.CREATED).json({
        success: true,
        data: doc,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List user's documents with filtering & pagination
   * GET /api/v1/documents
   */
  async getUserDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      const query = req.query as unknown as DocumentListQuery;
      const result = await documentsService.getUserDocuments(userId, query);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result.items,
        meta: {
          pagination: result.pagination,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single document details
   * GET /api/v1/documents/:documentId
   */
  async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      const doc = await documentsService.getDocumentById(userId, req.params.documentId as string);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: doc,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Download user's own document (streamed via authenticated route)
   * GET /api/v1/documents/:documentId/download
   */
  async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      const { filePath, originalFileName, mimeType, fileSize } =
        await documentsService.getDocumentForDownload(userId, req.params.documentId as string, {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

      // Clean filename for content-disposition header to prevent header injection
      const safeFilename = originalFileName.replace(/["'\r\n]/g, '_');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      const stream = fs.createReadStream(filePath);
      stream.on('error', (streamErr) => {
        next(streamErr);
      });
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Generate short-lived signed download token & URL
   * POST /api/v1/documents/:documentId/signed-download
   */
  async generateSignedDownloadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      const signed = await documentsService.generateSignedDownloadUrl(
        userId,
        req.params.documentId as string,
      );

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: signed,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Download document using signed token (publicly accessible with valid short-lived token)
   * GET /api/v1/documents/download/signed?token=...
   */
  async downloadBySignedToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      if (!token) {
        throw new ValidationError('Signed token is required');
      }

      const { filePath, originalFileName, mimeType, fileSize } =
        await documentsService.downloadBySignedToken(token);

      const safeFilename = originalFileName.replace(/["'\r\n]/g, '_');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      const stream = fs.createReadStream(filePath);
      stream.on('error', (streamErr) => {
        next(streamErr);
      });
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Soft-delete a document
   * DELETE /api/v1/documents/:documentId
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      await documentsService.deleteDocument(userId, req.params.documentId as string);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: { message: 'Document removed successfully' },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request OCR extraction for a document with explicit user consent
   * POST /api/v1/documents/:documentId/ocr
   */
  async requestOcr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      const { ocrConsent } = req.body;

      const extraction = await documentsService.requestOcr(
        userId,
        req.params.documentId as string,
        ocrConsent,
      );

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: extraction,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get OCR extraction details for a document
   * GET /api/v1/documents/:documentId/ocr
   */
  async getDocumentExtraction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      const extraction = await documentsService.getDocumentExtraction(
        userId,
        req.params.documentId as string,
      );

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: extraction,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Confirm or edit extracted fields, and optionally apply to profile
   * POST /api/v1/documents/:documentId/confirm-extraction
   */
  async confirmExtraction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      const input: ConfirmExtractionInput = req.body;

      const result = await documentsService.confirmExtraction(
        userId,
        req.params.documentId as string,
        input,
      );

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get document readiness checklist for a scheme
   * GET /api/v1/schemes/:schemeId/document-readiness
   */
  async getSchemeDocumentReadiness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }

      const readiness = await documentsService.getSchemeDocumentReadiness(
        userId,
        req.params.schemeId as string,
      );

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: readiness,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const documentsController = new DocumentsController();
