import { env } from './env.js';

export const emailConfig = {
  provider: env.EMAIL_PROVIDER,
  from: env.EMAIL_FROM,
  maxRetries: env.NOTIFICATION_MAX_EMAIL_RETRIES,
  deadlineThresholds: env.NOTIFICATION_DEADLINE_THRESHOLDS.split(',').map((t) => Number(t.trim())),
  retentionDays: env.NOTIFICATION_RETENTION_DAYS,
  cleanupBatchSize: env.NOTIFICATION_CLEANUP_BATCH_SIZE,
};
