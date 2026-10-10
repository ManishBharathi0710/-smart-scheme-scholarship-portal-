import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, X } from 'lucide-react';
import { Button } from '../../../components/ui';

interface CompareTrayProps {
  selectedIds: string[];
  maxAllowed?: number;
  onClear: () => void;
}

export const CompareTray: React.FC<CompareTrayProps> = ({
  selectedIds,
  maxAllowed = 4,
  onClear,
}) => {
  const navigate = useNavigate();

  if (selectedIds.length === 0) {
    return null;
  }

  const handleCompareClick = () => {
    navigate(`/compare?ids=${selectedIds.join(',')}`);
  };

  return (
    <aside
      aria-label="Scheme comparison selection bar"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/80 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="p-2 rounded-lg bg-gov-800 text-amber-300">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <span>Compare Schemes</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300 font-mono">
              {selectedIds.length}/{maxAllowed}
            </span>
          </p>
          <p className="text-[11px] text-slate-300 hidden sm:block">
            {selectedIds.length === 1
              ? 'Select at least 1 more scheme for side-by-side comparison'
              : 'View side-by-side factual comparison'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded transition-colors flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>

        <Button
          size="sm"
          variant="primary"
          onClick={handleCompareClick}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-transparent text-xs sm:text-sm"
        >
          <span>Compare Now</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </aside>
  );
};
