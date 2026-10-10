import { ProgramType, SchemeCategory, ApplicationCycleStatus } from './scheme';

export interface SavedSchemeCard {
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
      openDate: string | null;
      closeDate: string | null;
      status: ApplicationCycleStatus;
    } | null;
    officialPortalUrl: string | null;
  };
  recommendation?: {
    eligibilityStatus: 'ELIGIBLE' | 'LIKELY_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'NOT_ELIGIBLE';
    isExpiringSoon: boolean;
    matchedCount: number;
    failedCount: number;
    unknownCount: number;
    summary: string;
  } | null;
}

export interface SaveSchemeResult {
  saved: boolean;
  schemeId: string;
  savedId?: string;
  savedAt?: string;
}

export interface SavedSchemeIdsResult {
  schemeIds: string[];
  count: number;
}
