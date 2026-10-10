import { z } from 'zod';
import { AssistantContextType } from '@prisma/client';

export const supportedLanguages = ['en', 'ta', 'hi', 'ml', 'te', 'kn'] as const;

export const chatRequestSchema = z.object({
  message: z
    .string({ required_error: 'User message is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
  conversationId: z.string().uuid('Invalid conversation ID format').optional(),
  context: z
    .object({
      contextType: z
        .nativeEnum(AssistantContextType)
        .optional()
        .default(AssistantContextType.GENERAL),
      contextId: z.string().trim().max(255).optional(),
      schemeId: z.string().trim().max(255).optional(),
      language: z.enum(supportedLanguages).optional().default('en'),
    })
    .optional(),
});

export const conversationIdParamSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID format'),
});

export const conversationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
