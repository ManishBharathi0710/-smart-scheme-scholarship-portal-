import {
  RuleOperator,
  RuleDataType,
  RecommendationEligibilityStatus,
  RecommendationApplicationStatus,
} from '@prisma/client';

export type FactState = 'KNOWN' | 'UNKNOWN' | 'NOT_APPLICABLE';

export type FactValue = string | number | boolean | string[] | number[] | null | undefined;

export interface UserFact {
  value: FactValue;
  state: FactState;
  raw?: unknown;
}

export type NormalizedUserFacts = Record<string, UserFact>;

export type ConditionResult = 'MATCH' | 'FAIL' | 'UNKNOWN';

export interface SingleConditionEvaluation {
  field: string;
  fieldLabel: string;
  operator: RuleOperator;
  requiredValue: unknown;
  actualValue: unknown;
  result: ConditionResult;
  mandatory: boolean;
  description: string;
  explanation: string;
  reason?: string;
}

export type ThreeStateBool = 'TRUE' | 'FALSE' | 'UNKNOWN';

export interface MissingInformationItem {
  field: string;
  label: string;
  category: string;
  description: string;
}

export interface EvaluationResult {
  eligibilityStatus: RecommendationEligibilityStatus;
  matchedCount: number;
  failedCount: number;
  unknownCount: number;
  matchedConditions: SingleConditionEvaluation[];
  failedConditions: SingleConditionEvaluation[];
  unknownConditions: SingleConditionEvaluation[];
  missingInformation: MissingInformationItem[];
  summary: string;
  rulesEvaluated: number;
  trace: {
    mandatoryFailures: number;
    mandatoryUnknowns: number;
    optionalFailures: number;
    optionalUnknowns: number;
  };
}

export interface SchemeRuleInput {
  id: string;
  field: string;
  operator: RuleOperator;
  value: unknown;
  dataType: RuleDataType;
  mandatory: boolean;
  description: string;
  order?: number;
  logicalOperator?: string;
  ruleGroup?: string | null;
}

export interface SchemeToEvaluate {
  schemeId: string;
  schemeName: string;
  slug: string;
  versionId: string;
  versionNumber: number;
  categories: string[];
  programType: string;
  stateScope: string;
  rules: SchemeRuleInput[];
  activePeriod?: {
    openDate: Date | null;
    closeDate: Date | null;
    status: string;
  } | null;
}

export interface FullRecommendationEvaluation {
  schemeId: string;
  schemeName: string;
  slug: string;
  schemeVersionId: string;
  versionNumber: number;
  eligibilityStatus: RecommendationEligibilityStatus;
  applicationStatus: RecommendationApplicationStatus;
  isExpiringSoon: boolean;
  matchedCount: number;
  failedCount: number;
  unknownCount: number;
  evaluationDetails: {
    summary: string;
    matchedConditions: SingleConditionEvaluation[];
    failedConditions: SingleConditionEvaluation[];
    unknownConditions: SingleConditionEvaluation[];
    missingInformation: MissingInformationItem[];
    rulesEvaluated: number;
  };
}
