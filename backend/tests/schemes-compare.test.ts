import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { schemesRepository } from '../src/modules/schemes/schemes.repository.js';
import { generateAccessToken } from '../src/modules/auth/auth.utils.js';
import { UserRole, UserStatus } from '@prisma/client';
import { recommendationsRepository } from '../src/modules/recommendations/recommendations.repository.js';
import { savedSchemesRepository } from '../src/modules/saved-schemes/saved-schemes.repository.js';

describe('Module 5: Scheme Comparison API', () => {
  const app = createApp();

  const citizenId = '77777777-7777-7777-7777-777777777777';
  const citizenToken = generateAccessToken({
    id: citizenId,
    email: 'citizen@example.gov.in',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  const scheme1Id = '11111111-aaaa-bbbb-cccc-111111111111';
  const scheme2Id = '22222222-aaaa-bbbb-cccc-222222222222';
  const scheme3Id = '33333333-aaaa-bbbb-cccc-333333333333';
  const scheme4Id = '44444444-aaaa-bbbb-cccc-444444444444';
  const scheme5Id = '55555555-aaaa-bbbb-cccc-555555555555';

  const mockScheme = (id: string, name: string) => ({
    id,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    shortName: name.substring(0, 4),
    programType: 'SCHOLARSHIP' as any,
    categories: ['EDUCATION'] as any,
    stateScope: 'ALL_INDIA',
    isPublished: true,
    status: 'PUBLISHED',
    verificationStatus: 'VERIFIED',
    department: {
      id: 'dept-1',
      name: 'Department of Higher Education',
      level: 'CENTRAL' as any,
    },
    benefits: [
      {
        id: 'b-1',
        benefitType: 'DIRECT_BENEFIT_TRANSFER' as any,
        amount: 20000,
        frequency: 'ANNUAL' as any,
        description: 'Allowance',
      },
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'Aadhaar Card',
        mandatory: true,
      },
      {
        id: 'doc-2',
        name: 'Income Certificate',
        mandatory: true,
      },
    ],
    applicationPeriods: [
      {
        id: 'ap-1',
        title: 'Academic Year 2026-27',
        status: 'OPEN' as any,
        applicationOpenDate: new Date('2026-08-01'),
        applicationCloseDate: new Date('2026-11-30'),
      },
    ],
    applicationMethod: 'ONLINE' as any,
    officialApplicationUrl: 'https://scholarships.gov.in',
    officialSourceUrl: 'https://education.gov.in',
    eligibilityRules: [],
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/v1/schemes/compare should reject missing ids query param', async () => {
    const res = await request(app).get('/api/v1/schemes/compare');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/schemes/compare should reject more than 4 schemes', async () => {
    const ids = [scheme1Id, scheme2Id, scheme3Id, scheme4Id, scheme5Id].join(',');
    const res = await request(app).get(`/api/v1/schemes/compare?ids=${ids}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body.error)).toContain('4 schemes');
  });

  it('GET /api/v1/schemes/compare should compare 2 schemes factually for public user', async () => {
    vi.spyOn(schemesRepository, 'findPublishedSchemesByIds').mockResolvedValue([
      mockScheme(scheme1Id, 'National Scholarship'),
      mockScheme(scheme2Id, 'State Welfare Aid'),
    ] as any);

    const res = await request(app).get(`/api/v1/schemes/compare?ids=${scheme1Id},${scheme2Id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comparedCount).toBe(2);
    expect(res.body.data.maxAllowed).toBe(4);

    const schemes = res.body.data.schemes;
    expect(schemes).toHaveLength(2);
    expect(schemes[0].name).toBe('National Scholarship');
    expect(schemes[0].benefitsSummary[0]).toContain('DIRECT BENEFIT TRANSFER');
    expect(schemes[0].requiredDocuments).toContain('Aadhaar Card (Mandatory)');
    expect(schemes[0].applicationStatus).toBe('OPEN');
    expect(schemes[0].officialApplicationUrl).toBe('https://scholarships.gov.in');

    // Ensure no biased scoring or winner fields
    expect(schemes[0].winner).toBeUndefined();
    expect(schemes[0].score).toBeUndefined();
    expect(schemes[0].rank).toBeUndefined();
  });

  it('POST /api/v1/schemes/compare should enrich with user eligibility when authenticated', async () => {
    vi.spyOn(schemesRepository, 'findPublishedSchemesByIds').mockResolvedValue([
      mockScheme(scheme1Id, 'National Scholarship'),
      mockScheme(scheme2Id, 'State Welfare Aid'),
    ] as any);

    vi.spyOn(savedSchemesRepository, 'findUserSavedSchemeIds').mockResolvedValue([scheme1Id]);

    vi.spyOn(recommendationsRepository, 'findUserRecommendationsForSchemes').mockResolvedValue([
      {
        schemeId: scheme1Id,
        eligibilityStatus: 'ELIGIBLE',
        evaluatedAt: new Date(),
        evaluationDetails: {
          missingRequirements: [],
        },
      } as any,
    ]);

    const res = await request(app)
      .post('/api/v1/schemes/compare')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ schemeIds: [scheme1Id, scheme2Id] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const schemes = res.body.data.schemes;
    // Scheme 1 is saved and has eligibility result
    expect(schemes[0].isSaved).toBe(true);
    expect(schemes[0].userEligibility?.status).toBe('ELIGIBLE');

    // Scheme 2 is not saved and has no eligibility evaluation
    expect(schemes[1].isSaved).toBe(false);
    expect(schemes[1].userEligibility).toBeNull();
  });

  it('Comparison respects public visibility rules (excluding draft or unverified schemes)', async () => {
    // Only scheme 1 is verified & published; scheme 2 is draft so repository returns only scheme 1
    vi.spyOn(schemesRepository, 'findPublishedSchemesByIds').mockResolvedValue([
      mockScheme(scheme1Id, 'National Scholarship'),
    ] as any);

    const res = await request(app).get(`/api/v1/schemes/compare?ids=${scheme1Id},${scheme2Id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.comparedCount).toBe(1);
    expect(res.body.data.schemes[0].id).toBe(scheme1Id);
  });
});
