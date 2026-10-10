import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { generateAccessToken } from '../src/modules/auth/auth.utils.js';
import { UserRole, UserStatus } from '@prisma/client';
import { profileService } from '../src/modules/profile/profile.service.js';
import { recommendationService } from '../src/modules/recommendations/recommendations.service.js';
import { savedSchemesService } from '../src/modules/saved-schemes/saved-schemes.service.js';

describe('Module 5: Personalized Citizen Dashboard API', () => {
  const app = createApp();

  const citizenId = '55555555-5555-5555-5555-555555555555';
  const citizenToken = generateAccessToken({
    id: citizenId,
    email: 'citizen@example.gov.in',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/v1/dashboard should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/dashboard');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/dashboard should return aggregated dashboard for authenticated user', async () => {
    vi.spyOn(profileService, 'getProfile').mockResolvedValue({
      id: 'prof-1',
      userId: citizenId,
      fullName: 'Anita Devi',
      dateOfBirth: new Date('1998-05-12'),
      age: 28,
      gender: 'FEMALE' as any,
      mobileNumber: '9876543210',
      createdAt: new Date(),
      updatedAt: new Date(),
      location: {
        state: 'Tamil Nadu',
        district: 'Chennai',
        cityTown: 'Chennai',
        pincode: '600001',
        areaType: 'URBAN' as any,
      },
      education: {
        educationLevel: 'POSTGRADUATE' as any,
        courseName: 'M.Sc Data Science',
        specialization: 'Analytics',
        institutionType: 'GOVERNMENT' as any,
        institutionName: 'University of Madras',
        yearOfStudy: 2,
        academicPercentage: 82,
        academicCgpa: 8.5,
        passingYear: 2026,
      },
      financial: {
        annualFamilyIncome: 180000,
        incomeRange: 'BELOW_2_5_LAKHS' as any,
        isBplCardHolder: true,
        bplCardNumber: 'BPL12345',
        isEwsCardHolder: false,
      },
      social: {
        category: 'OBC' as any,
        religion: 'HINDU' as any,
        caste: 'BC',
        isPersonWithDisability: false,
        disabilityPercentage: null,
        disabilityType: null,
        isMinority: false,
        isExServiceman: false,
        isSingleGirlChild: true,
      },
      occupation: null,
      preferences: [],
      consents: [],
    });

    vi.spyOn(profileService, 'calculateCompletion').mockResolvedValue({
      overallPercentage: 85,
      isReadyForRecommendations: true,
      sections: {},
      summary: 'Profile is 85% complete and ready for benefits matching.',
    });

    vi.spyOn(recommendationService, 'getSummaryCounts').mockResolvedValue({
      ELIGIBLE: 5,
      LIKELY_ELIGIBLE: 3,
      NEEDS_VERIFICATION: 2,
      NOT_ELIGIBLE: 1,
    });

    vi.spyOn(recommendationService, 'getUserRecommendations').mockResolvedValue({
      items: [
        {
          id: 'rec-1',
          schemeId: 'scheme-1',
          schemeSlug: 'post-matric-scholarship',
          schemeName: 'Post-Matric Scholarship Scheme',
          shortName: 'PMS',
          programType: 'SCHOLARSHIP' as any,
          departmentName: 'Ministry of Social Justice',
          departmentLevel: 'CENTRAL' as any,
          stateScope: 'ALL_INDIA',
          eligibilityStatus: 'ELIGIBLE' as any,
          statusLabel: 'Eligible',
          isExpiringSoon: false,
          applicationStatus: 'OPEN' as any,
          applicationOpenDate: new Date('2026-08-01'),
          applicationCloseDate: new Date('2026-11-30'),
          primaryBenefit: {
            type: 'DIRECT_BENEFIT_TRANSFER' as any,
            amount: 25000,
            frequency: 'ANNUAL' as any,
            description: 'Direct allowance',
          },
          matchedCount: 4,
          failedCount: 0,
          unknownCount: 0,
          evaluatedAt: new Date(),
          schemeVersionNumber: 1,
        },
      ],
      pagination: {
        page: 1,
        pageSize: 6,
        total: 10,
        totalPages: 2,
      },
    });

    vi.spyOn(savedSchemesService, 'getUserSavedSchemes').mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        pageSize: 4,
        total: 0,
        totalPages: 0,
      },
    });

    const res = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const d = res.body.data;
    // Profile section
    expect(d.profile.fullName).toBe('Anita Devi');
    expect(d.profile.completionPercentage).toBe(85);
    expect(d.profile.isReadyForRecommendations).toBe(true);

    // Recommendation summary
    expect(d.recommendationSummary.eligible).toBe(5);
    expect(d.recommendationSummary.likelyEligible).toBe(3);
    expect(d.recommendationSummary.needsVerification).toBe(2);
    expect(d.recommendationSummary.notEligible).toBe(1);

    // Recommendations list
    expect(d.topRecommendations).toHaveLength(1);
    expect(d.topRecommendations[0].schemeName).toBe('Post-Matric Scholarship Scheme');

    // Action items
    expect(d.actionItems).toBeDefined();
    expect(Array.isArray(d.actionItems)).toBe(true);
  });

  it('GET /api/v1/dashboard/action-items should return actionable next steps', async () => {
    vi.spyOn(profileService, 'getProfile').mockResolvedValue(null);
    vi.spyOn(profileService, 'calculateCompletion').mockResolvedValue({
      overallPercentage: 30,
      isReadyForRecommendations: false,
      sections: {},
      summary: 'Incomplete profile.',
    });
    vi.spyOn(recommendationService, 'getSummaryCounts').mockResolvedValue({
      ELIGIBLE: 0,
      LIKELY_ELIGIBLE: 0,
      NEEDS_VERIFICATION: 0,
      NOT_ELIGIBLE: 0,
    });
    vi.spyOn(recommendationService, 'getUserRecommendations').mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 4, total: 0, totalPages: 0 },
    });
    vi.spyOn(savedSchemesService, 'getUserSavedSchemes').mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 4, total: 0, totalPages: 0 },
    });

    const res = await request(app)
      .get('/api/v1/dashboard/action-items')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].type).toBe('PROFILE_COMPLETION');
  });
});
