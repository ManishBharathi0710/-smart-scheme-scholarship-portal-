import { useState, useEffect, useCallback } from 'react';
import { assistantApi } from '../api/assistant.api';
import {
  ConversationItemData,
  ConversationMessageItem,
  AssistantChatContextInput,
  SupportedLanguage,
} from '../../../types/assistant';

interface UseAssistantOptions {
  initialSchemeId?: string;
  autoLoad?: boolean;
}

export function useAssistant(options: UseAssistantOptions = {}) {
  const { initialSchemeId, autoLoad = true } = options;

  const [conversations, setConversations] = useState<ConversationItemData[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');

  // Load conversations list
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await assistantApi.getConversations(1, 20);
      setConversations(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load messages for a specific conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await assistantApi.getConversation(conversationId);
      setActiveConversationId(detail.id);
      setMessages(detail.messages);
      if (detail.language) {
        setSelectedLanguage(detail.language as SupportedLanguage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (text: string, contextOverride?: AssistantChatContextInput) => {
      if (!text.trim() || isSending) return;

      setIsSending(true);
      setError(null);

      // Optimistic user message
      const tempUserMsg: ConversationMessageItem = {
        id: `temp-${Date.now()}`,
        role: 'USER',
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      try {
        const context: AssistantChatContextInput = {
          schemeId: initialSchemeId,
          language: selectedLanguage,
          ...contextOverride,
        };

        const response = await assistantApi.sendMessage({
          message: text,
          conversationId: activeConversationId || undefined,
          context,
        });

        // Update active conversation ID if newly created
        if (!activeConversationId) {
          setActiveConversationId(response.conversationId);
          await loadConversations();
        }

        const assistantMsg: ConversationMessageItem = {
          id: response.messageId,
          role: 'ASSISTANT',
          content: response.answer,
          intent: response.intent,
          sources: response.sources,
          actions: response.actions,
          metadata: { confidence: response.confidence },
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'AI assistant is temporarily unavailable. Please try again.'
        );
        // Remove optimistic user message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, initialSchemeId, isSending, loadConversations, selectedLanguage]
  );

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await assistantApi.deleteConversation(conversationId);
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeConversationId === conversationId) {
          startNewConversation();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete conversation.');
      }
    },
    [activeConversationId, startNewConversation]
  );

  useEffect(() => {
    if (autoLoad) {
      loadConversations();
    }
  }, [autoLoad, loadConversations]);

  return {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    isSending,
    error,
    selectedLanguage,
    setSelectedLanguage,
    loadConversations,
    loadConversation,
    sendMessage,
    startNewConversation,
    deleteConversation,
    clearError: () => setError(null),
  };
}
