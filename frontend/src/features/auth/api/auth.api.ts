import { apiClient } from '../../../lib/api-client';
import { ApiSuccessResponse } from '../../../types/api';
import {
  AuthResponseData,
  AuthTokens,
  ChangePasswordCredentials,
  ForgotPasswordCredentials,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  UserSummary,
} from '../../../types/auth';

export const authApi = {
  async register(data: RegisterCredentials): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiSuccessResponse<AuthResponseData>>('/auth/register', data);
    return res.data.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiSuccessResponse<AuthResponseData>>('/auth/login', credentials);
    return res.data.data;
  },

  async logout(refreshToken?: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const res = await apiClient.post<ApiSuccessResponse<AuthTokens>>('/auth/refresh', {
      refreshToken,
    });
    return res.data.data;
  },

  async getMe(): Promise<UserSummary> {
    const res = await apiClient.get<ApiSuccessResponse<UserSummary>>('/auth/me');
    return res.data.data;
  },

  async changePassword(data: ChangePasswordCredentials): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  },

  async forgotPassword(data: ForgotPasswordCredentials): Promise<{ message: string; devToken?: string }> {
    const res = await apiClient.post<ApiSuccessResponse<{ message: string; devToken?: string }>>(
      '/auth/forgot-password',
      data,
    );
    return res.data.data;
  },

  async resetPassword(data: ResetPasswordCredentials): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  },
};
