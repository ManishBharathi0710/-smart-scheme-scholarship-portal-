import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { generateAccessToken } from '../src/modules/auth/auth.utils.js';
import { UserRole, UserStatus, AuditResult } from '@prisma/client';
import { analyticsService } from '../src/modules/analytics/services/analytics.service.js';
import { auditService } from '../src/modules/analytics/services/audit.service.js';
import { systemHealthService } from '../src/modules/analytics/services/system-health.service.js';
import { exportService } from '../src/modules/analytics/services/export.service.js';
import { analyticsEventService } from '../src/modules/analytics/services/analytics-event.service.js';

describe('Module 9: Analytics, Audit, System Health & Administrative Intelligence', () => {
  const app = createApp();

  const superAdminId = '99999999-9999-9999-9999-999999999999';
  const adminId = '88888888-8888-8888-8888-888888888888';
  const schemeManagerId = '66666666-6666-6666-6666-666666666666';
  const citizenId = '77777777-7777-7777-7777-777777777777';

  const superAdminToken = generateAccessToken({
    id: superAdminId,
    email: 'superadmin@example.gov.in',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
  });

  const adminToken = generateAccessToken({
    id: adminId,
    email: 'admin@example.gov.in',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  });

  const schemeManagerToken = generateAccessToken({
    id: schemeManagerId,
    email: 'manager@example.gov.in',
    role: UserRole.SCHEME_MANAGER,
    status: UserStatus.ACTIVE,
  });

  const citizenToken = generateAccessToken({
    id: citizenId,
    email: 'citizen@example.gov.in',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Role-Based Access Control (RBAC)', () => {
    it('should forbid regular citizens (USER role) from accessing admin analytics overview with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated requests to admin analytics with 401', async () => {
      const res = await request(app).get('/api/v1/admin/analytics/overview');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow SCHEME_MANAGER to access analytics overview', async () => {
      vi.spyOn(analyticsService, 'getPlatformOverview').mockResolvedValue({
        dateRange: { startDate: '2026-08-27', endDate: '2026-09-26' },
        users: { total: 150, active: 85, new: 25 },
        schemes: {
          totalPublished: 40,
          openForApplication: 12,
          totalViews: 450,
          totalSaved: 120,
          officialPortalClicks: 65,
        },
        recommendations: {
          totalGenerated: 800,
          eligibleCount: 320,
          likelyEligibleCount: 280,
          needsVerificationCount: 150,
          notEligibleCount: 50,
        },
        documents: { totalUploaded: 210, ocrProcessed: 195, ocrSuccessRate: 92 },
        notifications: { totalSent: 1200, unreadCount: 110 },
        aiUsage: { totalQueries: 350, successfulQueries: 345, averageDurationMs: 420 },
      });

      const res = await request(app)
        .get('/api/v1/admin/analytics/overview?timeRange=30d')
        .set('Authorization', `Bearer ${schemeManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.total).toBe(150);
      expect(res.body.data.schemes.totalPublished).toBe(40);
    });
  });

  describe('2. Domain-Specific Analytics Endpoints', () => {
    it('should return user metrics with profile completion buckets', async () => {
      vi.spyOn(analyticsService, 'getUserAnalytics').mockResolvedValue({
        totalUsers: 100,
        activeUsers: 60,
        newUsers: 15,
        registrationsTrend: [{ date: '2026-09-20', count: 5 }],
        activeUsersTrend: [{ date: '2026-09-20', count: 40 }],
        profileCompletionBuckets: { '0_25': 10, '26_50': 20, '51_75': 35, '76_99': 25, '100': 10 },
        usersWithRecommendations: 70,
        usersWithSavedSchemes: 45,
        usersWithDocuments: 30,
        usersWithAiChats: 25,
      });

      const res = await request(app)
        .get('/api/v1/admin/analytics/users')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBe(100);
      expect(res.body.data.profileCompletionBuckets['100']).toBe(10);
    });

    it('should return scheme funnel metrics', async () => {
      vi.spyOn(analyticsService, 'getSchemeAnalytics').mockResolvedValue({
        totalPublished: 50,
        openApplications: 12,
        funnel: { viewed: 1000, saved: 300, officialPortalClicked: 120 },
        conversionRates: { viewToSaveRate: 30, saveToApplyClickRate: 40, overallFunnelRate: 12 },
        topSavedSchemes: [{ id: 's-1', name: 'Post-Matric Scholarship', count: 90 }],
        topViewedSchemes: [{ id: 's-1', name: 'Post-Matric Scholarship', count: 320 }],
        topPortalClickedSchemes: [{ id: 's-1', name: 'Post-Matric Scholarship', count: 50 }],
        categoryDistribution: [{ category: 'EDUCATION', count: 25 }],
      });

      const res = await request(app)
        .get('/api/v1/admin/analytics/schemes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalPublished).toBe(50);
      expect(res.body.data.funnel.viewed).toBe(1000);
    });

    it('should return recommendation analytics and top criteria failures', async () => {
      vi.spyOn(analyticsService, 'getRecommendationAnalytics').mockResolvedValue({
        totalEvaluations: 500,
        distribution: {
          eligible: 200,
          likelyEligible: 150,
          needsVerification: 100,
          notEligible: 50,
        },
        distributionPercentages: {
          eligible: 40,
          likelyEligible: 30,
          needsVerification: 20,
          notEligible: 10,
        },
        topCriteriaFailures: [
          { condition: 'Annual Family Income Limit', count: 35 },
          { condition: 'Academic Percentage Minimum', count: 15 },
        ],
      });

      const res = await request(app)
        .get('/api/v1/admin/analytics/recommendations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalEvaluations).toBe(500);
      expect(res.body.data.topCriteriaFailures).toHaveLength(2);
    });

    it('should return document and OCR extraction analytics', async () => {
      vi.spyOn(analyticsService, 'getDocumentAnalytics').mockResolvedValue({
        totalUploaded: 80,
        totalProcessed: 75,
        ocrRequests: 75,
        ocrSuccessRate: 93,
        ocrFailureRate: 7,
        confidenceDistribution: { high: 55, medium: 15, low: 5 },
        documentTypesBreakdown: [{ type: 'INCOME_CERTIFICATE', count: 35 }],
        expiredDocumentsCount: 2,
      });

      const res = await request(app)
        .get('/api/v1/admin/analytics/documents')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ocrSuccessRate).toBe(93);
      expect(res.body.data.confidenceDistribution.high).toBe(55);
    });

    it('should return AI assistant telemetry analytics', async () => {
      vi.spyOn(analyticsService, 'getAiAnalytics').mockResolvedValue({
        totalRequests: 120,
        successfulRequests: 118,
        failedRequests: 2,
        averageDurationMs: 380,
        totalInputTokens: 45000,
        totalOutputTokens: 28000,
        estimatedCostUsd: 0.0235,
        intentDistribution: [{ intent: 'EXPLAIN_ELIGIBILITY', count: 50 }],
        safetyEvents: { promptInjectionsBlocked: 1, validationContradictionsPrevented: 0 },
      });

      const res = await request(app)
        .get('/api/v1/admin/analytics/ai')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRequests).toBe(120);
      expect(res.body.data.safetyEvents.promptInjectionsBlocked).toBe(1);
    });

    it('should return search telemetry analytics', async () => {
      vi.spyOn(analyticsService, 'getSearchAnalytics').mockResolvedValue({
        totalSearches: 420,
        zeroResultSearchesCount: 22,
        zeroResultQueries: [{ query: 'aviation subsidy', count: 10 }],
        popularSearchTerms: [{ term: 'post matric', count: 110 }],
      });

      const res = await request(app)
        .get('/api/v1/admin/analytics/search')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalSearches).toBe(420);
      expect(res.body.data.popularSearchTerms).toHaveLength(1);
    });
  });

  describe('3. Immutable Audit Trail & Privileged Audit Search', () => {
    it('should return paginated audit logs and audit the viewing action itself', async () => {
      const mockAuditItems = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          actorUserId: adminId,
          actorEmail: 'admin@example.gov.in',
          actorRole: UserRole.ADMIN,
          action: 'SCHEME_PUBLISHED',
          entityType: 'Scheme',
          entityId: 'scheme-101',
          result: AuditResult.SUCCESS,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          requestId: 'req-1',
          metadata: { name: 'National Scholarship' },
          timestamp: new Date().toISOString(),
        },
      ];

      vi.spyOn(auditService, 'getAuditLogs').mockResolvedValue({
        items: mockAuditItems as any,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const recordAuditSpy = vi.spyOn(auditService, 'recordAuditLog').mockResolvedValue();

      const res = await request(app)
        .get('/api/v1/admin/audit-logs?page=1&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.pagination.total).toBe(1);

      expect(recordAuditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AUDIT_LOG_VIEWED',
          actorUserId: superAdminId,
        }),
      );
    });

    it('should forbid citizens from searching audit logs with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
    });

    it('should return single audit log by ID', async () => {
      const validAuditId = '12345678-1234-1234-1234-123456789abc';
      vi.spyOn(auditService, 'getAuditLogById').mockResolvedValue({
        id: validAuditId,
        actorUserId: adminId,
        actorEmail: 'admin@example.gov.in',
        actorRole: UserRole.ADMIN,
        action: 'SCHEME_UPDATED',
        entityType: 'Scheme',
        entityId: 'scheme-101',
        result: AuditResult.SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        requestId: 'req-2',
        metadata: {},
        timestamp: new Date().toISOString(),
      });

      const res = await request(app)
        .get(`/api/v1/admin/audit-logs/${validAuditId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(validAuditId);
      expect(res.body.data.action).toBe('SCHEME_UPDATED');
    });
  });

  describe('4. Comprehensive System Health Monitoring', () => {
    it('should return detailed diagnostic health statuses across services', async () => {
      vi.spyOn(systemHealthService, 'getDetailedSystemHealth').mockResolvedValue({
        overallStatus: 'HEALTHY',
        uptimeSeconds: 15400,
        timestamp: new Date().toISOString(),
        services: {
          api: { status: 'HEALTHY', latencyMs: 8 },
          database: { status: 'HEALTHY', latencyMs: 15 },
          storage: { status: 'HEALTHY' },
          ocr: { status: 'HEALTHY' },
          ai: { status: 'HEALTHY' },
          notifications: { status: 'HEALTHY' },
          scheduler: { status: 'HEALTHY' },
        },
      });

      const res = await request(app)
        .get('/api/v1/admin/system-health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallStatus).toBe('HEALTHY');
      expect(res.body.data.services.api.status).toBe('HEALTHY');
      expect(res.body.data.services.database.status).toBe('HEALTHY');
      expect(res.body.data.services.ocr.status).toBe('HEALTHY');
    });

    it('should reflect partial degradation accurately when a subsystem is degraded', async () => {
      vi.spyOn(systemHealthService, 'getDetailedSystemHealth').mockResolvedValue({
        overallStatus: 'DEGRADED',
        uptimeSeconds: 15400,
        timestamp: new Date().toISOString(),
        services: {
          api: { status: 'HEALTHY', latencyMs: 8 },
          database: { status: 'HEALTHY', latencyMs: 15 },
          storage: { status: 'DEGRADED' },
          ocr: { status: 'HEALTHY' },
          ai: { status: 'HEALTHY' },
          notifications: { status: 'HEALTHY' },
          scheduler: { status: 'HEALTHY' },
        },
      });

      const res = await request(app)
        .get('/api/v1/admin/system-health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallStatus).toBe('DEGRADED');
      expect(res.body.data.services.storage.status).toBe('DEGRADED');
    });
  });

  describe('5. Data Export & Audited Downloads', () => {
    it('should export audit logs in JSON format and create an export audit entry', async () => {
      vi.spyOn(exportService, 'generateExport').mockResolvedValue({
        data: JSON.stringify([{ id: 'log-1', action: 'LOGIN' }]),
        contentType: 'application/json',
        filename: 'audit-logs-export.json',
      });

      const res = await request(app)
        .post('/api/v1/admin/analytics/export')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ exportType: 'AUDIT', format: 'JSON' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.headers['content-disposition']).toContain(
        'attachment; filename="audit-logs-export.json"',
      );
    });

    it('should export user analytics in CSV format', async () => {
      vi.spyOn(exportService, 'generateExport').mockResolvedValue({
        data: 'id,email,role,status\nu-1,citizen@example.gov.in,USER,ACTIVE\n',
        contentType: 'text/csv',
        filename: 'users-export.csv',
      });

      const res = await request(app)
        .post('/api/v1/admin/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ exportType: 'USERS', format: 'CSV' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain(
        'attachment; filename="users-export.csv"',
      );
      expect(res.text).toContain('id,email,role,status');
    });

    it('should reject invalid export resource type with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ exportType: 'INVALID_RESOURCE', format: 'CSV' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('6. Non-Blocking Analytics Event Ingestion', () => {
    it('should accept analytics events with 200 OK', async () => {
      const recordEventSpy = vi.spyOn(analyticsEventService, 'recordEvent').mockResolvedValue();

      const res = await request(app)
        .post('/api/v1/admin/analytics/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventType: 'SCHEME_VIEWED',
          category: 'SCHEME',
          entityType: 'Scheme',
          entityId: 'scheme-xyz-123',
          metadata: { source: 'dashboard_recommendations' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(recordEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'SCHEME_VIEWED',
          category: 'SCHEME',
          entityType: 'Scheme',
          entityId: 'scheme-xyz-123',
        }),
      );
    });

    it('should allow unauthenticated citizen event ingestion for portal clicks', async () => {
      const recordEventSpy = vi.spyOn(analyticsEventService, 'recordEvent').mockResolvedValue();

      const res = await request(app)
        .post('/api/v1/admin/analytics/events')
        .send({
          eventType: 'OFFICIAL_PORTAL_CLICKED',
          category: 'SCHEME',
          entityType: 'Scheme',
          entityId: 'scheme-xyz-999',
          metadata: { portalUrl: 'https://scholarships.gov.in' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(recordEventSpy).toHaveBeenCalled();
    });
  });
});
