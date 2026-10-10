import { RuleOperator } from '@prisma/client';
import {
  NormalizedUserFacts,
  ConditionResult,
  SingleConditionEvaluation,
  SchemeRuleInput,
} from './types';
import { ValueNormalizer } from './value-normalizer';
import { ExplanationGenerator } from './explanation-generator';

export class ConditionEvaluator {
  /**
   * Evaluates a single scheme rule against user facts.
   * Produces a SingleConditionEvaluation with deterministic MATCH, FAIL, or UNKNOWN result.
   */
  static evaluate(rule: SchemeRuleInput, facts: NormalizedUserFacts): SingleConditionEvaluation {
    const fieldDef = ValueNormalizer.getFieldDefinition(rule.field);
    const fact = facts[rule.field];

    const actualValue = fact ? fact.value : null;
    const isFactUnknown =
      !fact || fact.state === 'UNKNOWN' || fact.value === null || fact.value === undefined;

    // Special operators: EXISTS / NOT_EXISTS
    if (rule.operator === RuleOperator.EXISTS) {
      const match = !isFactUnknown;
      const result: ConditionResult = match ? 'MATCH' : 'FAIL';
      const explanation = ExplanationGenerator.generateConditionExplanation(
        rule.field,
        rule.operator,
        rule.value,
        actualValue,
        result,
        rule.description,
      );
      return {
        field: rule.field,
        fieldLabel: fieldDef.label,
        operator: rule.operator,
        requiredValue: rule.value,
        actualValue,
        result,
        mandatory: rule.mandatory,
        description: rule.description,
        explanation,
      };
    }

    if (rule.operator === RuleOperator.NOT_EXISTS) {
      const match = isFactUnknown;
      const result: ConditionResult = match ? 'MATCH' : 'FAIL';
      const explanation = ExplanationGenerator.generateConditionExplanation(
        rule.field,
        rule.operator,
        rule.value,
        actualValue,
        result,
        rule.description,
      );
      return {
        field: rule.field,
        fieldLabel: fieldDef.label,
        operator: rule.operator,
        requiredValue: rule.value,
        actualValue,
        result,
        mandatory: rule.mandatory,
        description: rule.description,
        explanation,
      };
    }

    // If fact is unknown for standard comparison operators, the condition is UNKNOWN
    if (isFactUnknown) {
      const result: ConditionResult = 'UNKNOWN';
      const explanation = ExplanationGenerator.generateConditionExplanation(
        rule.field,
        rule.operator,
        rule.value,
        null,
        result,
        rule.description,
      );
      return {
        field: rule.field,
        fieldLabel: fieldDef.label,
        operator: rule.operator,
        requiredValue: rule.value,
        actualValue: null,
        result,
        mandatory: rule.mandatory,
        description: rule.description,
        explanation,
        reason: 'User profile does not contain this information.',
      };
    }

    // Fact is KNOWN: Evaluate operator deterministically
    const result = this.evaluateOperator(rule.operator, fact.value, rule.value);
    const explanation = ExplanationGenerator.generateConditionExplanation(
      rule.field,
      rule.operator,
      rule.value,
      fact.value,
      result,
      rule.description,
    );

    return {
      field: rule.field,
      fieldLabel: fieldDef.label,
      operator: rule.operator,
      requiredValue: rule.value,
      actualValue: fact.value,
      result,
      mandatory: rule.mandatory,
      description: rule.description,
      explanation,
    };
  }

