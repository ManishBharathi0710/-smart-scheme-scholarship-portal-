import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../components/ui/Toast';

const STORAGE_KEY = 'portal_scheme_comparison_ids';
const MAX_COMPARISON_SCHEMES = 4;

export function useCompareSelection() {
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_COMPARISON_SCHEMES);
        }
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }
    return [];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      // Ignore quota/sessionStorage errors
    }
  }, [selectedIds]);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds],
  );

  const toggleCompare = useCallback(
    (id: string, schemeName?: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          const next = prev.filter((item) => item !== id);
          showToast(`Removed from comparison${schemeName ? `: ${schemeName}` : ''}.`, 'info');
          return next;
        }

        if (prev.length >= MAX_COMPARISON_SCHEMES) {
          showToast(
            `You can compare up to ${MAX_COMPARISON_SCHEMES} schemes at a time. Remove one to add another.`,
            'warning',
          );
          return prev;
        }

        showToast(`Added to comparison (${prev.length + 1}/${MAX_COMPARISON_SCHEMES}).`, 'success');
        return [...prev, id];
      });
    },
    [showToast],
  );

  const clearCompare = useCallback(() => {
    setSelectedIds([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    selectedIds,
    isSelected,
    toggleCompare,
    clearCompare,
    count: selectedIds.length,
    maxAllowed: MAX_COMPARISON_SCHEMES,
  };
}
