import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  applicationConfig,
  databaseConfig,
  storageConfig,
  aiConfig,
  emailConfig,
  securityConfig,
} from '../src/config/index.js';
import { documentStorageCleanupService } from '../src/modules/documents/documents.cleanup.js';
import { prisma } from '../src/database/prisma.js';
import { healthRepository } from '../src/modules/health/health.repository.js';

describe('Module 10: Production Deployment, Configuration & Reliability', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Centralized Configuration Layer', () => {
    it('should export valid application configuration', () => {
      expect(applicationConfig).toBeDefined();
      expect(applicationConfig.name).toBe('Smart Scheme & Scholarship Recommendation Portal');
      expect(applicationConfig.version).toBe('1.0.0');
      expect(typeof applicationConfig.port).toBe('number');
      expect(applicationConfig.apiPrefix).toBe('/api/v1');
    });

    it('should export valid database configuration with pooling and timeouts', () => {
      expect(databaseConfig).toBeDefined();
      expect(databaseConfig.url).toBeDefined();
      expect(databaseConfig.poolMin).toBeGreaterThanOrEqual(0);
      expect(databaseConfig.poolMax).toBeGreaterThanOrEqual(databaseConfig.poolMin);
      expect(databaseConfig.timeoutMs).toBeGreaterThan(0);
    });

    it('should export valid storage configuration with mime types and size limits', () => {
      expect(storageConfig).toBeDefined();
      expect(storageConfig.maxFileSizeMb).toBe(10);
      expect(storageConfig.allowedMimeTypes).toContain('application/pdf');
      expect(storageConfig.allowedMimeTypes).toContain('image/jpeg');
    });

    it('should export valid AI configuration', () => {
      expect(aiConfig).toBeDefined();
      expect(['MOCK', 'GEMINI', 'OPENAI']).toContain(aiConfig.provider);
      expect(aiConfig.maxTokens).toBeGreaterThan(0);
    });

    it('should export valid email and notification configuration', () => {
      expect(emailConfig).toBeDefined();
      expect(Array.isArray(emailConfig.deadlineThresholds)).toBe(true);
      expect(emailConfig.retentionDays).toBeGreaterThan(0);
    });

    it('should export hardened security configuration', () => {
      expect(securityConfig).toBeDefined();
      expect(securityConfig.jwt.secret.length).toBeGreaterThanOrEqual(16);
      expect(securityConfig.rateLimit.authMaxRequests).toBe(20);
      expect(Array.isArray(securityConfig.cors.allowedOrigins)).toBe(true);
    });
  });

  describe('2. Container Health & Readiness Probes (Root Level)', () => {
    it('GET /health should return 200 OK for container liveness check', async () => {
      vi.spyOn(healthRepository, 'checkConnection').mockResolvedValueOnce({
        connected: true,
        responseTimeMs: 2,
      });

      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });

    it('GET /ready should return 200 OK for ingress readiness check', async () => {
      vi.spyOn(healthRepository, 'checkConnection').mockResolvedValueOnce({
        connected: true,
        responseTimeMs: 2,
      });

      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ready).toBe(true);
    });

    it('GET /live should return 200 OK for process liveness check', async () => {
      const res = await request(app).get('/live');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('alive');
    });
  });

  describe('3. Document Storage Cleanup Service', () => {
    it('should execute storage cleanup without errors', async () => {
      vi.spyOn(prisma.userDocument, 'findMany').mockResolvedValue([]);

      const result = await documentStorageCleanupService.cleanupOrphanedStorage(24);
      expect(result).toBeDefined();
      expect(typeof result.totalFilesScanned).toBe('number');
      expect(typeof result.orphanedFilesFound).toBe('number');
      expect(typeof result.filesDeleted).toBe('number');
      expect(result.errors).toHaveLength(0);
    });
  });
});
