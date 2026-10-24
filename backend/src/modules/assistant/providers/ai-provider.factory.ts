import { IAiProvider } from './ai-provider.interface.js';
import { MockAiProvider } from './mock-ai-provider.js';
import { GeminiAiProvider } from './gemini-ai-provider.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

class AiProviderFactory {
  private providerInstance: IAiProvider | null = null;

  public getProvider(): IAiProvider {
    if (this.providerInstance) {
      return this.providerInstance;
    }

    const providerType = env.AI_PROVIDER;
    const apiKey = env.AI_API_KEY || process.env['GEMINI_API_KEY'];

    switch (providerType) {
      case 'GEMINI':
      case 'OPENAI':
        if (!apiKey) {
          logger.info({
            provider: providerType,
            msg: 'No external AI API key configured. Using grounded portal AI engine.',
          });
          this.providerInstance = new MockAiProvider();
        } else {
          logger.info({
            provider: 'GEMINI',
            msg: 'Google Gemini AI provider initialized with grounded portal context.',
          });
          this.providerInstance = new GeminiAiProvider();
        }
        break;

      case 'MOCK':
      default:
        if (apiKey) {
          this.providerInstance = new GeminiAiProvider();
        } else {
          this.providerInstance = new MockAiProvider();
        }
        break;
    }

    return this.providerInstance;
  }
}

export const aiProviderFactory = new AiProviderFactory();
