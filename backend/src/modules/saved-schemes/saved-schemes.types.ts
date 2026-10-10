import {
  ProgramType,
  SchemeCategory,
  ApplicationCycleStatus,
  RecommendationEligibilityStatus,
} from '@prisma/client';

export interface SavedSchemeQuery {
  page?: number;
  pageSize?: number;
  category?: SchemeCategory;
  programType?: ProgramType;
  applicationStatus?: ApplicationCycleStatus;
}

export interface SavedSchemeCardDto {
  savedId: string;
  savedAt: string;
  scheme: {
    id: string;
    slug: string;
    name: string;
    shortName: string | null;
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
    activeApplicationPeriod: {
      title: string;
      openDate: string | Date | null;
      closeDate: string | Date | null;
      status: ApplicationCycleStatus;
    } | null;
    officialPortalUrl: string | null;
  };
  recommendation?: {
    eligibilityStatus: RecommendationEligibilityStatus;
    isExpiringSoon: boolean;
    matchedCount: number;
    failedCount: number;
    unknownCount: number;
    summary: string;
  } | null;
}

export interface SaveSchemeResultDto {
  saved: boolean;
  schemeId: string;
  savedId?: string;
  savedAt?: string;
}

export interface SavedSchemeIdsResultDto {
  savedSchemeIds: string[];
}
