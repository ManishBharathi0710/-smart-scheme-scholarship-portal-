import { z } from 'zod';
import { ProgramType, SchemeCategory, ApplicationCycleStatus } from '@prisma/client';

export const savedSchemeParamsSchema = z.object({
  schemeId: z.string().uuid('Valid scheme ID is required'),
});

export const savedSchemeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  category: z.nativeEnum(SchemeCategory).optional(),
  programType: z.nativeEnum(ProgramType).optional(),
  applicationStatus: z.nativeEnum(ApplicationCycleStatus).optional(),
});
