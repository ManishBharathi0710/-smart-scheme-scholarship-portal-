import { env } from './env.js';

export const applicationConfig = {
  name: 'Smart Scheme & Scholarship Recommendation Portal',
  version: '1.0.0',
  environment: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  frontendUrl: env.FRONTEND_URL,
  logLevel: env.LOG_LEVEL,
  isProduction: env.NODE_ENV === 'production',
  isStaging: env.NODE_ENV === 'staging',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
};
