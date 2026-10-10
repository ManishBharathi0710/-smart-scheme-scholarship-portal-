import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Router } from 'express';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '../src/errors/app-error.js';

describe('Error Handling and API Response Standard', () => {
  const app = createApp();

  it('should return standardized 404 for undefined routes', async () => {
    const response = await request(app).get('/api/v1/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: 'NOT_FOUND',
        message: expect.stringContaining('not found'),
        requestId: expect.any(String),
      }),
    });
  });

  it('should structure domain errors correctly', () => {
    const validationErr = new ValidationError('Invalid email format', [
      { field: 'email', message: 'Required' },
    ]);
    expect(validationErr.statusCode).toBe(400);
    expect(validationErr.errorCode).toBe('VALIDATION_ERROR');
    expect(validationErr.details).toEqual([{ field: 'email', message: 'Required' }]);

    const authErr = new AuthenticationError();
    expect(authErr.statusCode).toBe(401);
    expect(authErr.errorCode).toBe('UNAUTHORIZED');

    const authzErr = new AuthorizationError();
    expect(authzErr.statusCode).toBe(403);
    expect(authzErr.errorCode).toBe('FORBIDDEN');

    const notFoundErr = new NotFoundError('Scheme');
    expect(notFoundErr.statusCode).toBe(404);
    expect(notFoundErr.message).toBe('Scheme not found');

    const conflictErr = new ConflictError('User already exists');
    expect(conflictErr.statusCode).toBe(409);
    expect(conflictErr.errorCode).toBe('CONFLICT');
  });
});
