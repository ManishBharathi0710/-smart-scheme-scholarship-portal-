import {
  NormalizedUserFacts,
  EvaluationResult,
  SchemeRuleInput,
  SingleConditionEvaluation,
  MissingInformationItem,
} from './types';
import { ConditionEvaluator } from './condition-evaluator';
import { LogicalEvaluator } from './logical-evaluator';
import { ExplanationGenerator } from './explanation-generator';
import { ValueNormalizer } from './value-normalizer';

export class RuleEngineService {
  /**
   * Pure evaluation function: Takes scheme rules and normalized user facts,
   * returns a complete deterministic EvaluationResult.
   *
   * Side-effect free, testable in isolation.
   */
  static evaluate(rules: SchemeRuleInput[], facts: NormalizedUserFacts): EvaluationResult {
    // If scheme has no rules defined, it is universally accessible / open
    if (!rules || rules.length === 0) {
      return {
        eligibilityStatus: 'ELIGIBLE',
        matchedCount: 0,
        failedCount: 0,
        unknownCount: 0,
        matchedConditions: [],
        failedConditions: [],
        unknownConditions: [],
        missingInformation: [],
        summary: 'This scheme does not prescribe statutory eligibility restrictions.',
        rulesEvaluated: 0,
        trace: {
          mandatoryFailures: 0,
          mandatoryUnknowns: 0,
          optionalFailures: 0,
          optionalUnknowns: 0,
        },
      };
    }

    const matchedConditions: SingleConditionEvaluation[] = [];
    const failedConditions: SingleConditionEvaluation[] = [];
    const unknownConditions: SingleConditionEvaluation[] = [];
    const missingInfoMap = new Map<string, MissingInformationItem>();

    let mandatoryFailures = 0;
    let mandatoryUnknowns = 0;
    let optionalFailures = 0;
    let optionalUnknowns = 0;

    // Group rules by ruleGroup to support nested logic / OR clusters
    const groupMap = new Map<string, SchemeRuleInput[]>();
    for (const rule of rules) {
      const g = rule.ruleGroup || 'DEFAULT';
      if (!groupMap.has(g)) {
        groupMap.set(g, []);
      }
      groupMap.get(g)!.push(rule);
    }

    // Process each group
    for (const [_groupName, groupRules] of groupMap.entries()) {
      // Evaluate each individual rule in the group
      const evaluatedConditions: SingleConditionEvaluation[] = [];
      const threeStateOperands: ('TRUE' | 'FALSE' | 'UNKNOWN')[] = [];

      for (const rule of groupRules) {
        const condEval = ConditionEvaluator.evaluate(rule, facts);
        evaluatedConditions.push(condEval);
        threeStateOperands.push(LogicalEvaluator.conditionToThreeState(condEval.result));

        // Track conditions
        if (condEval.result === 'MATCH') {
          matchedConditions.push(condEval);
        } else if (condEval.result === 'FAIL') {
          failedConditions.push(condEval);
          if (condEval.mandatory) {
            mandatoryFailures++;
          } else {
            optionalFailures++;
          }
        } else {
          // UNKNOWN
          unknownConditions.push(condEval);
          if (condEval.mandatory) {
            mandatoryUnknowns++;
          } else {
            optionalUnknowns++;
          }

          // Register missing information
          if (!missingInfoMap.has(condEval.field)) {
            const def = ValueNormalizer.getFieldDefinition(condEval.field);
            missingInfoMap.set(condEval.field, {
              field: condEval.field,
              label: def.label,
              category: def.category,
              description: def.description,
            });
          }
        }
      }
    }

    // Determine Overall Eligibility Status according to Section 19:
    // 1. NOT_ELIGIBLE: One or more mandatory conditions definitively fail.
    // 2. NEEDS_VERIFICATION: Missing required information prevents safe decision.
    // 3. LIKELY_ELIGIBLE: All mandatory conditions matched, but some optional/supporting conditions failed or are unknown.
    // 4. ELIGIBLE: All mandatory conditions matched, and no required conditions remain unknown.
    let eligibilityStatus: 'ELIGIBLE' | 'LIKELY_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'NOT_ELIGIBLE';

    if (mandatoryFailures > 0) {
      eligibilityStatus = 'NOT_ELIGIBLE';
    } else if (mandatoryUnknowns > 0) {
      eligibilityStatus = 'NEEDS_VERIFICATION';
    } else if (optionalFailures > 0 || optionalUnknowns > 0) {
      eligibilityStatus = 'LIKELY_ELIGIBLE';
    } else {
      eligibilityStatus = 'ELIGIBLE';
    }

    const summary = ExplanationGenerator.generateSummary(
      eligibilityStatus,
      matchedConditions.length,
      failedConditions.length,
      unknownConditions.length,
      failedConditions,
      unknownConditions,
    );

    return {
      eligibilityStatus,
      matchedCount: matchedConditions.length,
      failedCount: failedConditions.length,
      unknownCount: unknownConditions.length,
      matchedConditions,
      failedConditions,
      unknownConditions,
      missingInformation: Array.from(missingInfoMap.values()),
      summary,
      rulesEvaluated: rules.length,
      trace: {
        mandatoryFailures,
        mandatoryUnknowns,
        optionalFailures,
        optionalUnknowns,
      },
    };
  }
}
