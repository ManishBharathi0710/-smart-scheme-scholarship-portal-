import cors, { CorsOptions } from 'cors';
import { env } from '../config/env.js';

// Parse allowed origins from FRONTEND_URL or comma-separated list
const allowedOrigins = env.FRONTEND_URL.split(',').map((origin) => origin.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, or server-to-server) in non-production
    if (!origin) {
      if (env.NODE_ENV === 'production') {
        return callback(null, false);
      }
      return callback(null, true);
    }

    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      (Boolean(process.env.VERCEL) && origin.endsWith('.vercel.app'))
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);
