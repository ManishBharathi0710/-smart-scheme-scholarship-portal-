import React from 'react';
import { ExternalLink, BookOpen, CheckCircle, FileText, Bell } from 'lucide-react';
import { SourceReference } from '../../../types/assistant';

interface SourceReferencesProps {
  sources: SourceReference[];
}

export const SourceReferences: React.FC<SourceReferencesProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'SCHEME':
        return <BookOpen className="w-3.5 h-3.5 text-blue-600" />;
      case 'RECOMMENDATION':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'DOCUMENT':
        return <FileText className="w-3.5 h-3.5 text-purple-600" />;
      case 'NOTIFICATION':
        return <Bell className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-200 text-xs">
      <div className="flex items-center gap-1.5 font-medium text-slate-600 mb-1.5">
        <span>Verified Sources &amp; Citations:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {getSourceIcon(source.type)}
            <span className="font-medium truncate max-w-[200px]" title={source.title}>
              {source.title}
            </span>
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 ml-0.5"
                title="Open official source link"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
