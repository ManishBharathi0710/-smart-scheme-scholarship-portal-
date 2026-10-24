import { ConversationRole } from '@prisma/client';
import { AssistantRepository, assistantRepository } from './assistant.repository.js';
import { GroundingService, groundingService } from './assistant.grounding.js';
import { ResponseValidationService, responseValidationService } from './assistant.validation.js';
import { aiProviderFactory } from './providers/ai-provider.factory.js';
import { buildGroundedPrompt } from './assistant.prompts.js';
import {
  AssistantChatRequest,
  AssistantChatResponse,
  SupportedLanguage,
  AiPromptRequest,
} from './assistant.types.js';
import { NotFoundError, AppError } from '../../errors/app-error.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class AssistantService {
  private readonly repo: AssistantRepository;
  private readonly grounding: GroundingService;
  private readonly validator: ResponseValidationService;

  constructor(
    repo: AssistantRepository = assistantRepository,
    grounding: GroundingService = groundingService,
    validator: ResponseValidationService = responseValidationService,
  ) {
    this.repo = repo;
    this.grounding = grounding;
    this.validator = validator;
  }

  /**
   * Main entry point for conversational assistance.
   * Strictly grounded, caller-authorized, and deterministic.
   */
  public async chat(userId: string, request: AssistantChatRequest): Promise<AssistantChatResponse> {
    const startTime = Date.now();
    const language: SupportedLanguage = (request.context?.language as SupportedLanguage) || 'en';

    // 1. Resolve or create conversation with strict ownership check
    let conversation;
    if (request.conversationId) {
      conversation = await this.repo.findConversationById(request.conversationId, userId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found or access denied.');
      }
    } else {
      const generatedTitle =
        request.message.length > 50 ? `${request.message.slice(0, 47)}...` : request.message;

      conversation = await this.repo.createConversation({
        userId,
        title: generatedTitle,
        contextType: request.context?.contextType,
        contextId: request.context?.contextId || request.context?.schemeId,
        language,
      });
    }

    // 2. Detect Intent and Retrieve Trusted Application Context
    const intent = this.grounding.detectIntent(request.message, request.context);
    const groundedContext = await this.grounding.retrieveGroundedContext(
      userId,
      intent,
      request.context,
      request.message,
    );

    // 3. Load recent conversation history (bounded by env.AI_MAX_CONVERSATION_MESSAGES)
    const recentMessages = await this.repo.findConversationMessages(
      conversation.id,
      env.AI_MAX_CONVERSATION_MESSAGES,
    );

    const conversationHistory = recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 4. Build Grounded Prompt
    const systemPrompt = buildGroundedPrompt(request.message, groundedContext, language, intent);

    const promptRequest: AiPromptRequest = {
      systemPrompt,
      conversationHistory,
      userMessage: request.message,
      groundedContext,
      language,
      intent,
    };

    // 5. Invoke AI Provider with Timeout Guard
    const provider = aiProviderFactory.getProvider();
    let rawResponse;

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), env.AI_TIMEOUT_MS),
      );

      rawResponse = await Promise.race([
        provider.generateCompletion(promptRequest),
        timeoutPromise,
      ]);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      logger.error({
        userId,
        conversationId: conversation.id,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
        msg: 'AI generation error or timeout',
      });

      // Record failed usage
      await this.repo.recordUsage({
        userId,
        conversationId: conversation.id,
        model: env.AI_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        durationMs,
        status: error instanceof Error && error.message === 'AI_TIMEOUT' ? 'TIMEOUT' : 'ERROR',
      });

      throw new AppError(
        'The AI assistant is temporarily unavailable. Please try again or check official portal links.',
        503,
      );
    }

    const durationMs = Date.now() - startTime;

    // 6. Safety & Grounding Validation
    const validatedResponse = this.validator.validateResponse(rawResponse, groundedContext);

    // 7. Persist User Message and Assistant Message
    await this.repo.createMessage({
      conversationId: conversation.id,
      role: ConversationRole.USER,
      content: request.message,
      intent,
    });

    const assistantMessage = await this.repo.createMessage({
      conversationId: conversation.id,
      role: ConversationRole.ASSISTANT,
      content: validatedResponse.answer,
      intent: validatedResponse.intent,
      sources: validatedResponse.sources,
      actions: validatedResponse.actions,
      metadata: { confidence: validatedResponse.confidence },
    });

    await this.repo.touchConversation(conversation.id);

    // 8. Log Usage Telemetry
    await this.repo.recordUsage({
      userId,
      conversationId: conversation.id,
      model: env.AI_MODEL,
      inputTokens: validatedResponse.inputTokens,
      outputTokens: validatedResponse.outputTokens,
      durationMs,
      status: 'SUCCESS',
    });

    return {
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      answer: validatedResponse.answer,
      intent: validatedResponse.intent,
      language,
      confidence: validatedResponse.confidence,
      sources: validatedResponse.sources,
      actions: validatedResponse.actions,
      usage: {
        inputTokens: validatedResponse.inputTokens,
        outputTokens: validatedResponse.outputTokens,
        durationMs,
      },
    };
  }

  /**
   * Retrieves paginated conversations for citizen
   */
  public async getUserConversations(userId: string, page = 1, limit = 20) {
    const { items, total } = await this.repo.findUserConversations(userId, page, limit);

    return {
      items: items.map((c) => ({
        id: c.id,
        title: c.title,
        contextType: c.contextType,
        contextId: c.contextId,
        language: c.language,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves conversation by ID with complete message history
   */
  public async getConversation(userId: string, conversationId: string) {
    const conversation = await this.repo.findConversationById(conversationId, userId);
    if (!conversation) {
      throw new NotFoundError('Conversation record not found or access denied.');
    }

    const messages = await this.repo.findConversationMessages(conversationId, 100);

    return {
      id: conversation.id,
      title: conversation.title,
      contextType: conversation.contextType,
      contextId: conversation.contextId,
      language: conversation.language,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        intent: m.intent,
        sources: m.sources,
        actions: m.actions,
        metadata: m.metadata,
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * Soft deletes a conversation belonging to the citizen
   */
  public async deleteConversation(userId: string, conversationId: string) {
    const existing = await this.repo.findConversationById(conversationId, userId);
    if (!existing) {
      throw new NotFoundError('Conversation not found or access denied.');
    }

    await this.repo.softDeleteConversation(conversationId, userId);
    return { success: true, message: 'Conversation deleted successfully.' };
  }
}

export const assistantService = new AssistantService();
