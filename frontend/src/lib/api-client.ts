import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { ApiErrorResponse } from '../types/api';

/**
 * Centralized API client configured with interceptors, timeouts, and standard error handling
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attaches auth token (Module 2) and client correlation headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Module 2 will inject: Authorization: `Bearer ${token}`
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: normalizes API error responses
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.data?.error) {
      // Backend returned standardized ApiErrorResponse
      return Promise.reject(error.response.data.error);
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        code: 'TIMEOUT',
        message: 'Request timed out. Please verify your network connection.',
      });
    }

    if (!error.response) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your connection.',
      });
    }

    return Promise.reject({
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred.',
    });
  },
);
