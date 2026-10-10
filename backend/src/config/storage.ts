import { env } from './env.js';

export const storageConfig = {
  maxFileSizeMb: env.DOCUMENT_MAX_SIZE_MB,
  maxFileSizeBytes: env.DOCUMENT_MAX_SIZE_MB * 1024 * 1024,
  basePath: env.DOCUMENT_STORAGE_PATH,
  signedUrlExpiresSeconds: env.DOCUMENT_SIGNED_URL_EXPIRES_SECONDS,
  ocrConfidenceThreshold: env.OCR_CONFIDENCE_THRESHOLD,
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  temporaryRetentionDays: 7,
};
