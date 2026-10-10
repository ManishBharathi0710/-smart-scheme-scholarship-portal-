import { RuleOperator } from '@prisma/client';
import { ConditionResult, SingleConditionEvaluation } from './types';
import { ValueNormalizer } from './value-normalizer';

export class ExplanationGenerator {
  /**
   * Generates a clear, neutral, factual explanation for a condition evaluation.
   */
  static generateConditionExplanation(
    field: string,
    operator: RuleOperator,
    requiredValue: unknown,
    actualValue: unknown,
    result: ConditionResult,
    defaultDescription?: string,
  ): string {
    const meta = ValueNormalizer.getFieldDefinition(field);
    const label = meta.label || field.replace(/_/g, ' ');

    if (result === 'UNKNOWN') {
      return `Your profile does not provide information for ${label}, which is required to determine eligibility.`;
    }

    const formattedRequired = this.formatValue(field, requiredValue);
    const formattedActual = this.formatValue(field, actualValue);

    if (result === 'MATCH') {
      switch (operator) {
        case RuleOperator.EQUALS:
          return `Your ${label} matches the required value (${formattedRequired}).`;
        case RuleOperator.NOT_EQUALS:
          return `Your ${label} (${formattedActual}) complies with the exclusion criteria.`;
        case RuleOperator.GREATER_THAN:
        case RuleOperator.GREATER_THAN_OR_EQUAL:
          return `Your ${label} (${formattedActual}) meets the required minimum of ${formattedRequired}.`;
        case RuleOperator.LESS_THAN:
        case RuleOperator.LESS_THAN_OR_EQUAL:
          return `Your ${label} (${formattedActual}) is within the allowable limit of ${formattedRequired}.`;
        case RuleOperator.IN:
          return `Your ${label} (${formattedActual}) is among the eligible categories for this scheme.`;
        case RuleOperator.NOT_IN:
          return `Your ${label} (${formattedActual}) is not in the excluded categories.`;
        case RuleOperator.BETWEEN:
          return `Your ${label} (${formattedActual}) falls within the prescribed range of ${formattedRequired}.`;
        case RuleOperator.CONTAINS:
          return `Your ${label} satisfies the requirement.`;
        case RuleOperator.EXISTS:
          return `Required record for ${label} is present.`;
        case RuleOperator.NOT_EXISTS:
          return `Verification criterion for ${label} is satisfied.`;
        default:
          return defaultDescription || `Condition for ${label} is satisfied.`;
      }
    } else {
      // FAIL
      switch (operator) {
        case RuleOperator.EQUALS:
          return `Your ${label} is ${formattedActual}, but this scheme requires ${formattedRequired}.`;
        case RuleOperator.NOT_EQUALS:
          return `Your ${label} matches ${formattedRequired}, which is excluded for this scheme.`;
        case RuleOperator.GREATER_THAN:
        case RuleOperator.GREATER_THAN_OR_EQUAL:
          return `Your ${label} is ${formattedActual}, which is below the minimum required ${formattedRequired}.`;
        case RuleOperator.LESS_THAN:
        case RuleOperator.LESS_THAN_OR_EQUAL:
          return `Your ${label} is ${formattedActual}, which exceeds the permissible ceiling of ${formattedRequired}.`;
        case RuleOperator.IN:
          return `Your ${label} (${formattedActual}) is not included in the eligible categories (${formattedRequired}).`;
        case RuleOperator.NOT_IN:
          return `Your ${label} (${formattedActual}) falls into an ineligible category (${formattedRequired}).`;
        case RuleOperator.BETWEEN:
          return `Your ${label} (${formattedActual}) is outside the prescribed range (${formattedRequired}).`;
        case RuleOperator.CONTAINS:
          return `Your ${label} does not contain the required criteria.`;
        case RuleOperator.EXISTS:
          return `Required information for ${label} is missing.`;
        case RuleOperator.NOT_EXISTS:
          return `Criterion for ${label} is not satisfied.`;
        default:
          return defaultDescription || `Condition for ${label} was not met.`;
      }
    }
  }

  /**
   * Generates a neutral executive summary for the evaluation result.
   */
  static generateSummary(
    status: 'ELIGIBLE' | 'LIKELY_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'NOT_ELIGIBLE',
    matchedCount: number,
    _failedCount: number,
    unknownCount: number,
    failedConditions: SingleConditionEvaluation[],
    unknownConditions: SingleConditionEvaluation[],
  ): string {
    switch (status) {
      case 'ELIGIBLE':
        return `Based on your profile, you satisfy all ${matchedCount} verified statutory requirements currently recorded for this scheme.`;
      case 'LIKELY_ELIGIBLE':
        return `You meet all essential requirements (${matchedCount} satisfied), though ${unknownCount} supporting detail(s) may need confirmation during application.`;
      case 'NEEDS_VERIFICATION': {
        const fields = unknownConditions.map((c) => c.fieldLabel).join(', ');
        return `Eligibility could not be definitively determined because ${unknownCount} required criteria (${fields}) are missing in your profile.`;
      }
      case 'NOT_ELIGIBLE': {
        const firstFailed = failedConditions[0];
        const failMsg = firstFailed ? ` (specifically: ${firstFailed.fieldLabel})` : '';
        return `Based on your profile, you currently do not satisfy one or more mandatory eligibility criteria${failMsg}.`;
      }
    }
  }

  /**
   * Pretty-formats values for user presentation (currency, percentages, lists)
   */
  private static formatValue(field: string, val: unknown): string {
    if (val === null || val === undefined) return 'Not Provided';

    if (field === 'annual_family_income') {
      const num = Number(val);
      if (!isNaN(num)) {
        return `₹${num.toLocaleString('en-IN')}`;
      }
    }

    if (field === 'academic_percentage' || field === 'disability_percentage') {
      const num = Number(val);
      if (!isNaN(num)) {
        return `${num}%`;
      }
    }

    if (Array.isArray(val)) {
      if (val.length === 2 && typeof val[0] === 'number' && typeof val[1] === 'number') {
        if (field === 'annual_family_income') {
          return `₹${val[0].toLocaleString('en-IN')} to ₹${val[1].toLocaleString('en-IN')}`;
        }
        return `${val[0]} to ${val[1]}`;
      }
      return val.map((v) => String(v).replace(/_/g, ' ')).join(', ');
    }

    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }

    return String(val).replace(/_/g, ' ');
  }
}
