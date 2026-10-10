import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import { ConversationMessageItem, AssistantAction } from '../../../types/assistant';
import { SourceReferences } from './SourceReferences';

interface ChatMessageProps {
  message: ConversationMessageItem;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'ASSISTANT';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActionClick = (action: AssistantAction) => {
    if (action.type === 'OPEN_OFFICIAL_URL' && action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (action.type === 'VIEW_SCHEME') {
      const slug = action.payload?.['slug'] || action.payload?.['schemeId'];
      if (slug) {
        navigate(`/schemes/${slug}`);
      } else {
        navigate('/schemes');
      }
      return;
    }

    if (action.type === 'VIEW_RECOMMENDATION') {
      const recId = action.payload?.['recommendationId'];
      if (recId) {
        navigate(`/recommendations/${recId}`);
      } else {
        navigate('/recommendations');
      }
      return;
    }

    if (action.type === 'VIEW_DOCUMENTS') {
      navigate('/documents');
      return;
    }

    if (action.type === 'COMPARE_SCHEMES') {
      navigate('/compare');
      return;
    }

    if (action.url) {
      if (action.url.startsWith('http')) {
        window.open(action.url, '_blank', 'noopener,noreferrer');
      } else {
        navigate(action.url);
      }
    }
  };

  return (
    <div className={`flex gap-3 mb-4 ${isAssistant ? 'items-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-gov-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${
          isAssistant
            ? 'bg-white border border-slate-200 text-slate-800'
            : 'bg-gov-800 text-white ml-auto'
        }`}
      >
        {/* Header badges for Assistant */}
        {isAssistant && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grounded in verified portal data</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
              title="Copy answer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Message Content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {message.content}
        </div>

        {/* Action Buttons */}
        {isAssistant && message.actions && message.actions.length > 0 && (
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
            {message.actions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleActionClick(action)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  action.type === 'OPEN_OFFICIAL_URL'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                    : 'bg-gov-50 hover:bg-gov-100 text-gov-800 border border-gov-200'
                }`}
              >
                <span>{action.label}</span>
                {action.type === 'OPEN_OFFICIAL_URL' ? (
                  <ExternalLink className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Source References */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <SourceReferences sources={message.sources} />
        )}
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
