export type ProgramType =
  | 'SCHOLARSHIP'
  | 'WELFARE_SCHEME'
  | 'SUBSIDY'
  | 'LOAN'
  | 'INSURANCE'
  | 'PENSION'
  | 'TRAINING'
  | 'EMPLOYMENT'
  | 'ENTREPRENEURSHIP'
  | 'HEALTHCARE'
  | 'HOUSING'
  | 'AGRICULTURE'
  | 'EDUCATION'
  | 'OTHER';

export type SchemeCategory =
  | 'EDUCATION'
  | 'AGRICULTURE'
  | 'EMPLOYMENT'
  | 'HEALTH'
  | 'HOUSING'
  | 'FINANCIAL_ASSISTANCE'
  | 'ENTREPRENEURSHIP'
  | 'SOCIAL_SECURITY'
  | 'SKILL_DEVELOPMENT'
  | 'WOMEN'
  | 'CHILDREN'
  | 'SENIOR_CITIZENS'
  | 'PERSONS_WITH_DISABILITIES'
  | 'STUDENT_SUPPORT'
  | 'OTHER';

export type SchemeStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'PUBLISHED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'DISCONTINUED'
  | 'ARCHIVED';

export type VerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'NEEDS_REVIEW';

export type DepartmentLevel =
  | 'CENTRAL'
  | 'STATE'
  | 'DISTRICT'
  | 'LOCAL'
  | 'INSTITUTIONAL'
  | 'OTHER';

export type ApplicationMethod =
  | 'ONLINE'
  | 'OFFLINE'
  | 'ONLINE_AND_OFFLINE'
  | 'THROUGH_INSTITUTION'
  | 'THROUGH_DEPARTMENT'
  | 'OTHER';

export type ApplicationCycleStatus = 'OPEN' | 'CLOSED' | 'UPCOMING' | 'EXTENDED';

export type BenefitType =
  | 'SCHOLARSHIP'
  | 'SUBSIDY'
  | 'LOAN'
  | 'INSURANCE'
  | 'PENSION'
  | 'FEE_REIMBURSEMENT'
  | 'EQUIPMENT'
  | 'FINANCIAL_ASSISTANCE'
  | 'SKILL_TRAINING'
  | 'OTHER';

export type BenefitFrequency =
  | 'ONE_TIME'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'PER_SEMESTER'
  | 'AS_PER_NORMS';

export type RuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'IN'
  | 'NOT_IN'
  | 'BETWEEN'
  | 'CONTAINS'
  | 'EXISTS'
  | 'NOT_EXISTS';

export type RuleDataType = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'ARRAY';

export interface Department {
  id: string;
  name: string;
  shortName?: string | null;
  level: DepartmentLevel;
  state?: string | null;
  description?: string | null;
  officialWebsite?: string | null;
}

export interface BenefitItem {
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

export interface DocumentRequirementItem {
  id?: string;
  documentType: string;
  name: string;
  description?: string | null;
  mandatory: boolean;
  issuingAuthority?: string | null;
  notes?: string | null;
}

export interface ApplicationPeriodItem {
  id?: string;
  title: string;
  academicYear?: string | null;
  financialYear?: string | null;
  applicationOpenDate?: string | null;
  applicationCloseDate?: string | null;
  status: ApplicationCycleStatus;
  instructions?: string | null;
}

export interface EligibilityRuleItem {
  id?: string;
  ruleGroup?: string | null;
  field: string;
  operator: RuleOperator;
  value: unknown;
  dataType: RuleDataType;
  mandatory: boolean;
  description: string;
  order?: number;
  logicalOperator?: 'AND' | 'OR';
}

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
  lastVerifiedAt?: string | null;
  primaryBenefit?: {
    type: BenefitType | string;
    amount?: number | null;
    frequency?: BenefitFrequency | string | null;
    description?: string | null;
  } | null;
  activeApplicationPeriod?: {
    title: string;
    openDate?: string | null;
    closeDate?: string | null;
    status: ApplicationCycleStatus;
  } | null;
  applicationMethod: ApplicationMethod;
  isSaved?: boolean;
  userRecommendationStatus?: string | null;
}

