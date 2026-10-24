import { Router } from 'express';
import { recommendationsController } from './recommendations.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  recommendationQuerySchema,
  recommendationParamsSchema,
} from './recommendations.schemas.js';

export const recommendationsRouter = Router();

// All recommendation operations strictly require authenticated citizen credentials
recommendationsRouter.use(authenticate);

/**
 * GET /api/v1/recommendations
 * List citizen recommendations with deterministic sorting and filtering
 */
recommendationsRouter.get(
  '/',
  validateRequest({ query: recommendationQuerySchema }),
  recommendationsController.getUserRecommendations,
);

/**
 * POST /api/v1/recommendations/refresh
 * Explicit re-evaluation of citizen profile against latest published scheme rules
 */
recommendationsRouter.post('/refresh', recommendationsController.refreshUserRecommendations);

/**
 * GET /api/v1/recommendations/summary/counts
 * Status counts for dashboard overview
 */
recommendationsRouter.get('/summary/counts', recommendationsController.getSummaryCounts);
recommendationsRouter.get('/counts', recommendationsController.getSummaryCounts);

/**
 * GET /api/v1/recommendations/:id
 * Detailed recommendation explainability breakdown
 */
recommendationsRouter.get(
  '/:id',
  validateRequest({ params: recommendationParamsSchema }),
  recommendationsController.getRecommendationDetail,
);
