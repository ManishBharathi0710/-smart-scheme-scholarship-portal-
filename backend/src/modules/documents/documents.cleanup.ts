import fs from 'fs';
import path from 'path';
import { prisma } from '../../database/prisma.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export interface CleanupResult {
  totalFilesScanned: number;
  orphanedFilesFound: number;
  filesDeleted: number;
  bytesFreed: number;
  errors: string[];
}

export class DocumentStorageCleanupService {
  private readonly storageRoot: string;

  constructor(storageRootPath?: string) {
    this.storageRoot = path.resolve(
      process.cwd(),
      storageRootPath || env.DOCUMENT_STORAGE_PATH || 'uploads/documents',
    );
  }

  /**
   * Safely clean up orphaned files older than ageThresholdHours.
   * Only deletes files physically present in storage that do NOT correspond to any active UserDocument record.
   */
  public async cleanupOrphanedStorage(ageThresholdHours = 24): Promise<CleanupResult> {
    const result: CleanupResult = {
      totalFilesScanned: 0,
      orphanedFilesFound: 0,
      filesDeleted: 0,
      bytesFreed: 0,
      errors: [],
    };

    if (!fs.existsSync(this.storageRoot)) {
      return result;
    }

    try {
      const activeDocuments = await prisma.userDocument.findMany({
        select: { storageKey: true },
      });
      const activeStorageKeys = new Set(activeDocuments.map((d) => d.storageKey));

      const files = fs.readdirSync(this.storageRoot);
      const now = Date.now();
      const maxAgeMs = ageThresholdHours * 3600 * 1000;

      for (const fileName of files) {
        // Skip hidden files or system files (.gitkeep, .DS_Store)
        if (fileName.startsWith('.')) continue;

        result.totalFilesScanned++;
        const filePath = path.join(this.storageRoot, fileName);

        try {
          const stats = fs.statSync(filePath);
          if (!stats.isFile()) continue;

          // Check if file is orphaned
          if (!activeStorageKeys.has(fileName)) {
            const ageMs = now - stats.mtimeMs;
            // Only clean files older than age threshold to prevent race conditions during upload
            if (ageMs > maxAgeMs) {
              result.orphanedFilesFound++;
              fs.unlinkSync(filePath);
              result.filesDeleted++;
              result.bytesFreed += stats.size;
              logger.info({ fileName, size: stats.size }, 'Deleted orphaned storage file');
            }
          }
        } catch (fileErr) {
          const errStr = `Error inspecting ${fileName}: ${fileErr instanceof Error ? fileErr.message : String(fileErr)}`;
          result.errors.push(errStr);
          logger.warn({ error: errStr }, 'Storage cleanup error for individual file');
        }
      }

      logger.info(
        {
          scanned: result.totalFilesScanned,
          orphaned: result.orphanedFilesFound,
          deleted: result.filesDeleted,
          bytesFreed: result.bytesFreed,
        },
        'Document storage cleanup completed',
      );
    } catch (err) {
      logger.error({ err }, 'Failed to execute document storage cleanup job');
      result.errors.push(err instanceof Error ? err.message : String(err));
    }

    return result;
  }
}

export const documentStorageCleanupService = new DocumentStorageCleanupService();
