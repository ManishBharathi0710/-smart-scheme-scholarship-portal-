import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { healthRepository } from '../src/modules/health/health.repository.js';

describe('Health Endpoints', () => {
  const app = createApp();

  it('GET /api/v1/health should return health check payload', async () => {
    // Mock healthy database connection
    vi.spyOn(healthRepository, 'checkConnection').mockResolvedValueOnce({
      connected: true,
      responseTimeMs: 2,
    });

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('status', 'healthy');
    expect(response.body.data).toHaveProperty('service', 'smart-scheme-backend');
    expect(response.body.data.database).toHaveProperty('status', 'connected');
    expect(response.headers).toHaveProperty('x-request-id');
  });

  it('GET /api/v1/health should handle degraded status when DB is disconnected', async () => {
    vi.spyOn(healthRepository, 'checkConnection').mockResolvedValueOnce({
      connected: false,
      error: 'Connection refused',
    });

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('status', 'degraded');
    expect(response.body.data.database).toHaveProperty('status', 'disconnected');
  });

  it('GET /api/v1/health/live should return 200 alive', async () => {
    const response = await request(app).get('/api/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('alive');
  });

  it('GET /api/v1/health/ready should return readiness state', async () => {
    vi.spyOn(healthRepository, 'checkConnection').mockResolvedValueOnce({
      connected: true,
      responseTimeMs: 1,
    });

    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.ready).toBe(true);
    expect(response.body.data.database).toBe('connected');
  });
});
