import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { profileRouter, consentRouter } from '../modules/profile/profile.routes.js';
import {
  publicSchemesRouter,
  adminSchemesRouter,
  departmentsRouter,
} from '../modules/schemes/schemes.routes.js';
import { recommendationsRouter } from '../modules/recommendations/recommendations.routes.js';
import { savedSchemesRouter } from '../modules/saved-schemes/saved-schemes.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';

import { documentsRouter } from '../modules/documents/documents.routes.js';
import {
  notificationsRouter,
  notificationPreferencesRouter,
} from '../modules/notifications/notifications.routes.js';
import { assistantRouter } from '../modules/assistant/assistant.routes.js';
import {
  analyticsRouter,
  auditRouter,
  adminHealthRouter,
} from '../modules/analytics/analytics.routes.js';

export const v1Router = Router();

// Module 1: Foundational Health Check
v1Router.use('/health', healthRouter);

// Module 2: Authentication, Authorization & User Profile
v1Router.use('/auth', authRouter);
v1Router.use('/profile', profileRouter);
v1Router.use('/consents', consentRouter);

// Module 3: Scheme & Scholarship Management
v1Router.use('/schemes', publicSchemesRouter);
v1Router.use('/admin/schemes', adminSchemesRouter);
v1Router.use('/departments', departmentsRouter);

// Module 4: Rule-Based Recommendation Engine
v1Router.use('/recommendations', recommendationsRouter);

// Module 5: Personalized Dashboard, Scheme Discovery, Saved Schemes & Comparison
v1Router.use('/dashboard', dashboardRouter);
v1Router.use('/saved-schemes', savedSchemesRouter);

// Module 6: Document Management, OCR & Document Verification Readiness
v1Router.use('/documents', documentsRouter);

// Module 7: Notifications, Deadline Reminders & User Alerts
v1Router.use('/notifications', notificationsRouter);
v1Router.use('/notification-preferences', notificationPreferencesRouter);

// Module 8: AI Assistant, Multilingual Guidance & Scheme Explanation
v1Router.use('/assistant', assistantRouter);

// Module 9: Analytics, Audit, System Health & Administrative Intelligence
v1Router.use('/admin/analytics', analyticsRouter);
v1Router.use('/admin/audit-logs', auditRouter);
v1Router.use('/admin/system-health', adminHealthRouter);
