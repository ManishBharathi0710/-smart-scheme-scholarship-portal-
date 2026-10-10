import { ProgramType, SchemeCategory } from './scheme';

export type RecommendationEligibilityStatus =
  | 'ELIGIBLE'
  | 'LIKELY_ELIGIBLE'
  | 'NEEDS_VERIFICATION'
  | 'NOT_ELIGIBLE';

export type RecommendationApplicationStatus = 'OPEN' | 'UPCOMING' | 'CLOSED';

export interface SingleConditionEvaluation {
  field: string;
  fieldLabel: string;
  operator: string;
  requiredValue: unknown;
  actualValue: unknown;
  result: 'MATCH' | 'FAIL' | 'UNKNOWN';
  mandatory: boolean;
  description: string;
  explanation: string;
  reason?: string;
}

export interface MissingInformationItem {
  field: string;
  label: string;
  category?: string;
  section?: string;
  description: string;
}

export interface RecommendationCard {
  id: string;
  schemeId: string;
  schemeName: string;
  slug: string;
  shortDescription?: string | null;
  programType: ProgramType;
  categories: SchemeCategory[];
  departmentName?: string;
  department?: string;
  stateScope?: string;
  primaryBenefit?: {
    type: string;
    amount?: number | null;
    frequency?: string;
    description?: string | null;
  } | null;
  eligibilityStatus: RecommendationEligibilityStatus;
  applicationStatus: RecommendationApplicationStatus;
  isExpiringSoon: boolean;
  daysUntilDeadline?: number | null;
  deadline?: string | null;
  matchedCount: number;
  failedCount: number;
  unknownCount: number;
  mandatoryFailuresCount?: number;
  summary: string;
  missingFields?: string[];
  schemeVersionNumber: number;
  schemeVersionId?: string;
  evaluatedAt: string;
}

export interface RecommendationDetail extends RecommendationCard {
  evaluationDetails: {
    summary: string;
    matchedConditions: SingleConditionEvaluation[];
    failedConditions: SingleConditionEvaluation[];
    unknownConditions: SingleConditionEvaluation[];
    missingInformation: MissingInformationItem[];
    rulesEvaluated: number;
  };
  explanation: {
    summary: string;
    matched: string[];
    failed: string[];
    unknown: string[];
    conditions?: SingleConditionEvaluation[];
    matchedConditions?: SingleConditionEvaluation[];
    failedConditions?: SingleConditionEvaluation[];
    unknownConditions?: SingleConditionEvaluation[];
  };
  missingInformation: MissingInformationItem[];
  scheme: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    programType: ProgramType;
    categories?: SchemeCategory[];
    department?: string;
    departmentName?: string;
    stateScope?: string;
    officialPortalUrl?: string | null;
    officialSourceUrl?: string;
    officialApplicationUrl?: string | null;
    applicationMethod?: string;
    applicationInstructions?: string | null;
    applicationPeriod?: {
      applicationOpenDate: string | null;
      applicationCloseDate: string | null;
    };
    benefits: Array<{
      id?: string;
      type: string;
      amount?: number | null;
      frequency?: string;
      duration?: string | null;
      coverage?: string | null;
      description: string | null;
    }>;
    requiredDocuments: Array<{
      id?: string;
      name: string;
      mandatory: boolean;
      description?: string | null;
    }>;
    documents?: Array<{
      id: string;
      documentType: string;
      name: string;
      mandatory: boolean;
      description: string | null;
      notes: string | null;
    }>;
    applicationPeriods?: Array<{
      id: string;
      title: string;
      openDate: string | null;
      closeDate: string | null;
      status: string;
      instructions: string | null;
    }>;
  };
  schemeVersion: {
    id: string;
    versionNumber: number;
    changeSummary: string | null;
    validFrom: string;
  };
  disclaimer?: string;
}

export type RecommendationDetailDto = RecommendationDetail;

export interface RecommendationFilterQuery {
  page?: number;
  pageSize?: number;
  status?: RecommendationEligibilityStatus;
  programType?: ProgramType;
  category?: SchemeCategory;
  applicationStatus?: RecommendationApplicationStatus;
  expiringSoon?: boolean;
}

export interface RefreshRecommendationsResult {
  totalSchemesEvaluated: number;
  eligibleCount: number;
  likelyEligibleCount: number;
  needsVerificationCount: number;
  notEligibleCount: number;
  refreshedAt: string;
}
