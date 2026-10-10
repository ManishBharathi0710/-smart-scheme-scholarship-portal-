import {
  AssistantIntent,
  GroundedContextData,
  AssistantChatContextInput,
} from './assistant.types.js';
import { schemeTool } from './tools/scheme.tool.js';
import { recommendationTool } from './tools/recommendation.tool.js';
import { documentTool } from './tools/document.tool.js';
import { notificationTool } from './tools/notification.tool.js';
import { profileTool } from './tools/profile.tool.js';
import { AssistantContextType } from '@prisma/client';

export class GroundingService {
  /**
   * Classifies user intent from natural language inquiry and explicit conversation context.
   */
  public detectIntent(message: string, context?: AssistantChatContextInput): AssistantIntent {
    const text = message.toLowerCase();

    if (context?.contextType === AssistantContextType.RECOMMENDATION) {
      return 'EXPLAIN_ELIGIBILITY';
    }
    if (context?.contextType === AssistantContextType.DOCUMENT) {
      return 'EXPLAIN_DOCUMENTS';
    }
    if (context?.contextType === AssistantContextType.NOTIFICATION) {
      return 'EXPLAIN_NOTIFICATION';
    }
    if (context?.contextType === AssistantContextType.COMPARISON) {
      return 'COMPARE_SCHEMES';
    }

    if (
      text.includes('compare') ||
      text.includes('difference') ||
      text.includes('vs ') ||
      text.includes('versus')
    ) {
      return 'COMPARE_SCHEMES';
    }
    if (
      text.includes('eligible') ||
      text.includes('qualify') ||
      text.includes('why am i') ||
      text.includes('assessment') ||
      text.includes('recommendation')
    ) {
      return 'EXPLAIN_ELIGIBILITY';
    }
    if (
      text.includes('document') ||
      text.includes('certificate') ||
      text.includes('ocr') ||
      text.includes('proof') ||
      text.includes('income certificate')
    ) {
      return text.includes('ocr') ? 'EXPLAIN_OCR_RESULT' : 'EXPLAIN_DOCUMENTS';
    }
    if (
      text.includes('how to apply') ||
      text.includes('application step') ||
      text.includes('where to apply')
    ) {
      return 'EXPLAIN_APPLICATION_STEPS';
    }
    if (
      text.includes('summarize') ||
      text.includes('summary') ||
      text.includes('in brief') ||
      text.includes('short summary')
    ) {
      return 'SUMMARIZE_SCHEME';
    }
    if (
      text.includes('notification') ||
      text.includes('alert') ||
      text.includes('reminder') ||
      text.includes('why did i get')
    ) {
      return 'EXPLAIN_NOTIFICATION';
    }
    if (text.includes('help') || text.includes('portal') || text.includes('guide')) {
      return 'HELP_WITH_PORTAL';
    }
    if (context?.schemeId || context?.contextId) {
      return 'EXPLAIN_SCHEME';
    }

    return 'GENERAL_SCHEME_QUESTION';
  }

  /**
   * Retrieves verified, caller-scoped facts across Modules 2-7.
   * Strictly read-only, authorized, and data-minimized.
   */
  public async retrieveGroundedContext(
    userId: string,
    intent: AssistantIntent,
    context?: AssistantChatContextInput,
  ): Promise<GroundedContextData> {
    const grounded: GroundedContextData = {};
    const targetSchemeId =
      context?.schemeId ||
      (context?.contextType === AssistantContextType.SCHEME ? context.contextId : undefined);

    // 1. Module 3: Verified Scheme Facts
    if (targetSchemeId) {
      const schemeFacts = await schemeTool.getSchemeDetails(targetSchemeId, userId);
      if (schemeFacts) {
        grounded.scheme = schemeFacts;
      }
    }

    // 2. Module 4: Deterministic Recommendation Output
    if (
      intent === 'EXPLAIN_ELIGIBILITY' ||
      (context?.contextType === AssistantContextType.RECOMMENDATION && context.contextId) ||
      targetSchemeId
    ) {
      const recLookupKey =
        context?.contextType === AssistantContextType.RECOMMENDATION && context.contextId
          ? context.contextId
          : targetSchemeId;

      if (recLookupKey) {
        const recFacts = await recommendationTool.getRecommendation(userId, recLookupKey);
        if (recFacts) {
          grounded.recommendation = recFacts;
        }
      }
    }

    // 3. Module 6: Document Readiness & Verified Extracted Fields
    if (intent === 'EXPLAIN_DOCUMENTS' || intent === 'EXPLAIN_OCR_RESULT' || targetSchemeId) {
      if (targetSchemeId) {
        const docReadiness = await documentTool.getSchemeDocumentReadiness(userId, targetSchemeId);
        if (docReadiness) {
          grounded.documentReadiness = docReadiness;
        }
      }
    }

    // 4. Module 7: Notification Context
    if (
      intent === 'EXPLAIN_NOTIFICATION' ||
      context?.contextType === AssistantContextType.NOTIFICATION
    ) {
      if (context?.contextId) {
        const notif = await notificationTool.getNotification(userId, context.contextId);
        if (notif) {
          grounded.notification = notif;
        }
      } else {
        const recent = await notificationTool.getRecentNotifications(userId, 1);
        if (recent.length > 0) {
          grounded.notification = recent[0];
        }
      }
    }

    // 5. Module 5 / Module 3: Side-by-Side Comparison Context
    if (intent === 'COMPARE_SCHEMES' && context?.contextId) {
      const schemeIds = context.contextId
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (schemeIds.length > 0) {
        const comp = await schemeTool.compareSchemes(schemeIds, userId);
        if (comp) {
          grounded.comparison = {
            comparedCount: comp.comparedCount,
            schemes: comp.schemes.map((s) => ({
              id: s.id,
              name: s.name,
              benefitsSummary: s.benefitsSummary,
              requiredDocuments: s.requiredDocuments,
              applicationStatus: s.applicationStatus,
              officialApplicationUrl: s.officialApplicationUrl,
            })),
          };
        }
      }
    }

    // 6. Module 2: Minimized Profile Context (only when evaluating conditions)
    if (intent === 'EXPLAIN_ELIGIBILITY') {
      const profile = await profileTool.getProfileSummary(userId);
      if (profile) {
        grounded.profileSummary = profile;
      }
    }

    return grounded;
  }
}

export const groundingService = new GroundingService();
