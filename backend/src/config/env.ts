import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from process.cwd() or parent directories
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5001),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .positive()
    .default(15 * 60 * 1000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100), // 100 req per window
  // Module 2: Authentication Configuration
  JWT_SECRET: z.string().min(16).default('smart_scheme_portal_super_secure_jwt_secret_key_2026'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(16)
    .default('smart_scheme_portal_refresh_token_secret_key_2026'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES: z.coerce.number().positive().default(60),
  // Module 6: Document Management & OCR Configuration
  DOCUMENT_MAX_SIZE_MB: z.coerce.number().positive().default(10),
  DOCUMENT_STORAGE_PATH: z.string().default('uploads/documents'),
  DOCUMENT_SIGNED_URL_EXPIRES_SECONDS: z.coerce.number().positive().default(300),
  OCR_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.7),
  // Module 7: Notification & Reminder Configuration
  NOTIFICATION_DEADLINE_THRESHOLDS: z.string().default('7,3,1,0'),
  NOTIFICATION_RETENTION_DAYS: z.coerce.number().positive().default(180),
  NOTIFICATION_CLEANUP_BATCH_SIZE: z.coerce.number().positive().default(100),
  EMAIL_PROVIDER: z.enum(['LOG', 'MOCK', 'SMTP']).default('LOG'),
  EMAIL_FROM: z.string().default('notifications@smartschemes.gov.in'),
  NOTIFICATION_MAX_EMAIL_RETRIES: z.coerce.number().positive().default(3),
  // Module 8: AI Assistant Layer Configuration
  AI_PROVIDER: z.enum(['MOCK', 'GEMINI', 'OPENAI']).default('MOCK'),
  AI_MODEL: z.string().default('gemini-1.5-flash'),
  AI_API_KEY: z.string().optional(),
  AI_MAX_TOKENS: z.coerce.number().positive().default(1024),
  AI_TEMPERATURE: z.coerce.number().default(0.2),
  AI_TIMEOUT_MS: z.coerce.number().positive().default(30000),
  AI_MAX_CONVERSATION_MESSAGES: z.coerce.number().positive().default(20),
  AI_REQUESTS_PER_MINUTE: z.coerce.number().positive().default(30),
  AI_CONVERSATION_RETENTION_DAYS: z.coerce.number().positive().default(90),
  // Module 9: Analytics, Audit & Monitoring Configuration
  ANALYTICS_EVENT_RETENTION_DAYS: z.coerce.number().positive().default(90),
  AUDIT_LOG_RETENTION_DAYS: z.coerce.number().positive().default(365),
  ANALYTICS_MAX_EXPORT_ROWS: z.coerce.number().positive().default(10000),
  ANALYTICS_CACHE_TTL_SECONDS: z.coerce.number().positive().default(300),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.issues.map((issue) => ({
      variable: issue.path.join('.'),
      issue: issue.message,
    }));

    // eslint-disable-next-line no-console
    console.error('❌ Environment Configuration Validation Failed:');
    errorDetails.forEach((err) => {
      // eslint-disable-next-line no-console
      console.error(`   - ${err.variable}: ${err.issue}`);
    });

    if (process.env['NODE_ENV'] !== 'test') {
      process.exit(1);
    }

    return envSchema.parse({
      ...process.env,
      DATABASE_URL:
        process.env['DATABASE_URL'] ||
        'postgresql://postgres:postgres@localhost:5432/smart_scheme_test',
    });
  }

  return result.data;
}

export const env = validateEnv();
