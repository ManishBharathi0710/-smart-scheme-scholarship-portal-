import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { schemesRepository } from '../src/modules/schemes/schemes.repository.js';
import { generateAccessToken } from '../src/modules/auth/auth.utils.js';
import { UserRole, UserStatus } from '@prisma/client';
import {
  ProgramType,
  SchemeCategory,
  SchemeStatus,
  VerificationStatus,
  DepartmentLevel,
  RuleOperator,
  RuleDataType,
  BenefitType,
} from '../src/modules/schemes/schemes.constants.js';

describe('Module 3: Scheme & Scholarship Management', () => {
  const app = createApp();

  const citizenToken = generateAccessToken({
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'citizen@example.com',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  const schemeManagerToken = generateAccessToken({
    userId: '22222222-2222-2222-2222-222222222222',
    email: 'manager@example.gov.in',
    role: UserRole.SCHEME_MANAGER,
    status: UserStatus.ACTIVE,
  });

  const verifierToken = generateAccessToken({
    userId: '33333333-3333-3333-3333-333333333333',
    email: 'verifier@example.gov.in',
    role: UserRole.VERIFIER,
    status: UserStatus.ACTIVE,
  });

  const adminToken = generateAccessToken({
    userId: '44444444-4444-4444-4444-444444444444',
    email: 'admin@example.gov.in',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  });

  const mockDepartment = {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    name: 'Department of Higher Education',
    shortName: 'DHE',
    level: DepartmentLevel.STATE,
    state: 'Tamil Nadu',
    description: 'Higher Education Department of Tamil Nadu',
    officialWebsite: 'https://highereducation.tn.gov.in',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockScheme = {
    id: 'ssssssss-ssss-ssss-ssss-ssssssssssss',
    slug: 'post-matric-scholarship-tn',
    name: 'Post-Matric Scholarship Scheme',
    shortName: 'PMS-TN',
    description: 'Financial assistance for post-secondary education for eligible students.',
    shortDescription: 'Post-matric educational assistance up to ₹50,000.',
    programType: ProgramType.SCHOLARSHIP,
    categories: [SchemeCategory.EDUCATION, SchemeCategory.STUDENT_SUPPORT],
    departmentId: mockDepartment.id,
    ministry: null,
    stateScope: 'Tamil Nadu',
    status: SchemeStatus.PUBLISHED,
    verificationStatus: VerificationStatus.VERIFIED,
    officialSourceUrl: 'https://tn.gov.in/scholarships/post-matric',
    officialApplicationUrl: 'https://tnedistrict.tn.gov.in',
    applicationMethod: 'ONLINE',
    applicationInstructions: 'Apply via the official e-District portal.',
    officialNotificationTitle: 'G.O. Ms. No. 128 / 2026',
    officialNotificationUrl: null,
    referenceNumber: 'DHE-PMS-2026',
    currentVersion: 1,
    isPublished: true,
    publishedAt: new Date(),
    publishedBy: adminToken,
    lastVerifiedAt: new Date(),
    verifiedBy: verifierToken,
    verificationNotes: 'Verified against official department gazette notification.',
    createdBy: schemeManagerToken,
    updatedBy: adminToken,
    createdAt: new Date(),
    updatedAt: new Date(),
    department: mockDepartment,
    benefits: [
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        benefitType: 'SCHOLARSHIP',
        amount: 25000,
        maxAmount: 50000,
        currency: 'INR',
        frequency: 'ANNUAL',
        duration: 'Duration of course',
        description: 'Annual scholarship and maintenance allowance',
        isVariable: true,
      },
    ],
    documents: [
      {
        id: 'doc-1',
        documentType: 'INCOME_CERTIFICATE',
        name: 'Income Certificate',
        description: 'Issued by competent Revenue Authority within 1 year',
        mandatory: true,
        issuingAuthority: 'Tahsildar / Revenue Department',
        notes: null,
      },
    ],
    applicationPeriods: [
      {
        id: 'ap-1',
        title: 'AY 2026-27 Application Cycle',
        academicYear: '2026-2027',
        financialYear: '2026-2027',
        applicationOpenDate: new Date('2026-08-01'),
        applicationCloseDate: new Date('2026-10-31'),
        status: 'OPEN',
        instructions: null,
      },
    ],
    eligibilityRules: [
      {
        id: 'rule-1',
        ruleGroup: 'DEFAULT',
        field: 'annual_family_income',
        operator: RuleOperator.LESS_THAN_OR_EQUAL,
        value: 250000,
        dataType: RuleDataType.NUMBER,
        mandatory: true,
        description: 'Annual family income must not exceed ₹2,50,000.',
        order: 1,
        logicalOperator: 'AND',
      },
    ],
  };

  describe('Public Scheme Discovery Endpoints', () => {
    it('GET /api/v1/schemes should return published and verified schemes with pagination', async () => {
      vi.spyOn(schemesRepository, 'findPublishedSchemes').mockResolvedValueOnce({
        total: 1,
        schemes: [mockScheme as any],
      });

      const res = await request(app).get('/api/v1/schemes');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe('post-matric-scholarship-tn');
      expect(res.body.meta.pagination.total).toBe(1);
      expect(res.body.data[0].verificationStatus).toBe('VERIFIED');
    });

    it('GET /api/v1/schemes/:idOrSlug should return detailed public view', async () => {
      vi.spyOn(schemesRepository, 'findPublishedSchemeBySlugOrId').mockResolvedValueOnce(
        mockScheme as any,
      );

      const res = await request(app).get('/api/v1/schemes/post-matric-scholarship-tn');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Post-Matric Scholarship Scheme');
      expect(res.body.data.benefits).toHaveLength(1);
      expect(res.body.data.documents).toHaveLength(1);
      expect(res.body.data.eligibilityRequirements).toHaveLength(1);
      expect(res.body.data.eligibilityRequirements[0].description).toContain('₹2,50,000');
    });

    it('GET /api/v1/schemes/:idOrSlug should return 404 for unverified or draft schemes', async () => {
      vi.spyOn(schemesRepository, 'findPublishedSchemeBySlugOrId').mockResolvedValueOnce(null);

      const res = await request(app).get('/api/v1/schemes/draft-unverified-scheme');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('GET /api/v1/schemes/meta/filters should return category and department metadata', async () => {
      vi.spyOn(schemesRepository, 'findDepartments').mockResolvedValueOnce([mockDepartment as any]);

      const res = await request(app).get('/api/v1/schemes/meta/filters');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('programTypes');
      expect(res.body.data).toHaveProperty('categories');
      expect(res.body.data.departments).toHaveLength(1);
    });
  });

  describe('Administrative Role Authorization & Permissions', () => {
    it('POST /api/v1/admin/schemes should reject unauthenticated requests (401)', async () => {
      const res = await request(app).post('/api/v1/admin/schemes').send({});

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/admin/schemes should reject citizen USER role (403)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/schemes')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('POST /api/v1/admin/schemes should allow SCHEME_MANAGER to create a draft scheme', async () => {
      vi.spyOn(schemesRepository, 'findDepartmentById').mockResolvedValueOnce(
        mockDepartment as any,
      );
      vi.spyOn(schemesRepository, 'findSchemeBySlug').mockResolvedValueOnce(null);
      vi.spyOn(schemesRepository, 'createSchemeWithRelations').mockResolvedValueOnce({
        ...mockScheme,
        status: SchemeStatus.DRAFT,
        verificationStatus: VerificationStatus.UNVERIFIED,
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/schemes')
        .set('Authorization', `Bearer ${schemeManagerToken}`)
        .send({
          name: 'Chief Minister Fellowship Program',
          description: 'Prestigious fellowship for graduates to work with state departments.',
          programType: ProgramType.ENTREPRENEURSHIP,
          categories: [SchemeCategory.EDUCATION, SchemeCategory.EMPLOYMENT],
          departmentId: mockDepartment.id,
          officialSourceUrl: 'https://cmfellowship.tn.gov.in',
          benefits: [
            {
              benefitType: BenefitType.FINANCIAL_ASSISTANCE,
              amount: 65000,
              frequency: 'MONTHLY',
              description: 'Monthly fellowship stipend',
            },
          ],
          eligibilityRules: [
            {
              field: 'annual_family_income',
              operator: RuleOperator.LESS_THAN_OR_EQUAL,
              value: 500000,
              dataType: RuleDataType.NUMBER,
              mandatory: true,
              description: 'Income must be within ₹5,00,000.',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SchemeStatus.DRAFT);
    });

    it('POST /api/v1/admin/schemes should reject invalid eligibility rule combinations', async () => {
      const res = await request(app)
        .post('/api/v1/admin/schemes')
        .set('Authorization', `Bearer ${schemeManagerToken}`)
        .send({
          name: 'Invalid Rule Scheme',
          description: 'A scheme with an invalid field operator combination.',
          programType: ProgramType.SCHOLARSHIP,
          categories: [SchemeCategory.EDUCATION],
          departmentId: mockDepartment.id,
          officialSourceUrl: 'https://example.gov.in',
          eligibilityRules: [
            {
              field: 'annual_family_income',
              operator: RuleOperator.CONTAINS, // Invalid: CONTAINS not allowed for numeric income
              value: 'test',
              dataType: RuleDataType.NUMBER,
              mandatory: true,
              description: 'Invalid combination',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Verification & Publishing Lifecycle Workflow', () => {
    it('POST /api/v1/admin/schemes/:id/submit-verification should submit draft for review', async () => {
      vi.spyOn(schemesRepository, 'findSchemeByIdAdmin').mockResolvedValueOnce({
        ...mockScheme,
        status: SchemeStatus.DRAFT,
        verificationStatus: VerificationStatus.UNVERIFIED,
      } as any);

      vi.spyOn(schemesRepository, 'updateSchemeWorkflowState').mockResolvedValueOnce({
        ...mockScheme,
        status: SchemeStatus.PENDING_VERIFICATION,
        verificationStatus: VerificationStatus.PENDING,
      } as any);

      const res = await request(app)
        .post(`/api/v1/admin/schemes/${mockScheme.id}/submit-verification`)
        .set('Authorization', `Bearer ${schemeManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SchemeStatus.PENDING_VERIFICATION);
    });

    it('POST /api/v1/admin/schemes/:id/verify should allow VERIFIER to approve scheme', async () => {
      vi.spyOn(schemesRepository, 'findSchemeByIdAdmin').mockResolvedValueOnce({
        ...mockScheme,
        status: SchemeStatus.PENDING_VERIFICATION,
        verificationStatus: VerificationStatus.PENDING,
      } as any);

      vi.spyOn(schemesRepository, 'updateSchemeWorkflowState').mockResolvedValueOnce({
        ...mockScheme,
        status: SchemeStatus.VERIFIED,
        verificationStatus: VerificationStatus.VERIFIED,
      } as any);

      const res = await request(app)
        .post(`/api/v1/admin/schemes/${mockScheme.id}/verify`)
        .set('Authorization', `Bearer ${verifierToken}`)
        .send({
          verificationNotes: 'Official circular verified from Higher Education Department.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SchemeStatus.VERIFIED);
    });

    it('POST /api/v1/admin/schemes/:id/publish should allow ADMIN to publish verified scheme', async () => {
      vi.spyOn(schemesRepository, 'findSchemeByIdAdmin').mockResolvedValueOnce({
        ...mockScheme,
        status: SchemeStatus.VERIFIED,
        verificationStatus: VerificationStatus.VERIFIED,
      } as any);

      vi.spyOn(schemesRepository, 'updateSchemeWorkflowState').mockResolvedValueOnce({
        ...mockScheme,
        status: SchemeStatus.PUBLISHED,
        isPublished: true,
      } as any);

      const res = await request(app)
        .post(`/api/v1/admin/schemes/${mockScheme.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isPublished).toBe(true);
    });

    it('POST /api/v1/admin/schemes/:id/publish should reject publishing unverified scheme', async () => {
      vi.spyOn(schemesRepository, 'findSchemeByIdAdmin').mockResolvedValueOnce({
        ...mockScheme,
        status: SchemeStatus.DRAFT,
        verificationStatus: VerificationStatus.UNVERIFIED,
      } as any);

      const res = await request(app)
        .post(`/api/v1/admin/schemes/${mockScheme.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('unverified scheme');
    });
  });
});
