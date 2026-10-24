import { AiPromptResponse, GroundedContextData, AssistantConfidence } from './assistant.types.js';
import { logger } from '../../utils/logger.js';

export class ResponseValidationService {
  /**
   * Validates and sanitizes model output before sending to the client.
   * Enforces strict eligibility consistency, link safety, and sensitive data masking.
   */
  public validateResponse(
    response: AiPromptResponse,
    groundedContext: GroundedContextData,
  ): AiPromptResponse {
    let sanitizedAnswer = response.answer;
    let confidence: AssistantConfidence = response.confidence;

    // 1. Eligibility Consistency Check
    if (groundedContext.recommendation) {
      const deterministicStatus = groundedContext.recommendation.eligibilityStatus;

      // If user is NOT_ELIGIBLE, verify assistant does not claim they are eligible
      if (deterministicStatus === 'NOT_ELIGIBLE') {
        const lowerAnswer = sanitizedAnswer.toLowerCase();
        if (
          (lowerAnswer.includes('you are eligible') ||
            lowerAnswer.includes('you qualify') ||
            lowerAnswer.includes('you are fully eligible')) &&
          !lowerAnswer.includes('not eligible')
        ) {
          logger.warn({
            event: 'AI_ELIGIBILITY_CONTRADICTION_PREVENTED',
            deterministicStatus,
            msg: 'Model incorrectly asserted eligibility for NOT_ELIGIBLE user. Overriding with deterministic fact.',
          });

          const missingReqs = groundedContext.recommendation.missingRequirements.join(', ');
          sanitizedAnswer = `According to the portal's deterministic evaluation, your current assessment is **Not Eligible** because the following mandatory requirement(s) were not satisfied: ${missingReqs || 'criteria not met'}. The assistant cannot override this assessment.`;
          confidence = 'GROUNDED';
        }
      }
    }

    // 2. Sensitive Data Masking (Aadhaar / PII safeguards)
    // 12-digit Aadhaar pattern
    sanitizedAnswer = sanitizedAnswer.replace(
      /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,
      '[IDENTITY_NUMBER_MASKED]',
    );

    // 3. Link Safety & URL Validation
    const allowedUrls = new Set<string>();
    if (groundedContext.scheme?.officialApplicationUrl) {
      allowedUrls.add(groundedContext.scheme.officialApplicationUrl);
    }
    if (groundedContext.scheme?.officialSourceUrl) {
      allowedUrls.add(groundedContext.scheme.officialSourceUrl);
    }
    if (groundedContext.notification?.actionUrl) {
      allowedUrls.add(groundedContext.notification.actionUrl);
    }
    if (groundedContext.matchingSchemes?.length) {
      groundedContext.matchingSchemes.forEach((s) => {
        if (s.officialApplicationUrl) allowedUrls.add(s.officialApplicationUrl);
      });
    }

    // Sanitize actions
    const validatedActions = response.actions.filter((action) => {
      if (action.type === 'OPEN_OFFICIAL_URL') {
        if (!action.url || !allowedUrls.has(action.url)) {
          logger.warn({
            rejectedUrl: action.url,
            msg: 'Rejected ungrounded external action URL from AI response',
          });
          return false;
        }
      }
      return true;
    });

    return {
      ...response,
      answer: sanitizedAnswer,
      confidence,
      actions: validatedActions,
    };
  }
}

export const responseValidationService = new ResponseValidationService();
