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
import { schemesService } from '../schemes/schemes.service.js';
import { AssistantContextType, SchemeCategory } from '@prisma/client';
import { SchemeFilterQuery } from '../schemes/schemes.types.js';

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
      text.includes('versus') ||
      text.includes('central and state')
    ) {
      return 'COMPARE_SCHEMES';
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
    if (
      text.includes('document') ||
      text.includes('certificate') ||
      text.includes('ocr') ||
      text.includes('proof') ||
      text.includes('income certificate') ||
      text.includes('prepare my document')
    ) {
      return text.includes('ocr') ? 'EXPLAIN_OCR_RESULT' : 'EXPLAIN_DOCUMENTS';
    }
    if (
      text.includes('eligible') ||
      text.includes('qualify') ||
      text.includes('why am i') ||
      text.includes('assessment')
    ) {
      return 'EXPLAIN_ELIGIBILITY';
    }
    if (context?.schemeId || context?.contextId) {
      return 'EXPLAIN_SCHEME';
    }
    if (
      text.includes('recommendation') ||
      text.includes('scholarship') ||
      text.includes('education profile') ||
      text.includes('match')
    ) {
      return 'EXPLAIN_ELIGIBILITY';
    }
    if (text.includes('help') || text.includes('portal') || text.includes('guide')) {
      return 'HELP_WITH_PORTAL';
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
    message?: string,
  ): Promise<GroundedContextData> {
    const grounded: GroundedContextData = {};
    const text = (message || '').toLowerCase();
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

    // 6. Module 2: Minimized Profile Context (Available for authorized citizen guidance)
    if (userId) {
      const profile = await profileTool.getProfileSummary(userId);
      if (profile) {
        grounded.profileSummary = profile;
      }
    }

    // 7. Catalog Search / Scheme Grounding when no single scheme selected
    if (!grounded.scheme && text) {
      try {
        const isScholarshipSearch =
          text.includes('scholarship') ||
          text.includes('education') ||
          text.includes('match my education');
        const filterQuery: SchemeFilterQuery = isScholarshipSearch
          ? { category: SchemeCategory.EDUCATION, pageSize: 6 }
          : { pageSize: 6 };

        const catalog = await schemesService.getPublishedSchemes(filterQuery, userId);
        if (catalog?.items?.length) {
          grounded.matchingSchemes = catalog.items.map((s) => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
            shortDescription: s.shortDescription || undefined,
            programType: s.programType,
            categories: s.categories,
            department: s.departmentName,
            primaryBenefit: s.primaryBenefit
              ? {
                  type: s.primaryBenefit.type,
                  amount: s.primaryBenefit.amount,
                  frequency: s.primaryBenefit.frequency,
                  description: s.primaryBenefit.description,
                }
              : null,
            applicationStatus: s.activeApplicationPeriod?.status || 'OPEN',
            officialApplicationUrl: `/schemes/${s.slug}`,
          }));
        }
      } catch {
        // Non-blocking catalog retrieval
      }
    }

    return grounded;
  }
}

export const groundingService = new GroundingService();
