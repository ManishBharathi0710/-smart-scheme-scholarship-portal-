import { z } from 'zod';
import {
  ProgramType,
  SchemeCategory,
  SchemeStatus,
  VerificationStatus,
  DepartmentLevel,
  ApplicationMethod,
  ApplicationCycleStatus,
  BenefitType,
  BenefitFrequency,
  RuleOperator,
  RuleDataType,
  RULE_FIELD_CATALOG,
} from './schemes.constants.js';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(3, 'Department name must be at least 3 characters').max(200),
  shortName: z.string().trim().max(50).optional(),
  level: z.nativeEnum(DepartmentLevel).default(DepartmentLevel.STATE),
  state: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  officialWebsite: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .max(500)
    .optional()
    .or(z.literal('')),
});

export const benefitInputSchema = z.object({
  benefitType: z.nativeEnum(BenefitType),
  amount: z.number().nonnegative('Benefit amount cannot be negative').optional().nullable(),
  maxAmount: z.number().nonnegative().optional().nullable(),
  currency: z.string().default('INR'),
  frequency: z.nativeEnum(BenefitFrequency).default(BenefitFrequency.ANNUAL),
  duration: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  isVariable: z.boolean().default(false),
});

export const documentRequirementInputSchema = z.object({
  documentType: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2, 'Document name is required').max(150),
  description: z.string().trim().max(500).optional().nullable(),
  mandatory: z.boolean().default(true),
  issuingAuthority: z.string().trim().max(150).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const applicationPeriodInputSchema = z
  .object({
    title: z.string().trim().min(3, 'Cycle title is required').max(150),
    academicYear: z.string().trim().max(50).optional().nullable(),
    financialYear: z.string().trim().max(50).optional().nullable(),
    applicationOpenDate: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
      .optional()
      .nullable(),
    applicationCloseDate: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
      .optional()
      .nullable(),
    status: z.nativeEnum(ApplicationCycleStatus).default(ApplicationCycleStatus.OPEN),
    instructions: z.string().trim().max(1000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.applicationOpenDate && data.applicationCloseDate) {
        return new Date(data.applicationOpenDate) <= new Date(data.applicationCloseDate);
      }
      return true;
    },
    {
      message: 'Application closing date must be on or after the opening date',
      path: ['applicationCloseDate'],
    },
  );

export const eligibilityRuleInputSchema = z
  .object({
    ruleGroup: z.string().trim().max(50).default('DEFAULT'),
    field: z.string().trim().min(1, 'Rule field is required'),
    operator: z.nativeEnum(RuleOperator),
    value: z.unknown(),
    dataType: z.nativeEnum(RuleDataType).default(RuleDataType.STRING),
    mandatory: z.boolean().default(true),
    description: z.string().trim().min(3, 'Rule description is required').max(500),
    order: z.number().int().default(0),
    logicalOperator: z.enum(['AND', 'OR']).default('AND'),
  })
  .refine(
    (rule) => {
      // Validate field is within controlled catalog
      const catalogEntry = RULE_FIELD_CATALOG[rule.field];
      if (!catalogEntry) {
        return false;
      }
      // Validate operator is compatible with field
      return catalogEntry.allowedOperators.includes(rule.operator);
    },
    {
      message:
        'Field must be a valid profile attribute and operator must be compatible with the field data type',
      path: ['operator'],
    },
  );

export const createSchemeSchema = z.object({
  name: z.string().trim().min(5, 'Scheme name must be at least 5 characters').max(255),
  shortName: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().min(20, 'Detailed description must be at least 20 characters'),
  shortDescription: z.string().trim().max(500).optional().nullable(),
  programType: z.nativeEnum(ProgramType),
  categories: z.array(z.nativeEnum(SchemeCategory)).min(1, 'At least one category is required'),
  departmentId: z.string().uuid('Valid department ID is required'),
  ministry: z.string().trim().max(200).optional().nullable(),
  stateScope: z.string().trim().max(100).default('ALL_INDIA'),
  officialSourceUrl: z.string().trim().url('Official source URL must be a valid URL').max(500),
  officialApplicationUrl: z
    .string()
    .trim()
    .url('Official application URL must be a valid URL')
    .max(500)
    .optional()
    .nullable()
    .or(z.literal('')),
  applicationMethod: z.nativeEnum(ApplicationMethod).default(ApplicationMethod.ONLINE),
  applicationInstructions: z.string().trim().max(2000).optional().nullable(),
  officialNotificationTitle: z.string().trim().max(255).optional().nullable(),
  officialNotificationUrl: z
    .string()
    .trim()
    .url('Notification URL must be a valid URL')
    .max(500)
    .optional()
    .nullable()
    .or(z.literal('')),
  referenceNumber: z.string().trim().max(100).optional().nullable(),
  benefits: z.array(benefitInputSchema).default([]),
  documents: z.array(documentRequirementInputSchema).default([]),
  applicationPeriods: z.array(applicationPeriodInputSchema).default([]),
  eligibilityRules: z.array(eligibilityRuleInputSchema).default([]),
});

export const updateSchemeSchema = createSchemeSchema.partial().extend({
  changeSummary: z.string().trim().min(3, 'Summary of changes is required for versioning').max(500),
});

export const verifySchemeSchema = z.object({
  verificationNotes: z
    .string()
    .trim()
    .min(5, 'Verification notes citing official department checks are required')
    .max(1000),
});

export const rejectSchemeSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(5, 'Rejection reason is required so the scheme manager can correct it')
    .max(1000),
});

export const schemeQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().optional(),
    q: z.string().trim().optional(),
    category: z.nativeEnum(SchemeCategory).optional(),
    programType: z.nativeEnum(ProgramType).optional(),
    state: z.string().trim().optional(),
    departmentId: z.string().uuid().optional(),
    status: z.nativeEnum(SchemeStatus).optional(),
    verificationStatus: z.nativeEnum(VerificationStatus).optional(),
    applicationStatus: z.nativeEnum(ApplicationCycleStatus).optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'lastVerifiedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .transform((data) => ({
    ...data,
    pageSize: data.limit ?? data.pageSize,
    search: data.q ?? data.search,
  }));

export const compareSchemesQuerySchema = z.object({
  ids: z
    .string()
    .min(1, 'At least one scheme ID is required')
    .transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .refine((arr) => arr.length >= 1 && arr.length <= 4, {
      message: 'You can compare between 1 and 4 schemes at a time',
    }),
});

export const compareSchemesBodySchema = z.object({
  schemeIds: z
    .array(z.string().uuid('Valid scheme ID required'))
    .min(1, 'Select at least 1 scheme to compare')
    .max(4, 'You can compare up to 4 schemes at a time'),
});
