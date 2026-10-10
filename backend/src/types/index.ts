import { Request } from 'express';

export * from './api.js';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      id?: string;
      // Module 2 will extend this with authenticated user context
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export type AppRequest = Request;
