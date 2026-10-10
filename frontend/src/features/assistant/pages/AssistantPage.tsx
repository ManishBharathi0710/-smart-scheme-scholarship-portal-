import React from 'react';
import { Bot, MessageSquare, Trash2, Plus, ShieldCheck, Info } from 'lucide-react';
import { useAssistant } from '../hooks/useAssistant';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { SuggestedQuestions } from '../components/SuggestedQuestions';

export const AssistantPage: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    messages,
    isSending,
    error,
    selectedLanguage,
    setSelectedLanguage,
    loadConversation,
    sendMessage,
    startNewConversation,
    deleteConversation,
    clearError,
  } = useAssistant();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title & Intro */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-gov-100 text-gov-800 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              AI Scheme &amp; Scholarship Assistant
            </h1>
          </div>
          <p className="text-sm text-slate-600">
            Multilingual conversational assistance grounded strictly in verified government records and
            deterministic recommendation assessments.
          </p>
        </div>

        {/* Safety Disclaimer Pill */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-xl self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Factual &amp; Grounded &bull; Zero Hallucination Policy</span>
        </div>
      </div>

      {/* Main Grid: Sidebar + Chat Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar: Conversations History */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-gov-700" />
              <span>Conversations</span>
            </h2>
            <button
              type="button"
              onClick={startNewConversation}
              className="p-1.5 text-gov-700 hover:text-gov-900 hover:bg-gov-50 rounded-lg transition"
              title="Start New Chat"
              aria-label="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No past conversations yet.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition cursor-pointer ${
                    activeConversationId === c.id
                      ? 'bg-gov-50 border border-gov-200 text-gov-900 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  onClick={() => loadConversation(c.id)}
                >
                  <div className="truncate flex-1 pr-2">
                    <span className="block truncate">{c.title}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition"
                    title="Delete conversation"
                    aria-label={`Delete ${c.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Core Principles Info box */}
          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 p-3 rounded-xl text-[11px] text-slate-500 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Info className="w-3.5 h-3.5 text-gov-700" />
              <span>How Assistant Works</span>
            </div>
            <p>
              &bull; Explains eligibility computed by Module 4 without modifying results.
            </p>
            <p>
              &bull; Summarizes verified schemes and required documents.
            </p>
            <p>
              &bull; Never asks for or reveals sensitive identity data.
            </p>
          </div>
        </div>

        {/* Right Area: Interactive Assistant Panel */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[750px] overflow-hidden">
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Active Grounded Session
              </span>
            </div>

            <button
              type="button"
              onClick={startNewConversation}
              className="text-xs font-medium text-gov-700 hover:text-gov-900 bg-white border border-slate-200 hover:border-gov-300 rounded-lg px-3 py-1.5 transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Topic</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center justify-between">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="font-semibold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="py-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-gov-50 text-gov-800 flex items-center justify-center mx-auto mb-4 shadow-sm border border-gov-100">
                  <Bot className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  Welcome to AI Scheme Assistant
                </h2>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  I can explain eligibility evaluations, summarize scholarship details, clarify
                  document requirements, and guide you to official government portals.
                </p>

                <div className="text-left border-t border-slate-100 pt-4">
                  <SuggestedQuestions onSelect={(q) => sendMessage(q)} />
                </div>
              </div>
            ) : (
              messages.map((m) => <ChatMessage key={m.id} message={m} />)
            )}

            {isSending && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gov-700 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-600 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gov-600 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-gov-600 animate-pulse delay-100" />
                  <div className="w-2 h-2 rounded-full bg-gov-600 animate-pulse delay-200" />
                  <span>Retrieving verified scheme data &amp; generating grounded explanation...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isSending}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
        </div>
      </div>
    </div>
  );
};
