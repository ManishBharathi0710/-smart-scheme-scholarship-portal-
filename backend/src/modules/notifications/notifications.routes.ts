import { Router } from 'express';
import { NotificationController } from './notifications.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  notificationQuerySchema,
  notificationIdParamSchema,
  updateNotificationPreferencesSchema,
  runJobsSchema,
} from './notifications.schemas.js';

export const notificationsRouter = Router();
export const notificationPreferencesRouter = Router();

const controller = new NotificationController();

// All notification operations require authenticated citizen session
notificationsRouter.use(authenticate);
notificationPreferencesRouter.use(authenticate);

// Notification retrieval and count
notificationsRouter.get(
  '/',
  validateRequest({ query: notificationQuerySchema }),
  controller.getNotifications,
);
notificationsRouter.get('/unread-count', controller.getUnreadCount);

// Bulk operations
notificationsRouter.patch('/read-all', controller.markAllAsRead);

// Preferences routes (mounted on notifications router as well)
notificationsRouter.get('/preferences', controller.getPreferences);
notificationsRouter.patch(
  '/preferences',
  validateRequest({ body: updateNotificationPreferencesSchema }),
  controller.updatePreferences,
);

// Individual notification operations
notificationsRouter.patch(
  '/:notificationId/read',
  validateRequest({ params: notificationIdParamSchema }),
  controller.markAsRead,
);
notificationsRouter.delete(
  '/:notificationId',
  validateRequest({ params: notificationIdParamSchema }),
  controller.deleteNotification,
);

// Scheduled job trigger (for admin / test workflows)
notificationsRouter.post(
  '/jobs/run',
  validateRequest({ body: runJobsSchema }),
  controller.runScheduledJobs,
);

// Dedicated preferences router mounted at /notification-preferences
notificationPreferencesRouter.get('/', controller.getPreferences);
notificationPreferencesRouter.patch(
  '/',
  validateRequest({ body: updateNotificationPreferencesSchema }),
  controller.updatePreferences,
);
