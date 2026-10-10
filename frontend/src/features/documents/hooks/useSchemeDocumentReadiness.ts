import { useState, useEffect, useCallback } from 'react';
import { documentsApi } from '../api/documents.api';
import { SchemeDocumentReadiness } from '../../../types/document';

export function useSchemeDocumentReadiness(schemeId: string | undefined) {
  const [readiness, setReadiness] = useState<SchemeDocumentReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReadiness = useCallback(async () => {
    if (!schemeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await documentsApi.getSchemeDocumentReadiness(schemeId);
      setReadiness(data);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Unable to assess scheme document readiness.');
    } finally {
      setLoading(false);
    }
  }, [schemeId]);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  return {
    readiness,
    loading,
    error,
    refetch: fetchReadiness,
  };
}
