import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { AssistantPanel } from './AssistantPanel';
import { useAuth } from '../../auth/context/AuthContext';

export const FloatingAssistantButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // If user is not logged in, don't show floating assistant
  if (!isAuthenticated) return null;

  // Extract scheme context from URL if on scheme detail page
  let schemeId: string | undefined;
  const schemeMatch = location.pathname.match(/\/schemes\/([^/]+)/);
  if (schemeMatch && schemeMatch[1] && schemeMatch[1] !== 'saved' && schemeMatch[1] !== 'compare') {
    schemeId = schemeMatch[1];
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="relative shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <AssistantPanel
            schemeId={schemeId}
            onClose={() => setIsOpen(false)}
            isFloating
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-gov-800 hover:bg-gov-900 text-white px-4 py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 border border-gov-700 focus:outline-none focus:ring-4 focus:ring-gov-400"
          aria-label="Open AI Scheme Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          </div>
          <span className="font-semibold text-sm tracking-wide">
            AI Assistant
          </span>
        </button>
      )}
    </div>
  );
};
