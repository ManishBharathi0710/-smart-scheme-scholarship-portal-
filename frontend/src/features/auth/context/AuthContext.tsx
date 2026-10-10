import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserSummary, LoginCredentials, RegisterCredentials } from '../../../types/auth';
import { authApi } from '../api/auth.api';

interface AuthContextType {
  user: UserSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!token && !refreshToken) {
      setIsLoading(false);
      return;
    }

    try {
      if (token) {
        const userData = await authApi.getMe();
        setUser(userData);
      } else if (refreshToken) {
        // Attempt silent refresh
        const newTokens = await authApi.refreshToken(refreshToken);
        localStorage.setItem('auth_token', newTokens.accessToken);
        localStorage.setItem('refresh_token', newTokens.refreshToken);
        const userData = await authApi.getMe();
        setUser(userData);
      }
    } catch {
      // Tokens were invalid/expired, clean up
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(credentials);
      localStorage.setItem('auth_token', data.tokens.accessToken);
      localStorage.setItem('refresh_token', data.tokens.refreshToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const data = await authApi.register(credentials);
      localStorage.setItem('auth_token', data.tokens.accessToken);
      localStorage.setItem('refresh_token', data.tokens.refreshToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token') || undefined;
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const refreshSession = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      await logout();
      return;
    }
    const newTokens = await authApi.refreshToken(refreshToken);
    localStorage.setItem('auth_token', newTokens.accessToken);
    localStorage.setItem('refresh_token', newTokens.refreshToken);
    const userData = await authApi.getMe();
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOptionalAuth(): AuthContextType | null {
  const context = useContext(AuthContext);
  return context || null;
}
