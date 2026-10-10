import { UserRole, UserStatus } from '@prisma/client';

export interface AuthUserSummary {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface AuthResponseData {
  user: AuthUserSummary;
  tokens: AuthTokens;
}

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  iat?: number;
  exp?: number;
}
