import {
  RecommendationEligibilityStatus,
  RecommendationApplicationStatus,
  ProgramType,
  SchemeCategory,
} from '@prisma/client';
import { SingleConditionEvaluation, MissingInformationItem } from './engine/types';

export interface RecommendationCardDto {
  id: string;
  schemeId: string;
  schemeName: string;
  slug: string;
  shortDescription: string | null;
  programType: ProgramType;
  categories: SchemeCategory[];
  departmentName: string;
  stateScope: string;
  primaryBenefit: {
    type: string;
    amount: number | null;
    frequency: string;
    description: string | null;
  } | null;
  eligibilityStatus: RecommendationEligibilityStatus;
  applicationStatus: RecommendationApplicationStatus;
  isExpiringSoon: boolean;
  deadline: string | null;
  matchedCount: number;
  failedCount: number;
  unknownCount: number;
  summary: string;
  missingFields: string[];
  schemeVersionNumber: number;
  evaluatedAt: string;
}

export interface RecommendationDetailDto extends RecommendationCardDto {
  evaluationDetails: {
    summary: string;
    matchedConditions: SingleConditionEvaluation[];
    failedConditions: SingleConditionEvaluation[];
    unknownConditions: SingleConditionEvaluation[];
    missingInformation: MissingInformationItem[];
    rulesEvaluated: number;
  };
  scheme: {
    id: string;
    name: string;
    slug: string;
    description: string;
    officialSourceUrl: string;
    officialApplicationUrl: string | null;
    applicationMethod: string;
    applicationInstructions: string | null;
    benefits: Array<{
      id: string;
      type: string;
      amount: number | null;
      frequency: string;
      duration: string | null;
      description: string | null;
    }>;
    documents: Array<{
      id: string;
      documentType: string;
      name: string;
      mandatory: boolean;
      description: string | null;
      notes: string | null;
    }>;
    applicationPeriods: Array<{
      id: string;
      title: string;
      openDate: string | null;
      closeDate: string | null;
      status: string;
      instructions: string | null;
    }>;
  };
  disclaimer: string;
}

export interface RecommendationListQuery {
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
