import React, { useRef, useEffect } from 'react';
import { Bot, Plus, X, AlertCircle } from 'lucide-react';
import { useAssistant } from '../hooks/useAssistant';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestedQuestions } from './SuggestedQuestions';

interface AssistantPanelProps {
  schemeId?: string;
  schemeName?: string;
  onClose?: () => void;
  isFloating?: boolean;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  schemeId,
  schemeName,
  onClose,
  isFloating = false,
}) => {
  const {
    messages,
    isSending,
    error,
    selectedLanguage,
    setSelectedLanguage,
    sendMessage,
    startNewConversation,
    clearError,
  } = useAssistant({ initialSchemeId: schemeId });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div
      className={`flex flex-col bg-slate-50 border border-slate-200 rounded-2xl shadow-lg overflow-hidden ${
        isFloating ? 'h-[620px] max-h-[85vh] w-[95vw] sm:w-[460px]' : 'h-[750px] w-full'
      }`}
    >
      {/* Header */}
      <div className="bg-gov-900 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide">
              {schemeName ? `Assistant: ${schemeName}` : 'AI Scheme & Scholarship Assistant'}
            </h2>
            <p className="text-[11px] text-slate-300">
              {schemeId ? 'Context: Scheme Details' : 'Grounded Scheme Decision Support'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={startNewConversation}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-gov-800 transition"
            title="Start new conversation"
            aria-label="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-gov-800 transition"
              title="Close assistant"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-red-500 hover:text-red-700 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="py-6 px-2 text-center">
            <div className="w-12 h-12 rounded-full bg-gov-100 text-gov-800 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              How can I assist you today?
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
              Ask questions about scheme requirements, eligibility status, application deadlines,
              or required documents. Responses are grounded in official verified portal records.
            </p>

            <div className="text-left mt-4 border-t border-slate-200 pt-3">
              <SuggestedQuestions
                onSelect={handleSuggestedQuestion}
                hasSchemeContext={Boolean(schemeId)}
              />
            </div>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gov-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gov-600 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-gov-600 animate-pulse delay-100" />
              <div className="w-2 h-2 rounded-full bg-gov-600 animate-pulse delay-200" />
              <span className="text-xs text-slate-500 ml-1.5">Verifying grounded portal records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <ChatInput
        onSendMessage={sendMessage}
        disabled={isSending}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />
    </div>
  );
};
