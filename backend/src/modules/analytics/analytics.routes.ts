import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { auditController } from './audit.controller.js';
import { systemHealthController } from './system-health.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { UserRole } from '@prisma/client';
import {
  analyticsFilterSchema,
  auditQuerySchema,
  auditIdParamSchema,
  exportRequestSchema,
  recordEventSchema,
} from './analytics.schemas.js';

export const analyticsRouter = Router();
export const auditRouter = Router();
export const adminHealthRouter = Router();

// 1. Event recording (accessible by citizen apps to track official portal clicks, searches)
analyticsRouter.post(
  '/events',
  optionalAuthenticate,
  validateRequest({ body: recordEventSchema }),
  analyticsController.recordEvent,
);

// 2. Protected Administrative Analytics Endpoints
const adminRoles = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.SCHEME_MANAGER,
  UserRole.VERIFIER,
];

analyticsRouter.use(authenticate);
analyticsRouter.use(authorizeRole(...adminRoles));

analyticsRouter.get(
  '/overview',
  validateRequest({ query: analyticsFilterSchema }),
  analyticsController.getOverview,
);

analyticsRouter.get(
  '/users',
  validateRequest({ query: analyticsFilterSchema }),
  analyticsController.getUsers,
);

analyticsRouter.get(
  '/schemes',
  validateRequest({ query: analyticsFilterSchema }),
  analyticsController.getSchemes,
);

analyticsRouter.get(
  '/recommendations',
  validateRequest({ query: analyticsFilterSchema }),
  analyticsController.getRecommendations,
);

analyticsRouter.get(
  '/documents',
  validateRequest({ query: analyticsFilterSchema }),
  analyticsController.getDocuments,
);

analyticsRouter.get(
  '/notifications',
  validateRequest({ query: analyticsFilterSchema }),
  analyticsController.getNotifications,
);

analyticsRouter.get(
  '/ai',
  validateRequest({ query: analyticsFilterSchema }),
  analyticsController.getAi,
);

analyticsRouter.get(
  '/search',
  validateRequest({ query: analyticsFilterSchema }),
  analyticsController.getSearch,
);

analyticsRouter.post(
  '/export',
  validateRequest({ body: exportRequestSchema }),
  analyticsController.exportData,
);

// 3. Protected Audit Logs Router (ADMIN, SUPER_ADMIN)
auditRouter.use(authenticate);
auditRouter.use(authorizeRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));

auditRouter.get('/', validateRequest({ query: auditQuerySchema }), auditController.getAuditLogs);

auditRouter.get(
  '/:id',
  validateRequest({ params: auditIdParamSchema }),
  auditController.getAuditLogById,
);

// 4. Protected Detailed System Health Router
adminHealthRouter.use(authenticate);
adminHealthRouter.use(authorizeRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));

adminHealthRouter.get('/', systemHealthController.getDetailedHealth);
