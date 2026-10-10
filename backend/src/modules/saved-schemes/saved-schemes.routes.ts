import { Router } from 'express';
import { savedSchemesController } from './saved-schemes.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { savedSchemeParamsSchema, savedSchemeQuerySchema } from './saved-schemes.schemas.js';

export const savedSchemesRouter = Router();

// All saved scheme routes require citizen authentication
savedSchemesRouter.use(authenticate);

savedSchemesRouter.get(
  '/',
  validateRequest({ query: savedSchemeQuerySchema }),
  savedSchemesController.getSavedSchemes,
);

savedSchemesRouter.get('/ids', savedSchemesController.getSavedSchemeIds);

savedSchemesRouter.get(
  '/:schemeId/status',
  validateRequest({ params: savedSchemeParamsSchema }),
  savedSchemesController.getSchemeSaveStatus,
);

savedSchemesRouter.post(
  '/:schemeId',
  validateRequest({ params: savedSchemeParamsSchema }),
  savedSchemesController.saveScheme,
);

savedSchemesRouter.delete(
  '/:schemeId',
  validateRequest({ params: savedSchemeParamsSchema }),
  savedSchemesController.removeSavedScheme,
);