  /**
   * Internal deterministic operator evaluation
   */
  private static evaluateOperator(
    operator: RuleOperator,
    actual: unknown,
    required: unknown,
  ): ConditionResult {
    switch (operator) {
      case RuleOperator.EQUALS: {
        if (typeof actual === 'number' || typeof required === 'number') {
          const actNum = ValueNormalizer.normalizeNumber(actual);
          const reqNum = ValueNormalizer.normalizeNumber(required);
          if (actNum === null || reqNum === null) return 'FAIL';
          return actNum === reqNum ? 'MATCH' : 'FAIL';
        }
        if (typeof actual === 'boolean' || typeof required === 'boolean') {
          const actBool = ValueNormalizer.normalizeBoolean(actual);
          const reqBool = ValueNormalizer.normalizeBoolean(required);
          if (actBool === null || reqBool === null) return 'FAIL';
          return actBool === reqBool ? 'MATCH' : 'FAIL';
        }
        // String comparison
        const actStr = ValueNormalizer.normalizeString(actual);
        const reqStr = ValueNormalizer.normalizeString(required);
        return actStr === reqStr ? 'MATCH' : 'FAIL';
      }

      case RuleOperator.NOT_EQUALS: {
        const eqResult = this.evaluateOperator(RuleOperator.EQUALS, actual, required);
        return eqResult === 'MATCH' ? 'FAIL' : 'MATCH';
      }

      case RuleOperator.GREATER_THAN: {
        const actNum = ValueNormalizer.normalizeNumber(actual);
        const reqNum = ValueNormalizer.normalizeNumber(required);
        if (actNum === null || reqNum === null) return 'FAIL';
        return actNum > reqNum ? 'MATCH' : 'FAIL';
      }

      case RuleOperator.GREATER_THAN_OR_EQUAL: {
        const actNum = ValueNormalizer.normalizeNumber(actual);
        const reqNum = ValueNormalizer.normalizeNumber(required);
        if (actNum === null || reqNum === null) return 'FAIL';
        return actNum >= reqNum ? 'MATCH' : 'FAIL';
      }

      case RuleOperator.LESS_THAN: {
        const actNum = ValueNormalizer.normalizeNumber(actual);
        const reqNum = ValueNormalizer.normalizeNumber(required);
        if (actNum === null || reqNum === null) return 'FAIL';
        return actNum < reqNum ? 'MATCH' : 'FAIL';
      }

      case RuleOperator.LESS_THAN_OR_EQUAL: {
        const actNum = ValueNormalizer.normalizeNumber(actual);
        const reqNum = ValueNormalizer.normalizeNumber(required);
        if (actNum === null || reqNum === null) return 'FAIL';
        return actNum <= reqNum ? 'MATCH' : 'FAIL';
      }

      case RuleOperator.IN: {
        const candidateList = Array.isArray(required) ? required : [required];
        const actStr = ValueNormalizer.normalizeString(actual);
        const actNum = ValueNormalizer.normalizeNumber(actual);

        for (const item of candidateList) {
          if (typeof item === 'number' && actNum !== null) {
            if (actNum === Number(item)) return 'MATCH';
          } else {
            if (actStr === ValueNormalizer.normalizeString(item)) return 'MATCH';
          }
        }
        return 'FAIL';
      }

      case RuleOperator.NOT_IN: {
        const inResult = this.evaluateOperator(RuleOperator.IN, actual, required);
        return inResult === 'MATCH' ? 'FAIL' : 'MATCH';
      }

      case RuleOperator.BETWEEN: {
        const actNum = ValueNormalizer.normalizeNumber(actual);
        if (actNum === null) return 'FAIL';

        let min: number | null = null;
        let max: number | null = null;

        if (Array.isArray(required) && required.length >= 2) {
          min = ValueNormalizer.normalizeNumber(required[0]);
          max = ValueNormalizer.normalizeNumber(required[1]);
        } else if (typeof required === 'object' && required !== null) {
          const obj = required as { min?: unknown; max?: unknown };
          min = ValueNormalizer.normalizeNumber(obj.min);
          max = ValueNormalizer.normalizeNumber(obj.max);
        }

        if (min === null || max === null) return 'FAIL';
        // Inclusive boundary comparison
        return actNum >= min && actNum <= max ? 'MATCH' : 'FAIL';
      }

      case RuleOperator.CONTAINS: {
        if (Array.isArray(actual)) {
          const reqStr = ValueNormalizer.normalizeString(required);
          const hasItem = actual.some((item) => ValueNormalizer.normalizeString(item) === reqStr);
          return hasItem ? 'MATCH' : 'FAIL';
        }
        const actStr = ValueNormalizer.normalizeString(actual);
        const reqStr = ValueNormalizer.normalizeString(required);
        return actStr.includes(reqStr) ? 'MATCH' : 'FAIL';
      }

      default:
        return 'FAIL';
    }
  }
}
