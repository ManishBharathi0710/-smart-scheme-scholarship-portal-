import { ConversationRole, AssistantContextType } from '@prisma/client';

export type AssistantIntent =
  | 'EXPLAIN_SCHEME'
  | 'EXPLAIN_ELIGIBILITY'
  | 'EXPLAIN_DOCUMENTS'
  | 'EXPLAIN_APPLICATION_STEPS'
  | 'SUMMARIZE_SCHEME'
  | 'TRANSLATE_SCHEME'
  | 'EXPLAIN_NOTIFICATION'
  | 'EXPLAIN_OCR_RESULT'
  | 'HELP_WITH_PORTAL'
  | 'COMPARE_SCHEMES'
  | 'GENERAL_SCHEME_QUESTION';

export type AssistantConfidence = 'GROUNDED' | 'PARTIALLY_GROUNDED' | 'INSUFFICIENT_INFORMATION';

export type SupportedLanguage = 'en' | 'ta' | 'hi' | 'ml' | 'te' | 'kn';

export interface SourceReference {
  type: 'SCHEME' | 'RECOMMENDATION' | 'DOCUMENT' | 'NOTIFICATION' | 'PROFILE' | 'COMPARISON';
  id?: string;
  title: string;
  url?: string;
  description?: string;
}

export interface AssistantAction {
  type:
    | 'VIEW_SCHEME'
    | 'VIEW_RECOMMENDATION'
    | 'VIEW_DOCUMENTS'
    | 'OPEN_OFFICIAL_URL'
    | 'COMPARE_SCHEMES'
    | 'NAVIGATE';
  label: string;
  url?: string;
  payload?: Record<string, unknown>;
}

export interface AssistantChatContextInput {
  contextType?: AssistantContextType;
  contextId?: string;
  schemeId?: string;
  language?: SupportedLanguage;
}

export interface AssistantChatRequest {
  message: string;
  conversationId?: string;
  context?: AssistantChatContextInput;
}

export interface AssistantChatResponse {
  conversationId: string;
  messageId: string;
  answer: string;
  intent: AssistantIntent;
  language: SupportedLanguage;
  confidence: AssistantConfidence;
  sources: SourceReference[];
  actions: AssistantAction[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
  };
}

export interface GroundedContextData {
  scheme?: {
    id: string;
    slug: string;
    name: string;
    shortDescription?: string;
    description: string;
    programType: string;
    categories: string[];
    department: string;
    benefits: Array<{
      benefitType: string;
      amount?: number | null;
      frequency?: string | null;
      description?: string | null;
    }>;
    requiredDocuments: Array<{
      name: string;
      mandatory: boolean;
      issuingAuthority?: string | null;
    }>;
    eligibilityRules: Array<{
      field: string;
      operator: string;
      description?: string | null;
      mandatory: boolean;
    }>;
    activePeriod?: {
      status: string;
      openDate?: string | null;
      closeDate?: string | null;
    } | null;
    officialSourceUrl?: string | null;
    officialApplicationUrl?: string | null;
    applicationMethod?: string | null;
  };
  recommendation?: {
    id: string;
    schemeId: string;
    schemeName: string;
    eligibilityStatus: string;
    matchingRequirements: string[];
    missingRequirements: string[];
    uncertainRequirements: string[];
    missingInformation?: Array<{ field: string; message: string }>;
    evaluatedAt: Date | string;
  };
  documentReadiness?: {
    readinessStatus: string;
    readinessScore: number;
    missingMandatory: string[];
    missingOptional: string[];
    verifiedCount: number;
    extractedFieldsSummary?: Record<string, unknown>;
  };
  notification?: {
    id: string;
    title: string;
    message: string;
    type: string;
    sentAt?: Date | string | null;
    actionUrl?: string | null;
  };
  profileSummary?: {
    age?: number | null;
    state?: string | null;
    educationLevel?: string | null;
    socialCategory?: string | null;
    occupationType?: string | null;
    isMinority?: boolean;
    isDifferentlyAbled?: boolean;
  };
  comparison?: {
    comparedCount: number;
    schemes: Array<{
      id: string;
      name: string;
      benefitsSummary: string[];
      requiredDocuments: string[];
      applicationStatus: string;
      officialApplicationUrl?: string | null;
    }>;
  };
}

export interface AiPromptRequest {
  systemPrompt: string;
  conversationHistory: Array<{
    role: ConversationRole;
    content: string;
  }>;
  userMessage: string;
  groundedContext: GroundedContextData;
  language: SupportedLanguage;
  intent: AssistantIntent;
}

export interface AiPromptResponse {
  answer: string;
  intent: AssistantIntent;
  confidence: AssistantConfidence;
  sources: SourceReference[];
  actions: AssistantAction[];
  inputTokens: number;
  outputTokens: number;
}
