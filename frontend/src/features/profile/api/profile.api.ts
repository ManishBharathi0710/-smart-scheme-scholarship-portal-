import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import {
  StructuredUserProfile,
  ProfileCompletionResult,
  PreferenceCategory,
  ConsentType,
} from '../../../types/profile';

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  version: string;
  grantedAt: string | null;
  revokedAt: string | null;
}

export const profileApi = {
  async getProfile(): Promise<StructuredUserProfile> {
    const res = await apiClient.get<ApiSuccessResponse<StructuredUserProfile>>('/profile');
    return res.data.data;
  },

  async updateFullProfile(data: Record<string, unknown>): Promise<StructuredUserProfile> {
    const res = await apiClient.put<ApiSuccessResponse<StructuredUserProfile>>('/profile', data);
    return res.data.data;
  },

  async updatePersonal(data: Record<string, unknown>): Promise<StructuredUserProfile> {
    const res = await apiClient.patch<ApiSuccessResponse<StructuredUserProfile>>('/profile/personal', data);
    return res.data.data;
  },

  async updateLocation(data: Record<string, unknown>): Promise<StructuredUserProfile> {
    const res = await apiClient.patch<ApiSuccessResponse<StructuredUserProfile>>('/profile/location', data);
    return res.data.data;
  },

  async updateEducation(data: Record<string, unknown>): Promise<StructuredUserProfile> {
    const res = await apiClient.patch<ApiSuccessResponse<StructuredUserProfile>>('/profile/education', data);
    return res.data.data;
  },

  async updateFinancial(data: Record<string, unknown>): Promise<StructuredUserProfile> {
    const res = await apiClient.patch<ApiSuccessResponse<StructuredUserProfile>>('/profile/financial', data);
    return res.data.data;
  },

  async updateSocial(data: Record<string, unknown>): Promise<StructuredUserProfile> {
    const res = await apiClient.patch<ApiSuccessResponse<StructuredUserProfile>>('/profile/social', data);
    return res.data.data;
  },

  async updateOccupation(data: Record<string, unknown>): Promise<StructuredUserProfile> {
    const res = await apiClient.patch<ApiSuccessResponse<StructuredUserProfile>>('/profile/occupation', data);
    return res.data.data;
  },

  async updatePreferences(categories: PreferenceCategory[]): Promise<StructuredUserProfile> {
    const res = await apiClient.patch<ApiSuccessResponse<StructuredUserProfile>>('/profile/preferences', {
      categories,
    });
    return res.data.data;
  },

  async getCompletion(): Promise<ProfileCompletionResult> {
    const res = await apiClient.get<ApiSuccessResponse<ProfileCompletionResult>>('/profile/completion');
    return res.data.data;
  },

  async getConsents(): Promise<ConsentRecord[]> {
    const res = await apiClient.get<ApiSuccessResponse<ConsentRecord[]>>('/consents');
    return res.data.data;
  },

  async updateConsent(type: ConsentType, granted: boolean): Promise<ConsentRecord> {
    const res = await apiClient.patch<ApiSuccessResponse<ConsentRecord>>(`/consents/${type}`, { granted });
    return res.data.data;
  },
};