export interface PublicSchemeDetail {
  id: string;
  slug: string;
  name: string;
  shortName?: string | null;
  description: string;
  shortDescription?: string | null;
  programType: ProgramType;
  categories: SchemeCategory[];
  department: Department;
  ministry?: string | null;
  stateScope: string;
  status: SchemeStatus;
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: string | null;
  officialSourceUrl: string;
  officialApplicationUrl?: string | null;
  applicationMethod: ApplicationMethod;
  applicationInstructions?: string | null;
  officialNotificationTitle?: string | null;
  officialNotificationUrl?: string | null;
  referenceNumber?: string | null;
  benefits: BenefitItem[];
  documents: DocumentRequirementItem[];
  applicationPeriods: ApplicationPeriodItem[];
  eligibilityRequirements: {
    field: string;
    operator: RuleOperator;
    description: string;
    mandatory: boolean;
  }[];
  isPublished: boolean;
  publishedAt?: string | null;
  updatedAt: string;
  isSaved?: boolean;
  userRecommendation?: {
    status: string;
    matchingRequirements: string[];
    missingRequirements: string[];
    uncertainRequirements: string[];
    evaluatedAt: string;
  } | null;
}

export interface AdminSchemeRecord extends PublicSchemeDetail {
  currentVersion: number;
  publishedBy?: string | null;
  verifiedBy?: string | null;
  verificationNotes?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  rawRules: EligibilityRuleItem[];
  versions?: {
    id: string;
    versionNumber: number;
    effectiveFrom: string;
    changeSummary: string;
  }[];
}

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

export interface FilterMetadata {
  programTypes: ProgramType[];
  categories: SchemeCategory[];
  departments: {
    id: string;
    name: string;
    shortName?: string | null;
    level: DepartmentLevel;
  }[];
}

export interface RuleCatalogEntry {
  field: string;
  label: string;
  category: 'PERSONAL' | 'LOCATION' | 'EDUCATION' | 'FINANCIAL' | 'SOCIAL' | 'OCCUPATION';
  dataType: RuleDataType;
  allowedOperators: RuleOperator[];
  description: string;
}

