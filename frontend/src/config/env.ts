import { z } from 'zod';

const frontendEnvSchema = z.object({
  VITE_API_BASE_URL: z.string().default('/api/v1'),
  VITE_PORTAL_NAME: z.string().default('Smart Scheme & Scholarship Recommendation Portal'),
  VITE_APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

function parseFrontendEnv() {
  const boundBackendUrl =
    typeof process !== 'undefined' && process.env?.BACKEND_URL
      ? `${process.env.BACKEND_URL}/api/v1`
      : undefined;

  const result = frontendEnvSchema.safeParse({
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || boundBackendUrl || '/api/v1',
    VITE_PORTAL_NAME: import.meta.env.VITE_PORTAL_NAME,
    VITE_APP_ENV: import.meta.env.MODE,
  });

  if (!result.success) {
    console.warn('Frontend environment configuration warning, using defaults:', result.error);
    return {
      VITE_API_BASE_URL: '/api/v1',
      VITE_PORTAL_NAME: 'Smart Scheme & Scholarship Recommendation Portal',
      VITE_APP_ENV: 'development' as const,
    };
  }

  return result.data;
}

export const env = parseFrontendEnv();
