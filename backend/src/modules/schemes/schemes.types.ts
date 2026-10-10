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
} from './schemes.constants.js';

export interface DepartmentDto {
  id: string;
  name: string;
  shortName?: string | null;
  level: DepartmentLevel;
  state?: string | null;
  description?: string | null;
  officialWebsite?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BenefitDto {
  id?: string;
  benefitType: BenefitType;
  amount?: number | null;
  maxAmount?: number | null;
  currency?: string;
  frequency: BenefitFrequency;
  duration?: string | null;
  description?: string | null;
  isVariable?: boolean;
}

export interface DocumentRequirementDto {
  id?: string;
  documentType: string;
  name: string;
  description?: string | null;
  mandatory: boolean;
  issuingAuthority?: string | null;
  notes?: string | null;
}

export interface ApplicationPeriodDto {
  id?: string;
  title: string;
  academicYear?: string | null;
  financialYear?: string | null;
  applicationOpenDate?: string | Date | null;
  applicationCloseDate?: string | Date | null;
  status: ApplicationCycleStatus;
  instructions?: string | null;
}

export interface EligibilityRuleDto {
  id?: string;
  ruleGroup?: string | null;
  field: string;
  operator: RuleOperator;
  value: unknown;
  dataType: RuleDataType;
  mandatory: boolean;
  description: string;
  order?: number;
  logicalOperator?: string;
}

export interface SchemeVersionDto {
  id: string;
  schemeId: string;
  versionNumber: number;
  effectiveFrom: Date;
  effectiveUntil?: Date | null;
  changeSummary: string;
  snapshot: Record<string, unknown>;
  createdBy?: string | null;
  createdAt: Date;
}

/**
 * Public Scheme Summary Card (Lightweight for Catalog & Discovery)
 */
export interface PublicSchemeCard {
  id: string;
  slug: string;
  name: string;
  shortName?: string | null;
  shortDescription?: string | null;
  programType: ProgramType;
  categories: SchemeCategory[];
  departmentName: string;
  departmentLevel: DepartmentLevel;
  stateScope: string;
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: Date | null;
  primaryBenefit?: {
    type: BenefitType;
    amount?: number | null;
    frequency: BenefitFrequency;
    description?: string | null;
  } | null;
  activeApplicationPeriod?: {
    title: string;
    openDate?: Date | null;
    closeDate?: Date | null;
    status: ApplicationCycleStatus;
  } | null;
  applicationMethod: ApplicationMethod;
  isSaved?: boolean;
  userRecommendationStatus?: string | null;
}

/**
 * Public Detailed Scheme Specification
 */
export interface PublicSchemeDetail {
  id: string;
  slug: string;
  name: string;
  shortName?: string | null;
  description: string;
  shortDescription?: string | null;
  programType: ProgramType;
  categories: SchemeCategory[];
  department: DepartmentDto;
  ministry?: string | null;
  stateScope: string;
  status: SchemeStatus;
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: Date | null;
  officialSourceUrl: string;
  officialApplicationUrl?: string | null;
  applicationMethod: ApplicationMethod;
  applicationInstructions?: string | null;
  officialNotificationTitle?: string | null;
  officialNotificationUrl?: string | null;
  referenceNumber?: string | null;
  benefits: BenefitDto[];
  documents: DocumentRequirementDto[];
  applicationPeriods: ApplicationPeriodDto[];
  eligibilityRequirements: {
    field: string;
    operator: RuleOperator;
    description: string;
    mandatory: boolean;
  }[];
  isPublished: boolean;
  publishedAt?: Date | null;
  updatedAt: Date;
  isSaved?: boolean;
  userRecommendation?: {
    status: string;
    matchingRequirements: string[];
    missingRequirements: string[];
    uncertainRequirements: string[];
    evaluatedAt: Date;
  } | null;
}

export interface SchemeComparisonColumn {
  id: string;
  slug: string;
  name: string;
  shortName?: string | null;
  programType: ProgramType;
  categories: SchemeCategory[];
  departmentName: string;
  departmentLevel: DepartmentLevel;
  geographicScope: string;
  benefitsSummary: string[];
  applicationStatus: ApplicationCycleStatus | 'UNKNOWN';
  applicationOpenDate?: Date | null;
  applicationCloseDate?: Date | null;
  requiredDocuments: string[];
  applicationMethod: ApplicationMethod;
  officialApplicationUrl?: string | null;
  officialSourceUrl: string;
  isSaved?: boolean;
  userEligibility?: {
    status: string;
    evaluatedAt: Date;
    missingRequirements: string[];
  } | null;
}

export interface SchemeComparisonResponse {
  comparedCount: number;
  maxAllowed: number;
  schemes: SchemeComparisonColumn[];
}

/**
 * Complete Administrative Scheme Record
 */
export interface AdminSchemeRecord extends PublicSchemeDetail {
  currentVersion: number;
  publishedBy?: string | null;
  verifiedBy?: string | null;
  verificationNotes?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  rawRules: EligibilityRuleDto[];
}

export interface CreateSchemeInput {
  name: string;
  shortName?: string | null;
  description: string;
  shortDescription?: string | null;
  programType: ProgramType;
  categories: SchemeCategory[];
  departmentId: string;
  ministry?: string | null;
  stateScope?: string;
  officialSourceUrl: string;
  officialApplicationUrl?: string | null;
  applicationMethod?: ApplicationMethod;
  applicationInstructions?: string | null;
  officialNotificationTitle?: string | null;
  officialNotificationUrl?: string | null;
  referenceNumber?: string | null;
  benefits?: BenefitDto[];
  documents?: DocumentRequirementDto[];
  applicationPeriods?: ApplicationPeriodDto[];
  eligibilityRules?: EligibilityRuleDto[];
}

export interface UpdateSchemeInput extends Partial<CreateSchemeInput> {
  changeSummary: string;
}

export interface CreateDepartmentInput {
  name: string;
  shortName?: string | null;
  level?: DepartmentLevel;
  state?: string | null;
  description?: string | null;
  officialWebsite?: string | null;
}

/**
 * Filter and Search Query Parameters
 */
export interface SchemeFilterQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: SchemeCategory;
  programType?: ProgramType;
  state?: string;
  departmentId?: string;
  status?: SchemeStatus;
  verificationStatus?: VerificationStatus;
  applicationStatus?: ApplicationCycleStatus;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastVerifiedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Module 4 Recommendation Engine Integration Contract
 * Exposes pure, structured scheme requirements without leaky database details.
 */
export interface SchemeRecommendationContract {
  schemeId: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  departmentName: string;
  versionId: string;
  versionNumber: number;
  programType: ProgramType;
  categories: SchemeCategory[];
  stateScope: string;
  status: SchemeStatus;
  verificationStatus: VerificationStatus;
  isPublished: boolean;
  applicationPeriodStatus: ApplicationCycleStatus;
  activePeriod?: {
    openDate: Date | null;
    closeDate: Date | null;
    status: ApplicationCycleStatus;
  } | null;
  rules: {
    id: string;
    field: string;
    operator: RuleOperator;
    value: unknown;
    dataType: RuleDataType;
    mandatory: boolean;
    description: string;
    ruleGroup?: string | null;
  }[];
  benefits: BenefitDto[];
  requiredDocumentTypes: string[];
}