export const RULE_FIELD_CATALOG: Record<string, RuleCatalogEntry> = {
  age: {
    field: 'age',
    label: 'Citizen Age (Years)',
    category: 'PERSONAL',
    dataType: 'NUMBER',
    allowedOperators: [
      'EQUALS',
      'GREATER_THAN',
      'GREATER_THAN_OR_EQUAL',
      'LESS_THAN',
      'LESS_THAN_OR_EQUAL',
      'BETWEEN',
    ],
    description: 'Applicant age in full years.',
  },
  gender: {
    field: 'gender',
    label: 'Gender',
    category: 'PERSONAL',
    dataType: 'STRING',
    allowedOperators: ['EQUALS', 'IN', 'NOT_IN'],
    description: 'Target gender (MALE, FEMALE, TRANSGENDER).',
  },
  state: {
    field: 'state',
    label: 'State / Domicile',
    category: 'LOCATION',
    dataType: 'STRING',
    allowedOperators: ['EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN'],
    description: 'State of permanent residence.',
  },
  district: {
    field: 'district',
    label: 'Resident District',
    category: 'LOCATION',
    dataType: 'STRING',
    allowedOperators: ['EQUALS', 'IN', 'NOT_IN'],
    description: 'Specific district for localized welfare schemes.',
  },
  area_type: {
    field: 'area_type',
    label: 'Area Type (Rural / Urban)',
    category: 'LOCATION',
    dataType: 'STRING',
    allowedOperators: ['EQUALS', 'IN'],
    description: 'Rural, Urban, or Semi-Urban classification.',
  },
  annual_family_income: {
    field: 'annual_family_income',
    label: 'Annual Family Income (₹)',
    category: 'FINANCIAL',
    dataType: 'NUMBER',
    allowedOperators: [
      'LESS_THAN',
      'LESS_THAN_OR_EQUAL',
      'BETWEEN',
      'EQUALS',
    ],
    description: 'Parental/family annual income ceiling.',
  },
  bpl_card_holder: {
    field: 'bpl_card_holder',
    label: 'BPL Card Holder (Yes/No)',
    category: 'FINANCIAL',
    dataType: 'BOOLEAN',
    allowedOperators: ['EQUALS'],
    description: 'Possession of valid BPL / Antyodaya card.',
  },
  education_level: {
    field: 'education_level',
    label: 'Education Level',
    category: 'EDUCATION',
    dataType: 'STRING',
    allowedOperators: ['EQUALS', 'IN', 'NOT_IN'],
    description: 'Level of study (Undergraduate, Postgraduate, Diploma, School).',
  },
  institution_type: {
    field: 'institution_type',
    label: 'Institution Type',
    category: 'EDUCATION',
    dataType: 'STRING',
    allowedOperators: ['EQUALS', 'IN'],
    description: 'Government, Government-Aided, or Private.',
  },
  year_of_study: {
    field: 'year_of_study',
    label: 'Current Year of Study',
    category: 'EDUCATION',
    dataType: 'NUMBER',
    allowedOperators: [
      'EQUALS',
      'GREATER_THAN_OR_EQUAL',
      'LESS_THAN_OR_EQUAL',
      'IN',
    ],
    description: '1st, 2nd, 3rd, or 4th year student.',
  },
  academic_percentage: {
    field: 'academic_percentage',
    label: 'Minimum Qualifying Marks (%)',
    category: 'EDUCATION',
    dataType: 'NUMBER',
    allowedOperators: ['GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'BETWEEN'],
    description: 'Minimum marks obtained in previous examinations.',
  },
  category: {
    field: 'category',
    label: 'Social Reservation Category',
    category: 'SOCIAL',
    dataType: 'STRING',
    allowedOperators: ['EQUALS', 'IN', 'NOT_IN'],
    description: 'General, OBC, SC, ST, EWS.',
  },
  minority_status: {
    field: 'minority_status',
    label: 'Minority Community Member',
    category: 'SOCIAL',
    dataType: 'BOOLEAN',
    allowedOperators: ['EQUALS'],
    description: 'Religious or linguistic minority status.',
  },
  disability_status: {
    field: 'disability_status',
    label: 'Person with Disability (PwD)',
    category: 'SOCIAL',
    dataType: 'BOOLEAN',
    allowedOperators: ['EQUALS'],
    description: 'Whether applicant has benchmark disability.',
  },
  disability_percentage: {
    field: 'disability_percentage',
    label: 'Minimum Disability Percentage (%)',
    category: 'SOCIAL',
    dataType: 'NUMBER',
    allowedOperators: ['GREATER_THAN', 'GREATER_THAN_OR_EQUAL'],
    description: 'Statutory disability benchmark (usually 40%+).',
  },
  is_first_generation_graduate: {
    field: 'is_first_generation_graduate',
    label: 'First Generation Graduate',
    category: 'SOCIAL',
    dataType: 'BOOLEAN',
    allowedOperators: ['EQUALS'],
    description: 'First child in family pursuing graduate education.',
  },
  occupation_type: {
    field: 'occupation_type',
    label: 'Occupation / Employment',
    category: 'OCCUPATION',
    dataType: 'STRING',
    allowedOperators: ['EQUALS', 'IN', 'NOT_IN'],
    description: 'Student, Farmer, Self-Employed, Unemployed, etc.',
  },
  farmer_category: {
    field: 'farmer_category',
    label: 'Farmer Classification',
    category: 'OCCUPATION',
    dataType: 'STRING',
    allowedOperators: ['EQUALS', 'IN'],
    description: 'Marginal, Small, or Large farmer.',
  },
};
