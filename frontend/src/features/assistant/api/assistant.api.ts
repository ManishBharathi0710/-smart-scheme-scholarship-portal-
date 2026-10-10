import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import {
  AssistantChatRequest,
  AssistantChatResponse,
  ConversationListResponse,
  ConversationDetailResponse,
} from '../../../types/assistant';

export const assistantApi = {
  /**
   * POST /assistant/chat - Send message to grounded AI assistant
   */
  async sendMessage(data: AssistantChatRequest): Promise<AssistantChatResponse> {
    const res = await apiClient.post<ApiSuccessResponse<AssistantChatResponse>>(
      '/assistant/chat',
      data
    );
    return res.data.data;
  },

  /**
   * GET /assistant/conversations - List citizen's conversations
   */
  async getConversations(page = 1, limit = 20): Promise<ConversationListResponse> {
    const res = await apiClient.get<ApiSuccessResponse<ConversationListResponse>>(
      '/assistant/conversations',
      { params: { page, limit } }
    );
    return res.data.data;
  },

  /**
   * GET /assistant/conversations/:id - Get conversation by ID with message history
   */
  async getConversation(conversationId: string): Promise<ConversationDetailResponse> {
    const res = await apiClient.get<ApiSuccessResponse<ConversationDetailResponse>>(
      `/assistant/conversations/${conversationId}`
    );
    return res.data.data;
  },

  /**
   * DELETE /assistant/conversations/:id - Soft delete conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/assistant/conversations/${conversationId}`);
  },
};
