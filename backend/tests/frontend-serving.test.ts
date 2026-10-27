import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Frontend Integration & Serving', () => {
  const app = createApp();

  it('serves the frontend index.html for root path /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<html');
  });

  it('serves frontend index.html for client-side SPA routes (e.g. /schemes)', async () => {
    const res = await request(app).get('/schemes');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<html');
  });

  it('does not serve frontend html for unhandled /api/v1 routes and returns 404 JSON', async () => {
    const res = await request(app).get('/api/v1/invalid-route');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('keeps health and liveness checks functional', async () => {
    const res = await request(app).get('/live');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
