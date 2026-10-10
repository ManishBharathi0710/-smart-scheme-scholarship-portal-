import { ProgramType, SchemeCategory, DepartmentLevel, ApplicationMethod, ApplicationCycleStatus } from './scheme';

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
  applicationOpenDate?: string | null;
  applicationCloseDate?: string | null;
  requiredDocuments: string[];
  applicationMethod: ApplicationMethod;
  officialApplicationUrl?: string | null;
  officialSourceUrl: string;
  isSaved?: boolean;
  userEligibility?: {
    status: string;
    evaluatedAt: string;
    missingRequirements: string[];
  } | null;
}

export interface SchemeComparisonResponse {
  comparedCount: number;
  maxAllowed: number;
  schemes: SchemeComparisonColumn[];
}
