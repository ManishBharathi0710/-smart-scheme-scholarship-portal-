import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Environment Configuration Schema', () => {
  const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    API_PREFIX: z.string().default('/api/v1'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    FRONTEND_URL: z.string().default('http://localhost:5173'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  });

  it('should accept valid configuration', () => {
    const validConfig = {
      NODE_ENV: 'test',
      PORT: '5000',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      FRONTEND_URL: 'http://localhost:5173',
      LOG_LEVEL: 'info',
    };

    const parsed = envSchema.safeParse(validConfig);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.PORT).toBe(5000);
      expect(parsed.data.API_PREFIX).toBe('/api/v1');
    }
  });

  it('should fail when DATABASE_URL is missing', () => {
    const invalidConfig = {
      NODE_ENV: 'development',
      PORT: '5000',
      DATABASE_URL: '',
    };

    const parsed = envSchema.safeParse(invalidConfig);
    expect(parsed.success).toBe(false);
  });
});
