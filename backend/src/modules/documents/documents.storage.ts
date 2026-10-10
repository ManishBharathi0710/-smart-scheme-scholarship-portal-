import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ValidationError, NotFoundError } from '../../errors/app-error.js';

export interface StorageSaveResult {
  storageKey: string;
  storedFileName: string;
  fileSize: number;
  checksum: string;
  storageProvider: string;
}

export interface StorageGetResult {
  filePath: string;
  fileSize: number;
}

export interface DownloadTokenPayload {
  userId: string;
  documentId: string;
  storageKey: string;
  purpose: 'DOCUMENT_DOWNLOAD';
}

export class DocumentStorageService {
  private readonly storageRoot: string;
  private readonly providerName: string = 'LOCAL';

  constructor(storageRootPath?: string) {
    this.storageRoot = path.resolve(
      process.cwd(),
      storageRootPath || env.DOCUMENT_STORAGE_PATH || 'uploads/documents',
    );
    this.ensureStorageDirectory();
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storageRoot)) {
      fs.mkdirSync(this.storageRoot, { recursive: true });
      logger.info({ path: this.storageRoot }, 'Initialized local document storage directory');
    }
  }

  /**
   * Validate magic bytes against claimed MIME type to defeat extension/MIME spoofing.
   */
  public validateFileSignature(buffer: Buffer, mimeType: string): boolean {
    if (buffer.length < 4) return false;

    // PDF: %PDF (25 50 44 46)
    if (mimeType === 'application/pdf') {
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    }

    // JPEG: FF D8 FF
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    // PNG: 89 50 4E 47 (89 'P' 'N' 'G')
    if (mimeType === 'image/png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }

    return false;
  }

  /**
   * Compute SHA-256 checksum
   */
  public computeChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Save buffer to private storage using non-user-controlled generated storage keys.
   */
  public async saveFile(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<StorageSaveResult> {
    // 1. Validate magic bytes
    if (!this.validateFileSignature(buffer, mimeType)) {
      throw new ValidationError(
        'File content signature does not match claimed MIME type or file is corrupt.',
      );
    }

    // 2. Compute checksum & file size
    const checksum = this.computeChecksum(buffer);
    const fileSize = buffer.length;

    // 3. Extract sanitized extension
    const ext =
      path
        .extname(originalFileName)
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, '') || '.bin';
    const safeExt = ['.pdf', '.jpeg', '.jpg', '.png'].includes(ext) ? ext : '.pdf';

    // 4. Generate unique storage key and filename
    const storageKey = `doc_${uuidv4()}`;
    const storedFileName = `${storageKey}${safeExt}`;
    const fullPath = path.join(this.storageRoot, storedFileName);

    // 5. Write to disk
    await fs.promises.writeFile(fullPath, buffer);

    logger.info(
      { storageKey, fileSize, checksum: checksum.slice(0, 10) },
      'Document saved to private storage',
    );

    return {
      storageKey,
      storedFileName,
      fileSize,
      checksum,
      storageProvider: this.providerName,
    };
  }

  /**
   * Retrieve file path from storageKey
   */
  public async getFile(_storageKey: string, storedFileName: string): Promise<StorageGetResult> {
    // Sanitize storageKey to prevent path traversal
    const safeKey = path.basename(storedFileName);
    const fullPath = path.join(this.storageRoot, safeKey);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundError('Stored document file not found on storage provider.');
    }

    const stat = await fs.promises.stat(fullPath);
    return {
      filePath: fullPath,
      fileSize: stat.size,
    };
  }

  /**
   * Delete file from private storage
   */
  public async deleteFile(storedFileName: string): Promise<void> {
    try {
      const safeKey = path.basename(storedFileName);
      const fullPath = path.join(this.storageRoot, safeKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info({ storedFileName }, 'Document deleted from private storage');
      }
    } catch (err) {
      logger.warn({ err, storedFileName }, 'Failed to delete file from storage');
    }
  }

  /**
   * Generate short-lived signed download token (e.g. valid for 5 minutes)
   */
  public generateDownloadToken(userId: string, documentId: string, storageKey: string): string {
    const payload: DownloadTokenPayload = {
      userId,
      documentId,
      storageKey,
      purpose: 'DOCUMENT_DOWNLOAD',
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.DOCUMENT_SIGNED_URL_EXPIRES_SECONDS,
    });
  }

  /**
   * Verify signed download token
   */
  public verifyDownloadToken(token: string): DownloadTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as DownloadTokenPayload;
      if (decoded.purpose !== 'DOCUMENT_DOWNLOAD') {
        throw new ValidationError('Invalid download token purpose');
      }
      return decoded;
    } catch {
      throw new ValidationError('Download token is invalid or has expired.');
    }
  }
}

export const documentStorageService = new DocumentStorageService();
