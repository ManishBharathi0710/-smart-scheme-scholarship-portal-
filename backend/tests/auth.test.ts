import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { authRepository } from '../src/modules/auth/auth.repository.js';
import { hashPassword } from '../src/modules/auth/auth.utils.js';
import { UserRole, UserStatus } from '@prisma/client';

describe('Authentication Endpoints & Workflows', () => {
  const app = createApp();

  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'citizen@example.com',
    passwordHash: '',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('POST /api/v1/auth/register should create a user and return tokens', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValueOnce(null);
    vi.spyOn(authRepository, 'createUserWithInitialProfile').mockResolvedValueOnce({
      ...mockUser,
      passwordHash: 'hashed_pw',
    });
    vi.spyOn(authRepository, 'storeRefreshToken').mockResolvedValueOnce({} as any);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'citizen@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      fullName: 'Manish Kumar',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('citizen@example.com');
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('POST /api/v1/auth/register should reject mismatched password confirmation', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'citizen@example.com',
      password: 'Password123',
      confirmPassword: 'Password456',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/register should reject duplicate email', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValueOnce(mockUser as any);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'citizen@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('POST /api/v1/auth/login should authenticate valid user', async () => {
    const hashedPassword = await hashPassword('Password123');
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValueOnce({
      ...mockUser,
      passwordHash: hashedPassword,
    } as any);
    vi.spyOn(authRepository, 'updateLastLogin').mockResolvedValueOnce(undefined as any);
    vi.spyOn(authRepository, 'storeRefreshToken').mockResolvedValueOnce({} as any);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'citizen@example.com',
      password: 'Password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.user.email).toBe('citizen@example.com');
  });

  it('POST /api/v1/auth/login should reject invalid password without enumeration', async () => {
    const hashedPassword = await hashPassword('Password123');
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValueOnce({
      ...mockUser,
      passwordHash: hashedPassword,
    } as any);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'citizen@example.com',
      password: 'WrongPassword999',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('POST /api/v1/auth/forgot-password should return generic message preventing enumeration', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValueOnce(null);

    const res = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'nonexistent@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('password reset instructions have been issued');
  });
});
