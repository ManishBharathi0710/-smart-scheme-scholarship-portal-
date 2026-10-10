import { AiPromptRequest, AiPromptResponse } from '../assistant.types.js';

export interface IAiProvider {
  /**
   * Generates a grounded completion adhering strictly to provided context.
   */
  generateCompletion(request: AiPromptRequest): Promise<AiPromptResponse>;
}
