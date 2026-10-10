import { schemesService } from '../../schemes/schemes.service.js';
import { logger } from '../../../utils/logger.js';

export interface SchemeFactContext {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description: string;
  programType: string;
  categories: string[];
  department: string;
  benefits: Array<{
    benefitType: string;
    amount?: number | null;
    frequency?: string | null;
    description?: string | null;
  }>;
  requiredDocuments: Array<{
    name: string;
    mandatory: boolean;
    issuingAuthority?: string | null;
  }>;
  eligibilityRules: Array<{
    field: string;
    operator: string;
    description?: string | null;
    mandatory: boolean;
  }>;
  activePeriod?: {
    status: string;
    openDate?: string | null;
    closeDate?: string | null;
  } | null;
  officialSourceUrl?: string | null;
  officialApplicationUrl?: string | null;
  applicationMethod?: string | null;
}

export class SchemeTool {
  /**
   * Retrieves verified scheme facts using Module 3 service.
   * Scoped to published, verified schemes only.
   */
  public async getSchemeDetails(
    slugOrId: string,
    userId?: string,
  ): Promise<SchemeFactContext | null> {
    try {
      const detail = await schemesService.getPublishedSchemeDetail(slugOrId, userId);
      if (!detail) {
        return null;
      }

      const activePeriod =
        detail.applicationPeriods.find((p) => p.status === 'OPEN') ||
        detail.applicationPeriods[0] ||
        null;

      return {
        id: detail.id,
        slug: detail.slug,
        name: detail.name,
        shortDescription: detail.shortDescription || undefined,
        description: detail.description,
        programType: detail.programType,
        categories: detail.categories,
        department: detail.department?.name || 'Department of Welfare',
        benefits: detail.benefits.map((b) => ({
          benefitType: b.benefitType,
          amount: b.amount,
          frequency: b.frequency,
          description: b.description,
        })),
        requiredDocuments: detail.documents.map((d) => ({
          name: d.name,
          mandatory: d.mandatory,
          issuingAuthority: d.issuingAuthority,
        })),
        eligibilityRules: detail.eligibilityRequirements.map((r) => ({
          field: r.field,
          operator: r.operator,
          description: r.description,
          mandatory: r.mandatory,
        })),
        activePeriod: activePeriod
          ? {
              status: activePeriod.status,
              openDate: activePeriod.applicationOpenDate
                ? new Date(activePeriod.applicationOpenDate).toISOString().split('T')[0]
                : null,
              closeDate: activePeriod.applicationCloseDate
                ? new Date(activePeriod.applicationCloseDate).toISOString().split('T')[0]
                : null,
            }
          : null,
        officialSourceUrl: detail.officialSourceUrl,
        officialApplicationUrl: detail.officialApplicationUrl,
        applicationMethod: detail.applicationMethod,
      };
    } catch (error) {
      logger.warn({
        slugOrId,
        error: error instanceof Error ? error.message : String(error),
        msg: 'SchemeTool failed to retrieve scheme context',
      });
      return null;
    }
  }

  /**
   * Factual side-by-side comparison of multiple schemes via Module 3
   */
  public async compareSchemes(schemeIds: string[], userId?: string) {
    try {
      return await schemesService.compareSchemes(schemeIds, userId);
    } catch (error) {
      logger.warn({
        schemeIds,
        error: error instanceof Error ? error.message : String(error),
        msg: 'SchemeTool failed to compare schemes',
      });
      return null;
    }
  }
}

export const schemeTool = new SchemeTool();
