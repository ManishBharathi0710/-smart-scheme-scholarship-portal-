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
} from '@prisma/client';

export {
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
};

/**
 * Controlled Eligibility Rule Field Catalog
 * Maps user profile dimensions directly to scheme rule evaluation attributes.
 * This guarantees strict compatibility with Module 2 profile models and deterministic evaluation in Module 4.
 */
export interface RuleFieldDefinition {
  field: string;
  label: string;
  category: 'PERSONAL' | 'LOCATION' | 'EDUCATION' | 'FINANCIAL' | 'SOCIAL' | 'OCCUPATION';
  dataType: RuleDataType;
  allowedOperators: RuleOperator[];
  description: string;
  allowedValues?: string[];
}

export const RULE_FIELD_CATALOG: Record<string, RuleFieldDefinition> = {
  age: {
    field: 'age',
    label: 'Citizen Age (Years)',
    category: 'PERSONAL',
    dataType: RuleDataType.NUMBER,
    allowedOperators: [
      RuleOperator.EQUALS,
      RuleOperator.GREATER_THAN,
      RuleOperator.GREATER_THAN_OR_EQUAL,
      RuleOperator.LESS_THAN,
      RuleOperator.LESS_THAN_OR_EQUAL,
      RuleOperator.BETWEEN,
    ],
    description: 'Applicant age in full years as on the application cutoff date.',
  },
  gender: {
    field: 'gender',
    label: 'Gender',
    category: 'PERSONAL',
    dataType: RuleDataType.STRING,
    allowedOperators: [RuleOperator.EQUALS, RuleOperator.IN, RuleOperator.NOT_IN],
    allowedValues: ['MALE', 'FEMALE', 'TRANSGENDER', 'OTHER'],
    description: 'Target gender (e.g., dedicated schemes for girl child or women empowerment).',
  },
  state: {
    field: 'state',
    label: 'Domicile / Resident State',
    category: 'LOCATION',
    dataType: RuleDataType.STRING,
    allowedOperators: [
      RuleOperator.EQUALS,
      RuleOperator.NOT_EQUALS,
      RuleOperator.IN,
      RuleOperator.NOT_IN,
    ],
    description: 'State of permanent residence or study institution location.',
  },
  district: {
    field: 'district',
    label: 'Resident District',
    category: 'LOCATION',
    dataType: RuleDataType.STRING,
    allowedOperators: [RuleOperator.EQUALS, RuleOperator.IN, RuleOperator.NOT_IN],
    description: 'Specific district for localized welfare schemes.',
  },
  area_type: {
    field: 'area_type',
    label: 'Area Type',
    category: 'LOCATION',
    dataType: RuleDataType.STRING,
    allowedOperators: [RuleOperator.EQUALS, RuleOperator.IN],
    allowedValues: ['RURAL', 'URBAN', 'SEMI_URBAN'],
    description: 'Rural, Urban, or Semi-Urban classification.',
  },
  annual_family_income: {
    field: 'annual_family_income',
    label: 'Annual Family Income (INR)',
    category: 'FINANCIAL',
    dataType: RuleDataType.NUMBER,
    allowedOperators: [
      RuleOperator.LESS_THAN,
      RuleOperator.LESS_THAN_OR_EQUAL,
      RuleOperator.BETWEEN,
      RuleOperator.EQUALS,
    ],
    description: 'Maximum ceiling of annual parental/family income.',
  },
  bpl_card_holder: {
    field: 'bpl_card_holder',
    label: 'Below Poverty Line (BPL) Card Holder',
    category: 'FINANCIAL',
    dataType: RuleDataType.BOOLEAN,
    allowedOperators: [RuleOperator.EQUALS],
    description: 'Whether applicant possesses valid government BPL card / ration card.',
  },
  education_level: {
    field: 'education_level',
    label: 'Education Level',
    category: 'EDUCATION',
    dataType: RuleDataType.STRING,
    allowedOperators: [RuleOperator.EQUALS, RuleOperator.IN, RuleOperator.NOT_IN],
    allowedValues: [
      'SCHOOL',
      'HIGHER_SECONDARY',
      'UNDERGRADUATE',
      'POSTGRADUATE',
      'DIPLOMA',
      'DOCTORATE',
      'ITI',
      'OTHER',
    ],
    description: 'Current level of enrollment or qualifying examination level.',
  },
  institution_type: {
    field: 'institution_type',
    label: 'Institution Type',
    category: 'EDUCATION',
    dataType: RuleDataType.STRING,
    allowedOperators: [RuleOperator.EQUALS, RuleOperator.IN],
    allowedValues: [
      'GOVERNMENT',
      'GOVERNMENT_AIDED',
      'PRIVATE',
      'AUTONOMOUS',
      'CENTRAL_UNIVERSITY',
      'DEEMED_UNIVERSITY',
      'OTHER',
    ],
    description: 'Type of educational institution (Government, Private, Aided).',
  },
  year_of_study: {
    field: 'year_of_study',
    label: 'Current Year of Study',
    category: 'EDUCATION',
    dataType: RuleDataType.NUMBER,
    allowedOperators: [
      RuleOperator.EQUALS,
      RuleOperator.GREATER_THAN_OR_EQUAL,
      RuleOperator.LESS_THAN_OR_EQUAL,
      RuleOperator.IN,
    ],
    description: 'Current academic year within the program (1st year, 2nd year, etc.).',
  },
  academic_percentage: {
    field: 'academic_percentage',
    label: 'Minimum Qualifying Marks / Percentage (%)',
    category: 'EDUCATION',
    dataType: RuleDataType.NUMBER,
    allowedOperators: [
      RuleOperator.GREATER_THAN,
      RuleOperator.GREATER_THAN_OR_EQUAL,
      RuleOperator.BETWEEN,
    ],
    description: 'Minimum marks required in previous qualifying examination.',
  },
  category: {
    field: 'category',
    label: 'Social Reservation Category',
    category: 'SOCIAL',
    dataType: RuleDataType.STRING,
    allowedOperators: [RuleOperator.EQUALS, RuleOperator.IN, RuleOperator.NOT_IN],
    allowedValues: ['GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'OTHER'],
    description: 'Statutory caste/social category reservation.',
  },
  minority_status: {
    field: 'minority_status',
    label: 'Religious / Linguistic Minority',
    category: 'SOCIAL',
    dataType: RuleDataType.BOOLEAN,
    allowedOperators: [RuleOperator.EQUALS],
    description: 'Whether applicant belongs to notified minority communities.',
  },
  disability_status: {
    field: 'disability_status',
    label: 'Person with Disability (PwD)',
    category: 'SOCIAL',
    dataType: RuleDataType.BOOLEAN,
    allowedOperators: [RuleOperator.EQUALS],
    description: 'Special provisions for persons with benchmark disabilities.',
  },
  disability_percentage: {
    field: 'disability_percentage',
    label: 'Minimum Disability Percentage (%)',
    category: 'SOCIAL',
    dataType: RuleDataType.NUMBER,
    allowedOperators: [RuleOperator.GREATER_THAN, RuleOperator.GREATER_THAN_OR_EQUAL],
    description: 'Benchmark percentage (usually 40%+ under RPwD Act).',
  },
  is_first_generation_graduate: {
    field: 'is_first_generation_graduate',
    label: 'First Generation Graduate in Family',
    category: 'SOCIAL',
    dataType: RuleDataType.BOOLEAN,
    allowedOperators: [RuleOperator.EQUALS],
    description: 'First member in family pursuing higher education.',
  },
  occupation_type: {
    field: 'occupation_type',
    label: 'Occupation / Employment Status',
    category: 'OCCUPATION',
    dataType: RuleDataType.STRING,
    allowedOperators: [RuleOperator.EQUALS, RuleOperator.IN, RuleOperator.NOT_IN],
    allowedValues: [
      'STUDENT',
      'EMPLOYED',
      'UNEMPLOYED',
      'FARMER',
      'SELF_EMPLOYED',
      'BUSINESS_OWNER',
      'HOMEMAKER',
      'RETIRED',
      'OTHER',
    ],
    description: 'Primary occupation category of applicant or parent.',
  },
  farmer_category: {
    field: 'farmer_category',
    label: 'Farmer Classification',
    category: 'OCCUPATION',
    dataType: RuleDataType.STRING,
    allowedOperators: [RuleOperator.EQUALS, RuleOperator.IN],
    allowedValues: ['MARGINAL_FARMER', 'SMALL_FARMER', 'LARGE_FARMER', 'NONE'],
    description: 'Landholding classification for agricultural assistance.',
  },
};

/**
 * Standard Document Types recognized across state and central portals
 */
export const STANDARD_DOCUMENT_TYPES = [
  { type: 'INCOME_CERTIFICATE', label: 'Income Certificate (Revenue Department)' },
  { type: 'COMMUNITY_CERTIFICATE', label: 'Community / Caste Certificate' },
  { type: 'MARKSHEET', label: 'Previous Qualifying Marksheet' },
  { type: 'BONAFIDE_CERTIFICATE', label: 'Institutional Bonafide Certificate' },
  { type: 'DOMICILE_CERTIFICATE', label: 'Nativity / Residence / Domicile Certificate' },
  { type: 'DISABILITY_CERTIFICATE', label: 'UDID / Medical Board Disability Certificate' },
  { type: 'BANK_PASSBOOK', label: 'Aadhaar-Linked Bank Account Passbook' },
  { type: 'AADHAAR_CARD', label: 'Aadhaar Card (Identity Proof)' },
  { type: 'FIRST_GRADUATE_CERTIFICATE', label: 'First Generation Graduate Certificate' },
  { type: 'RATION_CARD', label: 'BPL / Antyodaya Ration Card' },
  { type: 'FARMER_ID', label: 'PM-KISAN / Farmer Passbook / Patta' },
  { type: 'OTHER', label: 'Other Prescribed Government Document' },
];
