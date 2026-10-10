import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { LogicalEvaluator } from '../src/modules/recommendations/engine/logical-evaluator.js';
import { ConditionEvaluator } from '../src/modules/recommendations/engine/condition-evaluator.js';
import { RuleEngineService } from '../src/modules/recommendations/engine/rule-engine.service.js';
import { RuleOperator, RuleDataType, UserRole, UserStatus } from '@prisma/client';
import { recommendationService } from '../src/modules/recommendations/recommendations.service.js';
import { generateAccessToken } from '../src/modules/auth/auth.utils.js';
import { NotFoundError } from '../src/errors/app-error.js';

describe('Module 4: Recommendation Engine Unit & Integration Tests', () => {
  const app = createApp();

  const citizenToken = generateAccessToken({
    userId: '11111111-1111-4111-a111-111111111111',
    email: 'citizen@example.com',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });
  const otherCitizenToken = generateAccessToken({
    userId: '22222222-2222-4222-a222-222222222222',
    email: 'other@example.com',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // 1. THREE-STATE BOOLEAN LOGIC TESTS (Section 16 & Section 100)
  // ============================================================================
  describe('Three-State Logic Matrix (LogicalEvaluator)', () => {
    it('evaluates AND conjunctions correctly', () => {
      expect(LogicalEvaluator.and(['TRUE', 'TRUE'])).toBe('TRUE');
      expect(LogicalEvaluator.and(['TRUE', 'FALSE'])).toBe('FALSE');
      expect(LogicalEvaluator.and(['FALSE', 'UNKNOWN'])).toBe('FALSE'); // Absorptive
      expect(LogicalEvaluator.and(['TRUE', 'UNKNOWN'])).toBe('UNKNOWN');
      expect(LogicalEvaluator.and(['UNKNOWN', 'UNKNOWN'])).toBe('UNKNOWN');
    });

    it('evaluates OR disjunctions correctly', () => {
      expect(LogicalEvaluator.or(['TRUE', 'TRUE'])).toBe('TRUE');
      expect(LogicalEvaluator.or(['TRUE', 'FALSE'])).toBe('TRUE'); // Absorptive
      expect(LogicalEvaluator.or(['TRUE', 'UNKNOWN'])).toBe('TRUE'); // Absorptive
      expect(LogicalEvaluator.or(['FALSE', 'UNKNOWN'])).toBe('UNKNOWN');
      expect(LogicalEvaluator.or(['FALSE', 'FALSE'])).toBe('FALSE');
      expect(LogicalEvaluator.or(['UNKNOWN', 'UNKNOWN'])).toBe('UNKNOWN');
    });

    it('evaluates NOT negation correctly', () => {
      expect(LogicalEvaluator.not('TRUE')).toBe('FALSE');
      expect(LogicalEvaluator.not('FALSE')).toBe('TRUE');
      expect(LogicalEvaluator.not('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  // ============================================================================
  // 2. CONDITION EVALUATOR & OPERATORS (Section 10 & 99)
  // ============================================================================
  describe('ConditionEvaluator Operator Tests', () => {
    it('evaluates numeric operators (LTE, GTE, BETWEEN)', () => {
      const facts = {
        annual_family_income: { value: 200000, state: 'KNOWN' as const },
        academic_percentage: { value: 75, state: 'KNOWN' as const },
        age: { value: 21, state: 'KNOWN' as const },
      };

      // Income LTE 250000 -> MATCH
      const incomeRule = {
        id: 'r1',
        field: 'annual_family_income',
        operator: RuleOperator.LESS_THAN_OR_EQUAL,
        value: 250000,
        dataType: RuleDataType.NUMBER,
        mandatory: true,
        description: 'Income <= 250000',
      };
      expect(ConditionEvaluator.evaluate(incomeRule, facts).result).toBe('MATCH');

      // Marks GTE 60 -> MATCH
      const marksRule = {
        id: 'r2',
        field: 'academic_percentage',
        operator: RuleOperator.GREATER_THAN_OR_EQUAL,
        value: 60,
        dataType: RuleDataType.NUMBER,
        mandatory: true,
        description: 'Marks >= 60',
      };
      expect(ConditionEvaluator.evaluate(marksRule, facts).result).toBe('MATCH');

      // Age BETWEEN 18 and 25 -> MATCH (inclusive boundary)
      const ageRule = {
        id: 'r3',
        field: 'age',
        operator: RuleOperator.BETWEEN,
        value: [18, 25],
        dataType: RuleDataType.NUMBER,
        mandatory: true,
        description: 'Age between 18 and 25',
      };
      expect(ConditionEvaluator.evaluate(ageRule, facts).result).toBe('MATCH');
    });

    it('evaluates list operators (IN, NOT_IN) with case-insensitive normalization', () => {
      const facts = {
        state: { value: 'Tamil Nadu', state: 'KNOWN' as const },
        category: { value: 'OBC', state: 'KNOWN' as const },
      };

      const stateRule = {
        id: 'r4',
        field: 'state',
        operator: RuleOperator.IN,
        value: ['TAMIL NADU', 'KERALA', 'KARNATAKA'],
        dataType: RuleDataType.STRING,
        mandatory: true,
        description: 'State IN South Zone',
      };
      expect(ConditionEvaluator.evaluate(stateRule, facts).result).toBe('MATCH');

      const catRule = {
        id: 'r5',
        field: 'category',
        operator: RuleOperator.NOT_IN,
        value: ['GENERAL'],
        dataType: RuleDataType.STRING,
        mandatory: true,
        description: 'Category NOT IN General',
      };
      expect(ConditionEvaluator.evaluate(catRule, facts).result).toBe('MATCH');
    });

    it('yields UNKNOWN when required fact is missing in user profile (Section 8 & 52)', () => {
      const facts = {
        state: { value: 'Tamil Nadu', state: 'KNOWN' as const },
        disability_status: { value: null, state: 'UNKNOWN' as const },
      };

      const disabilityRule = {
        id: 'r6',
        field: 'disability_status',
        operator: RuleOperator.EQUALS,
        value: true,
        dataType: RuleDataType.BOOLEAN,
        mandatory: true,
        description: 'Must be person with disability',
      };

      const result = ConditionEvaluator.evaluate(disabilityRule, facts);
      expect(result.result).toBe('UNKNOWN');
      expect(result.actualValue).toBeNull();
      expect(result.explanation).toContain('does not provide information');
    });
  });

  // ============================================================================
  // 3. COMPLETE SCENARIOS (Section 101 & Section 147)
  // ============================================================================
  describe('Deterministic Scenario Matrix (Section 101 & 147)', () => {
    it('Scenario A: User satisfies all mandatory conditions -> ELIGIBLE', () => {
      const facts = {
        annual_family_income: { value: 200000, state: 'KNOWN' as const },
        academic_percentage: { value: 82, state: 'KNOWN' as const },
        state: { value: 'Tamil Nadu', state: 'KNOWN' as const },
      };

      const rules = [
        {
          id: '1',
          field: 'annual_family_income',
          operator: RuleOperator.LESS_THAN_OR_EQUAL,
          value: 250000,
          dataType: RuleDataType.NUMBER,
          mandatory: true,
          description: 'Income <= 250000',
        },
        {
          id: '2',
          field: 'academic_percentage',
          operator: RuleOperator.GREATER_THAN_OR_EQUAL,
          value: 60,
          dataType: RuleDataType.NUMBER,
          mandatory: true,
          description: 'Marks >= 60',
        },
        {
          id: '3',
          field: 'state',
          operator: RuleOperator.EQUALS,
          value: 'Tamil Nadu',
          dataType: RuleDataType.STRING,
          mandatory: true,
          description: 'State = Tamil Nadu',
        },
      ];

      const evaluation = RuleEngineService.evaluate(rules, facts);
      expect(evaluation.eligibilityStatus).toBe('ELIGIBLE');
      expect(evaluation.matchedCount).toBe(3);
      expect(evaluation.failedCount).toBe(0);
      expect(evaluation.unknownCount).toBe(0);
      expect(evaluation.missingInformation).toHaveLength(0);
    });

    it('Scenario B: Mandatory condition fails (Income exceeds ceiling) -> NOT_ELIGIBLE', () => {
      const facts = {
        annual_family_income: { value: 400000, state: 'KNOWN' as const },
        academic_percentage: { value: 82, state: 'KNOWN' as const },
        state: { value: 'Tamil Nadu', state: 'KNOWN' as const },
      };

      const rules = [
        {
          id: '1',
          field: 'annual_family_income',
          operator: RuleOperator.LESS_THAN_OR_EQUAL,
          value: 250000,
          dataType: RuleDataType.NUMBER,
          mandatory: true,
          description: 'Income <= 250000',
        },
        {
          id: '2',
          field: 'academic_percentage',
          operator: RuleOperator.GREATER_THAN_OR_EQUAL,
          value: 60,
          dataType: RuleDataType.NUMBER,
          mandatory: true,
          description: 'Marks >= 60',
        },
        {
          id: '3',
          field: 'state',
          operator: RuleOperator.EQUALS,
          value: 'Tamil Nadu',
          dataType: RuleDataType.STRING,
          mandatory: true,
          description: 'State = Tamil Nadu',
        },
      ];

      const evaluation = RuleEngineService.evaluate(rules, facts);
      expect(evaluation.eligibilityStatus).toBe('NOT_ELIGIBLE');
      expect(evaluation.matchedCount).toBe(2);
      expect(evaluation.failedCount).toBe(1);
      expect(evaluation.failedConditions[0].field).toBe('annual_family_income');
      expect(evaluation.failedConditions[0].explanation).toContain(
        'exceeds the permissible ceiling',
      );
    });

    it('Scenario C: Mandatory condition unknown (Disability missing) -> NEEDS_VERIFICATION', () => {
      const facts = {
        annual_family_income: { value: 200000, state: 'KNOWN' as const },
        academic_percentage: { value: 82, state: 'KNOWN' as const },
        state: { value: 'Tamil Nadu', state: 'KNOWN' as const },
        disability_status: { value: null, state: 'UNKNOWN' as const },
      };

      const rules = [
        {
          id: '1',
          field: 'annual_family_income',
          operator: RuleOperator.LESS_THAN_OR_EQUAL,
          value: 250000,
          dataType: RuleDataType.NUMBER,
          mandatory: true,
          description: 'Income <= 250000',
        },
        {
          id: '2',
          field: 'academic_percentage',
          operator: RuleOperator.GREATER_THAN_OR_EQUAL,
          value: 60,
          dataType: RuleDataType.NUMBER,
          mandatory: true,
          description: 'Marks >= 60',
        },
        {
          id: '3',
          field: 'disability_status',
          operator: RuleOperator.EQUALS,
          value: true,
          dataType: RuleDataType.BOOLEAN,
          mandatory: true,
          description: 'Disability = true',
        },
      ];

      const evaluation = RuleEngineService.evaluate(rules, facts);
      expect(evaluation.eligibilityStatus).toBe('NEEDS_VERIFICATION');
      expect(evaluation.matchedCount).toBe(2);
      expect(evaluation.unknownCount).toBe(1);
      expect(evaluation.missingInformation).toHaveLength(1);
      expect(evaluation.missingInformation[0].field).toBe('disability_status');
    });

    it('Scenario D: Versioning Consistency (Section 103)', () => {
      const facts = {
        annual_family_income: { value: 225000, state: 'KNOWN' as const },
      };

      // Version 1: Income <= 200000 -> NOT_ELIGIBLE
      const v1Rules = [
        {
          id: 'v1-r1',
          field: 'annual_family_income',
          operator: RuleOperator.LESS_THAN_OR_EQUAL,
          value: 200000,
          dataType: RuleDataType.NUMBER,
          mandatory: true,
          description: 'Version 1 ceiling',
        },
      ];
      expect(RuleEngineService.evaluate(v1Rules, facts).eligibilityStatus).toBe('NOT_ELIGIBLE');

      // Version 2: Income <= 250000 -> ELIGIBLE
      const v2Rules = [
        {
          id: 'v2-r1',
          field: 'annual_family_income',
          operator: RuleOperator.LESS_THAN_OR_EQUAL,
          value: 250000,
          dataType: RuleDataType.NUMBER,
          mandatory: true,
          description: 'Version 2 revised ceiling',
        },
      ];
      expect(RuleEngineService.evaluate(v2Rules, facts).eligibilityStatus).toBe('ELIGIBLE');
    });
  });

  // ============================================================================
  // 4. API & AUTHORIZATION TESTS (Section 38, 40, 106)
  // ============================================================================
  describe('Recommendation API Endpoints & Security', () => {
    it('GET /api/v1/recommendations requires authentication (401)', async () => {
      const res = await request(app).get('/api/v1/recommendations');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/recommendations returns 200 with deterministic recommendations', async () => {
      const mockCards = [
        {
          id: 'rec-1',
          schemeId: 'scheme-1',
          schemeName: 'Post-Matric Scholarship',
          slug: 'post-matric-scholarship',
          shortDescription: 'Scholarship description',
          programType: 'SCHOLARSHIP',
          categories: ['EDUCATION'],
          departmentName: 'Backward Classes Welfare',
          stateScope: 'Tamil Nadu',
          primaryBenefit: {
            type: 'SCHOLARSHIP',
            amount: 25000,
            frequency: 'ANNUAL',
            description: 'Annual allowance',
          },
          eligibilityStatus: 'ELIGIBLE',
          applicationStatus: 'OPEN',
          isExpiringSoon: false,
          deadline: '2026-10-31T00:00:00.000Z',
          matchedCount: 3,
          failedCount: 0,
          unknownCount: 0,
          summary: 'All requirements satisfied.',
          missingFields: [],
          schemeVersionNumber: 1,
          evaluatedAt: '2026-09-26T00:00:00.000Z',
        },
      ];

      vi.spyOn(recommendationService, 'getUserRecommendations').mockResolvedValueOnce({
        items: mockCards as any,
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const res = await request(app)
        .get('/api/v1/recommendations')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].eligibilityStatus).toBe('ELIGIBLE');
      expect(res.body.meta.pagination.total).toBe(1);
    });

    it('GET /api/v1/recommendations/:id enforces strict user isolation (404 / access denied)', async () => {
      vi.spyOn(recommendationService, 'getRecommendationDetail').mockRejectedValueOnce(
        new NotFoundError('Recommendation record not found or access denied.'),
      );

      const res = await request(app)
        .get('/api/v1/recommendations/33333333-3333-4333-a333-333333333333')
        .set('Authorization', `Bearer ${otherCitizenToken}`);

      // Cannot access another user's recommendation record
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/recommendations/refresh re-evaluates citizen profile', async () => {
      vi.spyOn(recommendationService, 'refreshUserRecommendations').mockResolvedValueOnce({
        totalSchemesEvaluated: 15,
        eligibleCount: 8,
        likelyEligibleCount: 2,
        needsVerificationCount: 3,
        notEligibleCount: 2,
        refreshedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/recommendations/refresh')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eligibleCount).toBe(8);
      expect(res.body.data.totalSchemesEvaluated).toBe(15);
    });
  });
});
