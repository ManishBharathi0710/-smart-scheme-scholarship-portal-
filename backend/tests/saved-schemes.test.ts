import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { generateAccessToken } from '../src/modules/auth/auth.utils.js';
import { UserRole, UserStatus } from '@prisma/client';
import { savedSchemesRepository } from '../src/modules/saved-schemes/saved-schemes.repository.js';
import { schemesRepository } from '../src/modules/schemes/schemes.repository.js';
import { recommendationsRepository } from '../src/modules/recommendations/recommendations.repository.js';

describe('Module 5: Saved Schemes API', () => {
  const app = createApp();

  const userAId = '11111111-2222-3333-4444-555555555555';
  const userBId = '99999999-8888-7777-6666-555555555555';
  const schemeId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  const userAToken = generateAccessToken({
    id: userAId,
    email: 'userA@example.gov.in',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/v1/saved-schemes/:schemeId requires authentication', async () => {
    const res = await request(app).post(`/api/v1/saved-schemes/${schemeId}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/saved-schemes/:schemeId should reject invalid UUID format', async () => {
    const res = await request(app)
      .post('/api/v1/saved-schemes/invalid-uuid-123')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/saved-schemes/:schemeId should save verified published scheme', async () => {
    vi.spyOn(schemesRepository, 'findPublishedSchemeBySlugOrId').mockResolvedValue({
      id: schemeId,
      name: 'Higher Education Scholarship',
      slug: 'higher-education-scholarship',
      isPublished: true,
      status: 'PUBLISHED',
      verificationStatus: 'VERIFIED',
    } as any);

    vi.spyOn(savedSchemesRepository, 'saveScheme').mockResolvedValue({
      id: 'saved-1',
      userId: userAId,
      schemeId,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheme: {
        id: schemeId,
        name: 'Higher Education Scholarship',
        slug: 'higher-education-scholarship',
      },
    } as any);

    const res = await request(app)
      .post(`/api/v1/saved-schemes/${schemeId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.saved).toBe(true);
    expect(res.body.data.schemeId).toBe(schemeId);
  });

  it('POST /api/v1/saved-schemes/:schemeId should be idempotent', async () => {
    vi.spyOn(schemesRepository, 'findPublishedSchemeBySlugOrId').mockResolvedValue({
      id: schemeId,
      name: 'Higher Education Scholarship',
      slug: 'higher-education-scholarship',
      isPublished: true,
      status: 'PUBLISHED',
      verificationStatus: 'VERIFIED',
    } as any);

    vi.spyOn(savedSchemesRepository, 'saveScheme').mockResolvedValue({
      id: 'saved-1',
      userId: userAId,
      schemeId,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheme: {
        id: schemeId,
        name: 'Higher Education Scholarship',
        slug: 'higher-education-scholarship',
      },
    } as any);

    // Save once
    const res1 = await request(app)
      .post(`/api/v1/saved-schemes/${schemeId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res1.status).toBe(201);
    expect(res1.body.data.saved).toBe(true);

    // Save second time (idempotent)
    const res2 = await request(app)
      .post(`/api/v1/saved-schemes/${schemeId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res2.status).toBe(201);
    expect(res2.body.data.saved).toBe(true);
  });

  it('DELETE /api/v1/saved-schemes/:schemeId should remove saved scheme', async () => {
    vi.spyOn(savedSchemesRepository, 'removeSavedScheme').mockResolvedValue({
      id: 'saved-1',
      userId: userAId,
      schemeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await request(app)
      .delete(`/api/v1/saved-schemes/${schemeId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.saved).toBe(false);
  });

  it('GET /api/v1/saved-schemes/ids should return set of saved IDs', async () => {
    vi.spyOn(savedSchemesRepository, 'findUserSavedSchemeIds').mockResolvedValue([
      schemeId,
      'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
    ]);

    const res = await request(app)
      .get('/api/v1/saved-schemes/ids')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.schemeIds).toHaveLength(2);
    expect(res.body.data.count).toBe(2);
  });

  it('GET /api/v1/saved-schemes/:schemeId/status should return saved status', async () => {
    vi.spyOn(savedSchemesRepository, 'isSchemeSaved').mockResolvedValue(true);

    const res = await request(app)
      .get(`/api/v1/saved-schemes/${schemeId}/status`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.saved).toBe(true);
  });

  it('GET /api/v1/saved-schemes should return paginated list enriched with recommendation status', async () => {
    vi.spyOn(savedSchemesRepository, 'findUserSavedSchemes').mockResolvedValue({
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      items: [
        {
          id: 'saved-1',
          createdAt: new Date(),
          scheme: {
            id: schemeId,
            slug: 'higher-education-scholarship',
            name: 'Higher Education Scholarship',
            shortName: 'HES',
            shortDescription: 'Scholarship assistance',
            programType: 'SCHOLARSHIP' as any,
            categories: ['EDUCATION'] as any,
            department: { name: 'Higher Education Dept' },
            stateScope: 'ALL_INDIA',
            benefits: [],
            applicationPeriods: [],
            officialApplicationUrl: 'https://scholarships.gov.in',
            officialSourceUrl: 'https://education.gov.in',
          },
        },
      ] as any,
    });

    vi.spyOn(recommendationsRepository, 'findUserRecommendationsForSchemes').mockResolvedValue([
      {
        schemeId,
        eligibilityStatus: 'LIKELY_ELIGIBLE',
        isExpiringSoon: false,
        matchedCount: 3,
        failedCount: 0,
        unknownCount: 1,
        evaluationDetails: { summary: 'Likely qualifies based on education details' },
      } as any,
    ]);

    const res = await request(app)
      .get('/api/v1/saved-schemes')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].scheme.id).toBe(schemeId);
    expect(res.body.data[0].recommendation?.eligibilityStatus).toBe('LIKELY_ELIGIBLE');
  });

  it('Security: user context is always extracted from token, preventing cross-user access', async () => {
    const saveSpy = vi.spyOn(savedSchemesRepository, 'saveScheme').mockResolvedValue({
      id: 'saved-1',
      userId: userAId,
      schemeId,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheme: { id: schemeId, name: 'Scheme', slug: 'scheme' },
    } as any);

    vi.spyOn(schemesRepository, 'findPublishedSchemeBySlugOrId').mockResolvedValue({
      id: schemeId,
      name: 'Scheme',
      slug: 'scheme',
      isPublished: true,
      status: 'PUBLISHED',
      verificationStatus: 'VERIFIED',
    } as any);

    // Attempt to spoof userId in body
    await request(app)
      .post(`/api/v1/saved-schemes/${schemeId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ userId: userBId });

    // Ensure saveScheme was called with token userId (userAId), NEVER userBId
    expect(saveSpy).toHaveBeenCalledWith(userAId, schemeId);
  });
});
