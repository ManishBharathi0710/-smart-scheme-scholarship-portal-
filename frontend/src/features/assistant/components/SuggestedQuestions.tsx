import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  hasSchemeContext?: boolean;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelect,
  hasSchemeContext = false,
}) => {
  const schemeQuestions = [
    'What are the key benefits of this scheme?',
    'What documents are required to apply?',
    'Why am I marked Likely Eligible or Not Eligible?',
    'What is the application deadline?',
    'How do I apply on the official government portal?',
    'Summarize this scheme in simple terms',
  ];

  const generalQuestions = [
    'Which scholarships match my education profile?',
    'Why do I need an income certificate?',
    'What is the difference between Central and State schemes?',
    'How does the recommendation engine assess my eligibility?',
    'How can I prepare my documents for scheme applications?',
  ];

  const questions = hasSchemeContext ? schemeQuestions : generalQuestions;

  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Suggested Questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(q)}
            className="text-xs bg-white hover:bg-gov-50 text-slate-700 hover:text-gov-800 border border-slate-200 hover:border-gov-300 rounded-full px-3 py-1.5 transition text-left"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
