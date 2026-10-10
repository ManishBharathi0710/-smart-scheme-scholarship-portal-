import React, { useState, KeyboardEvent } from 'react';
import { Send, Globe, Loader2 } from 'lucide-react';
import { SupportedLanguage } from '../../../types/assistant';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

const languages: Array<{ code: SupportedLanguage; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  selectedLanguage,
  onLanguageChange,
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3 sm:p-4 rounded-b-xl">
      {/* Top control bar: Language Selector + Character Counter */}
      <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-600">Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-gov-500"
            disabled={disabled}
            aria-label="Select assistant language"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <span>{text.length}/2000</span>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about schemes, documents, or eligibility..."
          disabled={disabled}
          maxLength={2000}
          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-600 focus:bg-white transition"
          aria-label="Type your scheme question"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="bg-gov-700 hover:bg-gov-800 disabled:bg-slate-300 text-white rounded-xl px-4 py-2.5 flex items-center justify-center font-medium transition shadow-sm shrink-0"
          aria-label="Send message"
        >
          {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Mandatory Official Disclaimer */}
      <p className="mt-2 text-[11px] text-slate-500 text-center leading-tight">
        AI responses help explain verified scheme information. Official eligibility and application
        decisions are strictly governed by respective scheme authorities.
      </p>
    </div>
  );
};
