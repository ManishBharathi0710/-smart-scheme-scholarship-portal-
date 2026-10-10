import { Request, Response, NextFunction } from 'express';
import { recommendationService } from './recommendations.service.js';
import {
  recommendationQuerySchema,
  recommendationParamsSchema,
} from './recommendations.schemas.js';
import { HttpStatusCodes } from '../../types/api.js';

export class RecommendationsController {
  /**
   * GET /api/v1/recommendations
   * Retrieves deterministic recommendations for the authenticated citizen.
   */
  public async getUserRecommendations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedQuery = recommendationQuerySchema.parse(req.query);
      const userId = req.user!.id;

      const result = await recommendationService.getUserRecommendations(userId, validatedQuery);

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
   * GET /api/v1/recommendations/:id
   * Detailed explainability breakdown for a single recommendation.
   */
  public async getRecommendationDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = recommendationParamsSchema.parse(req.params);
      const userId = req.user!.id;

      const detail = await recommendationService.getRecommendationDetail(id, userId);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: detail,
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
   * POST /api/v1/recommendations/refresh
   * Forces fresh re-evaluation of citizen profile against all published schemes.
   */
  public async refreshUserRecommendations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await recommendationService.refreshUserRecommendations(userId);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
        message: 'Recommendations re-evaluated successfully against latest statutory rules.',
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
   * GET /api/v1/recommendations/summary/counts
   * Quick counts by status for citizen dashboard
   */
  public async getSummaryCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const counts = await recommendationService.getSummaryCounts(userId);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: counts,
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

export const recommendationsController = new RecommendationsController();
