import { Router } from 'express';
import { assistantController } from './assistant.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { aiRateLimiter } from '../../middleware/rate-limiter.js';
import {
  chatRequestSchema,
  conversationIdParamSchema,
  conversationListQuerySchema,
} from './assistant.schemas.js';

export const assistantRouter = Router();

// All AI assistant endpoints require authentication and per-user/ip rate limiting
assistantRouter.use(authenticate);
assistantRouter.use(aiRateLimiter);

// Conversational assistance entrypoint
assistantRouter.post(
  '/chat',
  validateRequest({ body: chatRequestSchema }),
  assistantController.chat,
);

// Conversation management (user-scoped)
assistantRouter.get(
  '/conversations',
  validateRequest({ query: conversationListQuerySchema }),
  assistantController.getConversations,
);

assistantRouter.get(
  '/conversations/:conversationId',
  validateRequest({ params: conversationIdParamSchema }),
  assistantController.getConversation,
);

assistantRouter.delete(
  '/conversations/:conversationId',
  validateRequest({ params: conversationIdParamSchema }),
  assistantController.deleteConversation,
);
