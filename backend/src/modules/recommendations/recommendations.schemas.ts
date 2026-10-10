import { z } from 'zod';
import {
  RecommendationEligibilityStatus,
  RecommendationApplicationStatus,
  ProgramType,
  SchemeCategory,
} from '@prisma/client';

export const recommendationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(RecommendationEligibilityStatus).optional(),
  programType: z.nativeEnum(ProgramType).optional(),
  category: z.nativeEnum(SchemeCategory).optional(),
  applicationStatus: z.nativeEnum(RecommendationApplicationStatus).optional(),
  expiringSoon: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const recommendationParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid recommendation ID format.' }),
});

export const evaluateSchemeParamsSchema = z.object({
  schemeId: z.string().uuid({ message: 'Invalid scheme ID format.' }),
});
