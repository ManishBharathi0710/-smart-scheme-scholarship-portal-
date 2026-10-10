import { env } from './env.js';

export const aiConfig = {
  provider: env.AI_PROVIDER,
  model: env.AI_MODEL,
  apiKey: env.AI_API_KEY,
  maxTokens: env.AI_MAX_TOKENS,
  temperature: env.AI_TEMPERATURE,
  timeoutMs: env.AI_TIMEOUT_MS,
  maxConversationMessages: env.AI_MAX_CONVERSATION_MESSAGES,
  requestsPerMinute: env.AI_REQUESTS_PER_MINUTE,
  conversationRetentionDays: env.AI_CONVERSATION_RETENTION_DAYS,
};
