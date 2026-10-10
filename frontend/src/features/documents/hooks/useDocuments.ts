import { useState, useEffect, useCallback } from 'react';
import { documentsApi, DocumentListParams } from '../api/documents.api';
import { UserDocument, DocumentExtraction, ConfirmExtractionInput } from '../../../types/document';

export function useDocuments(initialParams?: DocumentListParams) {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [params, setParams] = useState<DocumentListParams>(initialParams || { onlyCurrent: true });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await documentsApi.getDocuments(params);
      setDocuments(res.items);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (formData: FormData): Promise<UserDocument> => {
    const doc = await documentsApi.uploadDocument(formData);
    await fetchDocuments();
    return doc;
  };

  const deleteDocument = async (id: string): Promise<void> => {
    await documentsApi.deleteDocument(id);
    await fetchDocuments();
  };

  const requestOcr = async (id: string, consent: boolean): Promise<DocumentExtraction> => {
    const ext = await documentsApi.requestOcr(id, consent);
    await fetchDocuments();
    return ext;
  };

  const confirmExtraction = async (
    id: string,
    input: ConfirmExtractionInput,
  ): Promise<DocumentExtraction> => {
    const ext = await documentsApi.confirmExtraction(id, input);
    await fetchDocuments();
    return ext;
  };

  const downloadDocument = async (id: string, fileName: string): Promise<void> => {
    await documentsApi.downloadDocumentFile(id, fileName);
  };

  return {
    documents,
    loading,
    error,
    pagination,
    params,
    setParams,
    refetch: fetchDocuments,
    uploadDocument,
    deleteDocument,
    requestOcr,
    confirmExtraction,
    downloadDocument,
  };
}
