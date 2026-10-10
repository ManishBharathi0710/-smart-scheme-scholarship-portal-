import { Router } from 'express';
import { schemesController } from './schemes.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorize.js';
import { UserRole } from '@prisma/client';
import {
  createSchemeSchema,
  updateSchemeSchema,
  verifySchemeSchema,
  rejectSchemeSchema,
  createDepartmentSchema,
  schemeQuerySchema,
  compareSchemesQuerySchema,
  compareSchemesBodySchema,
} from './schemes.schemas.js';
import { documentsController } from '../documents/documents.controller.js';
import { schemeIdParamSchema } from '../documents/documents.schemas.js';

/**
 * Public Scheme Router (/api/v1/schemes)
 * Open to citizens, students, and unauthenticated public discovery.
 * Strictly returns only published, verified records.
 */
export const publicSchemesRouter = Router();

publicSchemesRouter.get(
  '/',
  optionalAuthenticate,
  validateRequest({ query: schemeQuerySchema }),
  schemesController.getPublishedSchemes,
);

publicSchemesRouter.get('/meta/filters', schemesController.getFilterMetadata);

// Scheme Comparison (side-by-side factual comparison of 1 to 4 schemes)
publicSchemesRouter.get(
  '/compare',
  optionalAuthenticate,
  validateRequest({ query: compareSchemesQuerySchema }),
  schemesController.compareSchemes,
);

publicSchemesRouter.post(
  '/compare',
  optionalAuthenticate,
  validateRequest({ body: compareSchemesBodySchema }),
  schemesController.compareSchemes,
);

// Scheme Document Readiness (check user's uploaded documents against scheme document requirements)
publicSchemesRouter.get(
  '/:schemeId/document-readiness',
  authenticate,
  validateRequest({ params: schemeIdParamSchema }),
  documentsController.getSchemeDocumentReadiness,
);

publicSchemesRouter.get(
  '/:idOrSlug',
  optionalAuthenticate,
  schemesController.getPublishedSchemeDetail,
);

/**
 * Admin Scheme Router (/api/v1/admin/schemes)
 * Enforces authentication and RBAC for Scheme Managers, Verifiers, and Administrators.
 */
export const adminSchemesRouter = Router();

adminSchemesRouter.use(authenticate);

adminSchemesRouter.get(
  '/',
  authorizeRole(UserRole.ADMIN, UserRole.SCHEME_MANAGER, UserRole.VERIFIER, UserRole.SUPER_ADMIN),
  validateRequest({ query: schemeQuerySchema }),
  schemesController.getAllSchemesAdmin,
);

adminSchemesRouter.get(
  '/:id',
  authorizeRole(UserRole.ADMIN, UserRole.SCHEME_MANAGER, UserRole.VERIFIER, UserRole.SUPER_ADMIN),
  schemesController.getSchemeByIdAdmin,
);

adminSchemesRouter.post(
  '/',
  authorizeRole(UserRole.ADMIN, UserRole.SCHEME_MANAGER, UserRole.SUPER_ADMIN),
  validateRequest({ body: createSchemeSchema }),
  schemesController.createScheme,
);

adminSchemesRouter.put(
  '/:id',
  authorizeRole(UserRole.ADMIN, UserRole.SCHEME_MANAGER, UserRole.SUPER_ADMIN),
  validateRequest({ body: updateSchemeSchema }),
  schemesController.updateScheme,
);

adminSchemesRouter.delete(
  '/:id',
  authorizeRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  schemesController.deleteScheme,
);

// Workflow state transition endpoints
adminSchemesRouter.post(
  '/:id/submit-verification',
  authorizeRole(UserRole.ADMIN, UserRole.SCHEME_MANAGER, UserRole.SUPER_ADMIN),
  schemesController.submitForVerification,
);

adminSchemesRouter.post(
  '/:id/verify',
  authorizeRole(UserRole.ADMIN, UserRole.VERIFIER, UserRole.SUPER_ADMIN),
  validateRequest({ body: verifySchemeSchema }),
  schemesController.verifyScheme,
);

adminSchemesRouter.post(
  '/:id/reject',
  authorizeRole(UserRole.ADMIN, UserRole.VERIFIER, UserRole.SUPER_ADMIN),
  validateRequest({ body: rejectSchemeSchema }),
  schemesController.rejectVerification,
);

adminSchemesRouter.post(
  '/:id/publish',
  authorizeRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  schemesController.publishScheme,
);

adminSchemesRouter.post(
  '/:id/unpublish',
  authorizeRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  schemesController.unpublishScheme,
);

adminSchemesRouter.post(
  '/:id/discontinue',
  authorizeRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  schemesController.discontinueScheme,
);

adminSchemesRouter.get(
  '/:id/versions',
  authorizeRole(UserRole.ADMIN, UserRole.SCHEME_MANAGER, UserRole.VERIFIER, UserRole.SUPER_ADMIN),
  schemesController.getSchemeVersions,
);

/**
 * Department Management Router (/api/v1/departments)
 */
export const departmentsRouter = Router();

departmentsRouter.get('/', schemesController.getDepartments);

departmentsRouter.post(
  '/',
  authenticate,
  authorizeRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest({ body: createDepartmentSchema }),
  schemesController.createDepartment,
);
