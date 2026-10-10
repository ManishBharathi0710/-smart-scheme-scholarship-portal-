import { z } from 'zod';
import { AnalyticsCategory, AuditResult } from '@prisma/client';

export const timeRangeEnum = z.enum(['today', '7d', '30d', '90d', 'year', 'custom']);

export const analyticsFilterSchema = z.object({
  timeRange: timeRangeEnum.optional().default('30d'),
  startDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    ),
  endDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    ),
});

export const auditQuerySchema = z.object({
  actorUserId: z.string().uuid().optional(),
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(100).optional(),
  result: z.nativeEnum(AuditResult).optional(),
  requestId: z.string().trim().max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const auditIdParamSchema = z.object({
  id: z.string().uuid('Invalid audit log ID format'),
});

export const exportRequestSchema = z.object({
  exportType: z.enum([
    'PLATFORM',
    'USERS',
    'SCHEMES',
    'RECOMMENDATIONS',
    'DOCUMENTS',
    'NOTIFICATIONS',
    'AI',
    'AUDIT',
  ]),
  format: z.enum(['CSV', 'JSON']),
  timeRange: timeRangeEnum.optional().default('30d'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const recordEventSchema = z.object({
  eventType: z.string().trim().min(1).max(100),
  category: z.nativeEnum(AnalyticsCategory),
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});
