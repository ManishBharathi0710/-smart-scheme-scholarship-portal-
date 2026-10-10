import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savedSchemesApi } from '../api/saved-schemes.api';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../../components/ui/Toast';

export function useSavedSchemes() {
  let isAuthenticated = false;
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
  } catch {
    isAuthenticated = false;
  }
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: savedIdsData, isLoading } = useQuery({
    queryKey: ['saved-scheme-ids'],
    queryFn: () => savedSchemesApi.getSavedSchemeIds(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const savedSet = new Set<string>(savedIdsData?.schemeIds || []);

  const saveMutation = useMutation({
    mutationFn: (schemeId: string) => savedSchemesApi.saveScheme(schemeId),
    onSuccess: (_, schemeId) => {
      queryClient.setQueryData(['saved-scheme-ids'], (old: { schemeIds: string[]; count: number } | undefined) => {
        const current = old?.schemeIds || [];
        if (!current.includes(schemeId)) {
          return { schemeIds: [...current, schemeId], count: current.length + 1 };
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['saved-schemes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Scheme saved to your collection.', 'success');
    },
    onError: () => {
      showToast('Failed to save scheme. Please try again.', 'error');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (schemeId: string) => savedSchemesApi.removeSavedScheme(schemeId),
    onSuccess: (_, schemeId) => {
      queryClient.setQueryData(['saved-scheme-ids'], (old: { schemeIds: string[]; count: number } | undefined) => {
        const current = old?.schemeIds || [];
        const next = current.filter((id) => id !== schemeId);
        return { schemeIds: next, count: next.length };
      });
      queryClient.invalidateQueries({ queryKey: ['saved-schemes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Scheme removed from your collection.', 'info');
    },
    onError: () => {
      showToast('Failed to remove saved scheme. Please try again.', 'error');
    },
  });

  const isSaved = (schemeId: string) => savedSet.has(schemeId);

  const toggleSave = async (schemeId: string) => {
    if (!isAuthenticated) {
      showToast('Please sign in to save schemes to your collection.', 'warning');
      return;
    }

    if (isSaved(schemeId)) {
      await removeMutation.mutateAsync(schemeId);
    } else {
      await saveMutation.mutateAsync(schemeId);
    }
  };

  return {
    savedSchemeIds: savedSet,
    isSaved,
    toggleSave,
    isLoading,
    isMutating: saveMutation.isPending || removeMutation.isPending,
  };
}
