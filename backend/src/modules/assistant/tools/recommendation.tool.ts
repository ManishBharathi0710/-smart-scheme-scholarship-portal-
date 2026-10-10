import { recommendationService } from '../../recommendations/recommendations.service.js';
import { recommendationsRepository } from '../../recommendations/recommendations.repository.js';
import { logger } from '../../../utils/logger.js';

export interface RecommendationFactContext {
  id: string;
  schemeId: string;
  schemeName: string;
  eligibilityStatus: string;
  matchingRequirements: string[];
  missingRequirements: string[];
  uncertainRequirements: string[];
  missingInformation?: Array<{ field: string; message: string }>;
  evaluatedAt: Date | string;
}

export class RecommendationTool {
  /**
   * Retrieves deterministic recommendation breakdown from Module 4.
   * Strictly read-only: NEVER calculates, modifies, or overrides eligibility.
   * Enforces caller-scoped user isolation.
   */
  public async getRecommendation(
    userId: string,
    recommendationIdOrSchemeId: string,
  ): Promise<RecommendationFactContext | null> {
    try {
      // First attempt lookup as recommendation ID
      try {
        const detail = await recommendationService.getRecommendationDetail(
          recommendationIdOrSchemeId,
          userId,
        );
        if (detail) {
          return {
            id: detail.id,
            schemeId: detail.schemeId,
            schemeName: detail.schemeName,
            eligibilityStatus: detail.eligibilityStatus,
            matchingRequirements: detail.evaluationDetails.matchedConditions.map(
              (c) => c.description || c.field,
            ),
            missingRequirements: detail.evaluationDetails.failedConditions.map(
              (c) => c.description || c.field,
            ),
            uncertainRequirements: detail.evaluationDetails.unknownConditions.map(
              (c) => c.description || c.field,
            ),
            missingInformation: detail.evaluationDetails.missingInformation.map((m) => ({
              field: m.field,
              message: m.description || m.field,
            })),
            evaluatedAt: detail.evaluatedAt,
          };
        }
      } catch {
        // Fall back to schemeId lookup
      }

      // Lookup by scheme ID for this specific authenticated user
      const userRec = await recommendationsRepository.findLatestUserRecommendationForScheme(
        userId,
        recommendationIdOrSchemeId,
      );

      if (!userRec) {
        return null;
      }

      const evalDetails = (userRec.evaluationDetails as Record<string, unknown>) || {};
      const matched = Array.isArray(evalDetails['matchedConditions'])
        ? (evalDetails['matchedConditions'] as Array<{ description?: string; field?: string }>).map(
            (c) => c.description || c.field || '',
          )
        : Array.isArray(evalDetails['matchingRequirements'])
          ? (evalDetails['matchingRequirements'] as string[])
          : [];

      const failed = Array.isArray(evalDetails['failedConditions'])
        ? (evalDetails['failedConditions'] as Array<{ description?: string; field?: string }>).map(
            (c) => c.description || c.field || '',
          )
        : Array.isArray(evalDetails['missingRequirements'])
          ? (evalDetails['missingRequirements'] as string[])
          : [];

      const unknown = Array.isArray(evalDetails['unknownConditions'])
        ? (evalDetails['unknownConditions'] as Array<{ description?: string; field?: string }>).map(
            (c) => c.description || c.field || '',
          )
        : Array.isArray(evalDetails['uncertainRequirements'])
          ? (evalDetails['uncertainRequirements'] as string[])
          : [];

      return {
        id: userRec.id,
        schemeId: userRec.schemeId,
        schemeName: `Scheme ${userRec.schemeId}`,
        eligibilityStatus: userRec.eligibilityStatus,
        matchingRequirements: matched.filter(Boolean),
        missingRequirements: failed.filter(Boolean),
        uncertainRequirements: unknown.filter(Boolean),
        evaluatedAt: userRec.evaluatedAt,
      };
    } catch (error) {
      logger.warn({
        userId,
        recommendationIdOrSchemeId,
        error: error instanceof Error ? error.message : String(error),
        msg: 'RecommendationTool failed to retrieve recommendation context',
      });
      return null;
    }
  }

  /**
   * Retrieves summary of top user recommendations from Module 4
   */
  public async getUserRecommendationsSummary(userId: string) {
    try {
      const recs = await recommendationService.getUserRecommendations(userId, {
        page: 1,
        pageSize: 5,
      });
      return recs.items.map((item) => ({
        id: item.id,
        schemeId: item.schemeId,
        schemeName: item.schemeName,
        eligibilityStatus: item.eligibilityStatus,
        programType: item.programType,
      }));
    } catch (error) {
      logger.warn({
        userId,
        error: error instanceof Error ? error.message : String(error),
        msg: 'RecommendationTool failed to retrieve summary',
      });
      return [];
    }
  }
}

export const recommendationTool = new RecommendationTool();
