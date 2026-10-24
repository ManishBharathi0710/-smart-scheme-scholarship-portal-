import { IAiProvider } from './ai-provider.interface.js';
import {
  AiPromptRequest,
  AiPromptResponse,
  SourceReference,
  AssistantAction,
} from '../assistant.types.js';
import { MockAiProvider } from './mock-ai-provider.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

export class GeminiAiProvider implements IAiProvider {
  private readonly fallbackProvider: MockAiProvider;

  constructor() {
    this.fallbackProvider = new MockAiProvider();
  }

  public async generateCompletion(request: AiPromptRequest): Promise<AiPromptResponse> {
    const apiKey = env.AI_API_KEY || process.env['GEMINI_API_KEY'];

    if (!apiKey) {
      return this.fallbackProvider.generateCompletion(request);
    }

    try {
      const model = env.AI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // Build Gemini contents structure
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      // Add recent conversation history
      if (request.conversationHistory && request.conversationHistory.length > 0) {
        request.conversationHistory.slice(-6).forEach((msg) => {
          contents.push({
            role: msg.role === 'ASSISTANT' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        });
      }

      // Add current grounded user query
      contents.push({
        role: 'user',
        parts: [
          {
            text: `${request.systemPrompt}\n\nCitizen User Message: ${request.userMessage}`,
          },
        ],
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: env.AI_TEMPERATURE || 0.2,
            maxOutputTokens: env.AI_MAX_TOKENS || 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn({
          status: response.status,
          error: errorText,
          msg: 'Gemini API call failed, falling back to Grounded Engine',
        });
        return this.fallbackProvider.generateCompletion(request);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        };
      };

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        return this.fallbackProvider.generateCompletion(request);
      }

      // Collect sources from grounded context
      const sources: SourceReference[] = [];
      const actions: AssistantAction[] = [];

      if (request.groundedContext.scheme) {
        const s = request.groundedContext.scheme;
        sources.push({
          type: 'SCHEME',
          id: s.id,
          title: s.name,
          url: s.officialSourceUrl || s.officialApplicationUrl || undefined,
        });
        actions.push({
          type: 'VIEW_SCHEME',
          label: 'View Scheme Details',
          payload: { schemeId: s.id, slug: s.slug },
        });
        if (s.officialApplicationUrl) {
          actions.push({
            type: 'OPEN_OFFICIAL_URL',
            label: 'Open Official Portal',
            url: s.officialApplicationUrl,
          });
        }
      }

      if (request.groundedContext.matchingSchemes) {
        request.groundedContext.matchingSchemes.forEach((s) => {
          sources.push({
            type: 'SCHEME',
            id: s.id,
            title: s.name,
            url: s.officialApplicationUrl || undefined,
          });
        });
      }

      if (actions.length === 0) {
        actions.push({
          type: 'NAVIGATE',
          label: 'Explore Catalog',
          url: '/schemes',
        });
      }

      return {
        answer: generatedText,
        intent: request.intent,
        confidence: 'GROUNDED',
        sources,
        actions,
        inputTokens: data.usageMetadata?.promptTokenCount || 100,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 120,
      };
    } catch (err) {
      logger.warn({
        error: err instanceof Error ? err.message : String(err),
        msg: 'Gemini provider exception, falling back to Grounded Engine',
      });
      return this.fallbackProvider.generateCompletion(request);
    }
  }
}
