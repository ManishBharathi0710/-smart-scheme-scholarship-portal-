export type AssistantContextType =
  | 'GENERAL'
  | 'SCHEME'
  | 'RECOMMENDATION'
  | 'DOCUMENT'
  | 'NOTIFICATION'
  | 'PROFILE'
  | 'COMPARISON';

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

export interface ConversationItemData {
  id: string;
  title: string;
  contextType: AssistantContextType;
  contextId?: string | null;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessageItem {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  intent?: string | null;
  sources?: SourceReference[] | null;
  actions?: AssistantAction[] | null;
  metadata?: {
    confidence?: AssistantConfidence;
  } | null;
  createdAt: string;
}

export interface ConversationDetailResponse {
  id: string;
  title: string;
  contextType: AssistantContextType;
  contextId?: string | null;
  language: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessageItem[];
}

export interface ConversationListResponse {
  items: ConversationItemData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
