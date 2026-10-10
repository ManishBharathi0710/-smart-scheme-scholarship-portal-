import { z } from 'zod';
import { NotificationType, NotificationSeverity, NotificationStatus } from '@prisma/client';

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(NotificationStatus).optional(),
  type: z.nativeEnum(NotificationType).optional(),
  severity: z.nativeEnum(NotificationSeverity).optional(),
});

export const notificationIdParamSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID format'),
});

export const updateNotificationPreferencesSchema = z
  .object({
    deadlineReminders: z.boolean().optional(),
    schemeUpdates: z.boolean().optional(),
    recommendationUpdates: z.boolean().optional(),
    documentAlerts: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    inAppEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one preference setting must be provided for update',
  });

export const runJobsSchema = z.object({
  job: z.enum(['deadline', 'opening', 'doc_expiry', 'cleanup', 'all']).default('all'),
});
