import { ThreeStateBool } from './types';

/**
 * Pure Three-State Boolean Logic Evaluator (Kleene / Łukasiewicz Logic)
 * Critical architectural requirement: Section 16 & Section 100
 *
 * Truth Tables:
 * AND:
 *   TRUE  AND TRUE    = TRUE
 *   TRUE  AND FALSE   = FALSE
 *   FALSE AND FALSE   = FALSE
 *   TRUE  AND UNKNOWN = UNKNOWN
 *   FALSE AND UNKNOWN = FALSE
 *   UNKNOWN AND UNKNOWN = UNKNOWN
 *
 * OR:
 *   TRUE  OR TRUE    = TRUE
 *   TRUE  OR FALSE   = TRUE
 *   FALSE OR FALSE   = FALSE
 *   TRUE  OR UNKNOWN = TRUE
 *   FALSE OR UNKNOWN = UNKNOWN
 *   UNKNOWN OR UNKNOWN = UNKNOWN
 *
 * NOT:
 *   NOT TRUE    = FALSE
 *   NOT FALSE   = TRUE
 *   NOT UNKNOWN = UNKNOWN
 */
export class LogicalEvaluator {
  /**
   * Evaluates an array of three-state values combined with logical AND.
   * If any value is FALSE, the conjunction is definitively FALSE (absorptive element).
   * If no FALSE exists, but at least one UNKNOWN exists, the conjunction is UNKNOWN.
   * Only if all operands are TRUE does it yield TRUE.
   */
  static and(operands: ThreeStateBool[]): ThreeStateBool {
    if (operands.length === 0) {
      return 'TRUE';
    }

    let hasUnknown = false;

    for (const op of operands) {
      if (op === 'FALSE') {
        return 'FALSE';
      }
      if (op === 'UNKNOWN') {
        hasUnknown = true;
      }
    }

    return hasUnknown ? 'UNKNOWN' : 'TRUE';
  }

  /**
   * Evaluates an array of three-state values combined with logical OR.
   * If any value is TRUE, the disjunction is definitively TRUE (absorptive element).
   * If no TRUE exists, but at least one UNKNOWN exists, the disjunction is UNKNOWN.
   * Only if all operands are FALSE does it yield FALSE.
   */
  static or(operands: ThreeStateBool[]): ThreeStateBool {
    if (operands.length === 0) {
      return 'FALSE';
    }

    let hasUnknown = false;

    for (const op of operands) {
      if (op === 'TRUE') {
        return 'TRUE';
      }
      if (op === 'UNKNOWN') {
        hasUnknown = true;
      }
    }

    return hasUnknown ? 'UNKNOWN' : 'FALSE';
  }

  /**
   * Negates a three-state value.
   */
  static not(operand: ThreeStateBool): ThreeStateBool {
    switch (operand) {
      case 'TRUE':
        return 'FALSE';
      case 'FALSE':
        return 'TRUE';
      case 'UNKNOWN':
        return 'UNKNOWN';
    }
  }

  /**
   * Converts ConditionResult ('MATCH' | 'FAIL' | 'UNKNOWN') to ThreeStateBool ('TRUE' | 'FALSE' | 'UNKNOWN')
   */
  static conditionToThreeState(result: 'MATCH' | 'FAIL' | 'UNKNOWN'): ThreeStateBool {
    switch (result) {
      case 'MATCH':
        return 'TRUE';
      case 'FAIL':
        return 'FALSE';
      case 'UNKNOWN':
        return 'UNKNOWN';
    }
  }

  /**
   * Converts ThreeStateBool ('TRUE' | 'FALSE' | 'UNKNOWN') to ConditionResult ('MATCH' | 'FAIL' | 'UNKNOWN')
   */
  static threeStateToCondition(result: ThreeStateBool): 'MATCH' | 'FAIL' | 'UNKNOWN' {
    switch (result) {
      case 'TRUE':
        return 'MATCH';
      case 'FALSE':
        return 'FAIL';
      case 'UNKNOWN':
        return 'UNKNOWN';
    }
  }
}
