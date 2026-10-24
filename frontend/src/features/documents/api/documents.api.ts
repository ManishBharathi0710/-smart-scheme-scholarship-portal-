import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import {
  UserDocument,
  DocumentExtraction,
  ConfirmExtractionInput,
  SchemeDocumentReadiness,
  DocumentCategory,
  DocumentStatus,
  OcrStatus,
} from '../../../types/document';

export interface DocumentListParams {
  page?: number;
  limit?: number;
  documentType?: string;
  documentCategory?: DocumentCategory;
  documentStatus?: DocumentStatus;
  ocrStatus?: OcrStatus;
  onlyCurrent?: boolean;
}

export const documentsApi = {
  /**
   * List citizen documents with filtering & pagination
   */
  async getDocuments(params?: DocumentListParams): Promise<{
    items: UserDocument[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const res = await apiClient.get<ApiSuccessResponse<UserDocument[]>>('/documents', {
      params,
    });
    const meta = res.data.meta as unknown as {
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    const items = res.data?.data ?? [];
    return {
      items,
      pagination: meta?.pagination || {
        page: 1,
        limit: 20,
        total: (items ?? []).length,
        totalPages: 1,
      },
    };
  },

  /**
   * Get single document details
   */
  async getDocumentById(id: string): Promise<UserDocument> {
    const res = await apiClient.get<ApiSuccessResponse<UserDocument>>(`/documents/${id}`);
    return res.data.data;
  },

  /**
   * Upload document with multipart/form-data
   */
  async uploadDocument(formData: FormData): Promise<UserDocument> {
    const res = await apiClient.post<ApiSuccessResponse<UserDocument>>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  /**
   * Soft-delete document
   */
  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/documents/${id}`);
  },

  /**
   * Request OCR processing with explicit citizen consent
   */
  async requestOcr(id: string, ocrConsent: boolean): Promise<DocumentExtraction> {
    const res = await apiClient.post<ApiSuccessResponse<DocumentExtraction>>(
      `/documents/${id}/ocr`,
      { ocrConsent },
    );
    return res.data.data;
  },

  /**
   * Get latest OCR extraction
   */
  async getExtraction(id: string): Promise<DocumentExtraction> {
    const res = await apiClient.get<ApiSuccessResponse<DocumentExtraction>>(`/documents/${id}/ocr`);
    return res.data.data;
  },

  /**
   * Confirm or edit extracted fields, and optionally apply to profile
   */
  async confirmExtraction(
    id: string,
    input: ConfirmExtractionInput,
  ): Promise<DocumentExtraction> {
    const res = await apiClient.post<ApiSuccessResponse<DocumentExtraction>>(
      `/documents/${id}/confirm-extraction`,
      input,
    );
    return res.data.data;
  },

  /**
   * Generate short-lived signed download token & URL
   */
  async getSignedDownloadUrl(
    id: string,
  ): Promise<{ token: string; expiresInSeconds: number; downloadPath: string }> {
    const res = await apiClient.post<
      ApiSuccessResponse<{ token: string; expiresInSeconds: number; downloadPath: string }>
    >(`/documents/${id}/signed-download`);
    return res.data.data;
  },

  /**
   * Download file directly as a Blob and trigger browser save
   */
  async downloadDocumentFile(id: string, originalFileName: string): Promise<void> {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', originalFileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  /**
   * Check scheme-specific document readiness
   */
  async getSchemeDocumentReadiness(schemeId: string): Promise<SchemeDocumentReadiness> {
    const res = await apiClient.get<ApiSuccessResponse<SchemeDocumentReadiness>>(
      `/schemes/${schemeId}/document-readiness`,
    );
    return res.data.data;
  },
};
