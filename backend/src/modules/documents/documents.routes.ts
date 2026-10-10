import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentsController } from './documents.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { env } from '../../config/env.js';
import { isSupportedMimeType } from './documents.catalog.js';
import { ValidationError } from '../../errors/app-error.js';
import {
  documentListQuerySchema,
  documentUploadBodySchema,
  requestOcrSchema,
  confirmExtractionSchema,
  documentIdParamSchema,
} from './documents.schemas.js';

export const documentsRouter = Router();

// Configure multer memory storage with strict file size and type filters
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.DOCUMENT_MAX_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!isSupportedMimeType(file.mimetype)) {
      return cb(
        new ValidationError(
          `Unsupported file MIME type '${file.mimetype}'. Only PDF, JPEG, and PNG documents are supported.`,
        ),
      );
    }
    cb(null, true);
  },
});

// Middleware wrapper to catch Multer errors gracefully
const handleUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ValidationError(
              `The uploaded file exceeds the maximum allowed size of ${env.DOCUMENT_MAX_SIZE_MB}MB.`,
            ),
          );
        }
        return next(new ValidationError(`File upload failed: ${err.message}`));
      }
      return next(err as Error);
    }
    next();
  });
};

/**
 * Public endpoint: Download document using short-lived signed token
 * GET /api/v1/documents/download/signed?token=...
 */
documentsRouter.get('/download/signed', documentsController.downloadBySignedToken);

/**
 * All remaining endpoints require citizen authentication
 */
documentsRouter.use(authenticate);

/**
 * Upload a document
 * POST /api/v1/documents
 */
documentsRouter.post(
  '/',
  handleUpload,
  validateRequest({ body: documentUploadBodySchema }),
  documentsController.uploadDocument,
);

/**
 * List user's documents
 * GET /api/v1/documents
 */
documentsRouter.get(
  '/',
  validateRequest({ query: documentListQuerySchema }),
  documentsController.getUserDocuments,
);

/**
 * Get single document metadata
 * GET /api/v1/documents/:documentId
 */
documentsRouter.get(
  '/:documentId',
  validateRequest({ params: documentIdParamSchema }),
  documentsController.getDocumentById,
);

/**
 * Download document directly with bearer auth
 * GET /api/v1/documents/:documentId/download
 */
documentsRouter.get(
  '/:documentId/download',
  validateRequest({ params: documentIdParamSchema }),
  documentsController.downloadDocument,
);

/**
 * Generate a short-lived signed URL for secure download
 * POST /api/v1/documents/:documentId/signed-download
 */
documentsRouter.post(
  '/:documentId/signed-download',
  validateRequest({ params: documentIdParamSchema }),
  documentsController.generateSignedDownloadUrl,
);

/**
 * Delete / soft-delete a document
 * DELETE /api/v1/documents/:documentId
 */
documentsRouter.delete(
  '/:documentId',
  validateRequest({ params: documentIdParamSchema }),
  documentsController.deleteDocument,
);

/**
 * Request OCR processing for a document
 * POST /api/v1/documents/:documentId/ocr
 */
documentsRouter.post(
  '/:documentId/ocr',
  validateRequest({ params: documentIdParamSchema, body: requestOcrSchema }),
  documentsController.requestOcr,
);

/**
 * Get OCR extraction result for a document
 * GET /api/v1/documents/:documentId/ocr
 */
documentsRouter.get(
  '/:documentId/ocr',
  validateRequest({ params: documentIdParamSchema }),
  documentsController.getDocumentExtraction,
);

/**
 * Confirm/correct extracted fields and optionally sync to profile
 * POST /api/v1/documents/:documentId/confirm-extraction
 */
documentsRouter.post(
  '/:documentId/confirm-extraction',
  validateRequest({ params: documentIdParamSchema, body: confirmExtractionSchema }),
  documentsController.confirmExtraction,
);
