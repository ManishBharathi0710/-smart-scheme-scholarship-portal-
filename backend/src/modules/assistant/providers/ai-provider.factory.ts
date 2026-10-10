import { IAiProvider } from './ai-provider.interface.js';
import { MockAiProvider } from './mock-ai-provider.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

class AiProviderFactory {
  private providerInstance: IAiProvider | null = null;

  public getProvider(): IAiProvider {
    if (this.providerInstance) {
      return this.providerInstance;
    }

    const providerType = env.AI_PROVIDER;

    switch (providerType) {
      case 'GEMINI':
      case 'OPENAI':
        if (!env.AI_API_KEY) {
          logger.warn({
            provider: providerType,
            msg: 'AI_API_KEY not configured. Falling back to secure MockAiProvider.',
          });
          this.providerInstance = new MockAiProvider();
        } else {
          // Can be extended with real HTTP adapters when key is provided
          this.providerInstance = new MockAiProvider();
        }
        break;

      case 'MOCK':
      default:
        this.providerInstance = new MockAiProvider();
        break;
    }

    return this.providerInstance;
  }
}

export const aiProviderFactory = new AiProviderFactory();
