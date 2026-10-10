import { documentsService } from '../../documents/documents.service.js';
import { logger } from '../../../utils/logger.js';

export interface DocumentFactContext {
  readinessStatus: string;
  readinessScore: number;
  missingMandatory: string[];
  missingOptional: string[];
  verifiedCount: number;
  extractedFieldsSummary?: Record<string, unknown>;
}

export class DocumentTool {
  /**
   * Retrieves document readiness for a given scheme and citizen using Module 6 service.
   * Strictly user-scoped and data-minimized.
   */
  public async getSchemeDocumentReadiness(
    userId: string,
    schemeId: string,
  ): Promise<DocumentFactContext | null> {
    try {
      const readiness = await documentsService.getSchemeDocumentReadiness(userId, schemeId);
      if (!readiness) {
        return null;
      }

      const missingMandatory = readiness.requirements
        .filter((r) => r.mandatory && r.readinessStatus === 'MISSING')
        .map((r) => r.requirementName);

      const missingOptional = readiness.requirements
        .filter((r) => !r.mandatory && r.readinessStatus === 'MISSING')
        .map((r) => r.requirementName);

      const readyCount = readiness.readyCount;
      const total = readiness.totalRequirements || 1;
      const score = Math.round((readyCount / total) * 100);

      return {
        readinessStatus: readiness.isFullyPrepared ? 'READY' : 'NEEDS_PREPARATION',
        readinessScore: score,
        missingMandatory,
        missingOptional,
        verifiedCount: readyCount,
      };
    } catch (error) {
      logger.warn({
        userId,
        schemeId,
        error: error instanceof Error ? error.message : String(error),
        msg: 'DocumentTool failed to retrieve document readiness',
      });
      return null;
    }
  }

  /**
   * Retrieves user's uploaded document library summary without exposing raw file paths or sensitive PII.
   */
  public async getUserDocumentsSummary(userId: string) {
    try {
      const result = await documentsService.getUserDocuments(userId, { page: 1, limit: 10 });
      return result.items.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        documentTypeLabel: doc.documentTypeLabel,
        originalFileName: doc.originalFileName,
        documentStatus: doc.documentStatus,
        ocrStatus: doc.ocrStatus,
        verificationStatus: doc.verificationStatus,
      }));
    } catch (error) {
      logger.warn({
        userId,
        error: error instanceof Error ? error.message : String(error),
        msg: 'DocumentTool failed to retrieve user documents summary',
      });
      return [];
    }
  }
}

export const documentTool = new DocumentTool();
