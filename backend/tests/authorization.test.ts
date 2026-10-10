import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate } from '../src/middleware/authenticate.js';
import { authorizeRole } from '../src/middleware/authorize.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { generateAccessToken } from '../src/modules/auth/auth.utils.js';
import { UserRole, UserStatus } from '@prisma/client';

describe('Authorization & RBAC Middleware', () => {
  const app = express();
  app.use(express.json());

  // Protected user route
  app.get('/test/user-route', authenticate, (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // Protected admin-only route
  app.get(
    '/test/admin-route',
    authenticate,
    authorizeRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    (_req, res) => {
      res.json({ success: true, message: 'Welcome Admin' });
    },
  );

  app.use(errorHandler);

  const regularUser = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'user@example.com',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
  };

  const adminUser = {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
  };

  it('should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/test/user-route');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should allow authenticated USER on user-route', async () => {
    const token = generateAccessToken(regularUser);
    const res = await request(app).get('/test/user-route').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('user@example.com');
  });

  it('should forbid regular USER on admin-route with 403', async () => {
    const token = generateAccessToken(regularUser);
    const res = await request(app).get('/test/admin-route').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should allow ADMIN on admin-route', async () => {
    const token = generateAccessToken(adminUser);
    const res = await request(app).get('/test/admin-route').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Welcome Admin');
  });
});
