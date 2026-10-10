import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { profileRepository } from '../src/modules/profile/profile.repository.js';
import { generateAccessToken } from '../src/modules/auth/auth.utils.js';
import { UserRole, UserStatus } from '@prisma/client';

describe('Profile Endpoints & Completion Logic', () => {
  const app = createApp();

  const mockUser = {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'student@example.com',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
  };

  const authToken = generateAccessToken(mockUser);

  const mockFullProfile = {
    id: 'profile-uuid',
    userId: mockUser.id,
    fullName: 'Jane Doe',
    dateOfBirth: new Date('2002-05-15'),
    age: 22,
    gender: 'FEMALE',
    mobileNumber: '9876543210',
    createdAt: new Date(),
    updatedAt: new Date(),
    location: {
      state: 'Tamil Nadu',
      district: 'Coimbatore',
      cityTown: 'Pollachi',
      pincode: '642001',
      areaType: 'RURAL',
    },
    education: {
      educationLevel: 'UNDERGRADUATE',
      courseName: 'B.Tech IT',
      specialization: 'Information Technology',
      institutionType: 'GOVERNMENT',
      institutionName: 'Government College of Technology',
      yearOfStudy: 3,
      academicPercentage: 85.5,
      academicCgpa: 8.6,
      passingYear: 2025,
    },
    financial: {
      annualFamilyIncome: 180000,
      incomeRange: 'BETWEEN_1_AND_2_5_LAKH',
      incomeSource: 'Agriculture',
      bplCardHolder: false,
    },
    social: {
      category: 'OBC',
      minorityStatus: false,
      minorityCommunity: null,
      disabilityStatus: false,
      disabilityPercentage: null,
      disabilityType: null,
      isFirstGenerationGraduate: true,
      singleGirlChild: false,
      orphanStatus: false,
    },
    occupation: {
      occupationType: 'STUDENT',
      employmentStatus: null,
      organizationName: null,
      farmerCategory: 'NONE',
    },
    user: {
      preferences: [{ category: 'SCHOLARSHIPS' }, { category: 'EDUCATION' }],
      consents: [{ consentType: 'PROFILE_PROCESSING', granted: true }],
    },
  };

  it('GET /api/v1/profile should return structured user profile for authenticated user', async () => {
    vi.spyOn(profileRepository, 'getProfileByUserId').mockResolvedValueOnce(mockFullProfile as any);

    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Jane Doe');
    expect(res.body.data.location.state).toBe('Tamil Nadu');
    expect(res.body.data.education.educationLevel).toBe('UNDERGRADUATE');
    expect(res.body.data.financial.annualFamilyIncome).toBe(180000);
  });

  it('GET /api/v1/profile/completion should calculate completion breakdown accurately', async () => {
    vi.spyOn(profileRepository, 'getProfileByUserId').mockResolvedValueOnce(mockFullProfile as any);

    const res = await request(app)
      .get('/api/v1/profile/completion')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overallPercentage).toBeGreaterThanOrEqual(90);
    expect(res.body.data.isReadyForRecommendations).toBe(true);
    expect(res.body.data.sections).toHaveProperty('education');
  });

  it('PATCH /api/v1/profile/personal should update personal fields with validation', async () => {
    vi.spyOn(profileRepository, 'getProfileByUserId').mockResolvedValue(mockFullProfile as any);
    vi.spyOn(profileRepository, 'updatePersonal').mockResolvedValueOnce({} as any);

    const res = await request(app)
      .patch('/api/v1/profile/personal')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fullName: 'Jane Doe Updated',
        age: 23,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PATCH /api/v1/profile/education should reject percentage over 100', async () => {
    const res = await request(app)
      .patch('/api/v1/profile/education')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        academicPercentage: 105,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
