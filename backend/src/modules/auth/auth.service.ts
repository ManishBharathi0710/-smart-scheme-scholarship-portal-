import { AuthRepository, authRepository } from './auth.repository.js';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schemas.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
  hashToken,
} from './auth.utils.js';
import { AuthResponseData, AuthTokens, AuthUserSummary } from './auth.types.js';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../errors/app-error.js';
import { User, UserStatus } from '@prisma/client';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

export class AuthService {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository = authRepository) {
    this.repository = repository;
  }

  private mapUserToSummary(user: User): AuthUserSummary {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  async register(input: RegisterInput): Promise<AuthResponseData> {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.repository.createUserWithInitialProfile(
      {
        email: input.email,
        passwordHash,
      },
      input.fullName,
    );

    const userSummary = this.mapUserToSummary(user);
    const accessToken = generateAccessToken(userSummary);
    const { token: rawRefreshToken, hash: refreshTokenHash, expiresAt } = generateRefreshToken();

    await this.repository.storeRefreshToken(user.id, refreshTokenHash, expiresAt);

    logger.info({ userId: user.id, event: 'USER_REGISTERED' }, 'New user account created');

    return {
      user: userSummary,
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        tokenType: 'Bearer',
        expiresIn: env.JWT_EXPIRES_IN,
      },
    };
  }

  async login(input: LoginInput): Promise<AuthResponseData> {
    const user = await this.repository.findUserByEmail(input.email);
    if (!user) {
      // Prevent account enumeration by using generic failure message
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn({ email: input.email, event: 'LOGIN_FAILURE' }, 'Failed login attempt');
      throw new AuthenticationError('Invalid email or password');
    }

    if (user.status === UserStatus.DISABLED || user.status === UserStatus.SUSPENDED) {
      logger.warn(
        { userId: user.id, status: user.status, event: 'LOGIN_BLOCKED' },
        'Login blocked due to inactive status',
      );
      throw new AuthenticationError(
        'Your account has been deactivated or suspended. Please contact support.',
      );
    }

    await this.repository.updateLastLogin(user.id);

    const userSummary = this.mapUserToSummary(user);
    const accessToken = generateAccessToken(userSummary);
    const { token: rawRefreshToken, hash: refreshTokenHash, expiresAt } = generateRefreshToken();

    await this.repository.storeRefreshToken(user.id, refreshTokenHash, expiresAt);

    logger.info({ userId: user.id, event: 'LOGIN_SUCCESS' }, 'User logged in successfully');

    return {
      user: userSummary,
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        tokenType: 'Bearer',
        expiresIn: env.JWT_EXPIRES_IN,
      },
    };
  }

  async logout(refreshTokenString?: string): Promise<void> {
    if (refreshTokenString) {
      const tokenHash = hashToken(refreshTokenString);
      const existing = await this.repository.findRefreshToken(tokenHash);
      if (existing && !existing.revokedAt) {
        await this.repository.revokeRefreshToken(existing.id);
        logger.info(
          { userId: existing.userId, event: 'LOGOUT' },
          'Session refresh token revoked server-side',
        );
      }
    }
  }

  async refreshTokens(refreshTokenString: string): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshTokenString);
    const existing = await this.repository.findRefreshToken(tokenHash);

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token is invalid, expired, or has been revoked');
    }

    const user = existing.user;
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError('Account is not in active status');
    }

    // Refresh token rotation: revoke used token, create new token
    await this.repository.revokeRefreshToken(existing.id);

    const userSummary = this.mapUserToSummary(user);
    const newAccessToken = generateAccessToken(userSummary);
    const {
      token: newRawRefreshToken,
      hash: newRefreshTokenHash,
      expiresAt,
    } = generateRefreshToken();

    await this.repository.storeRefreshToken(user.id, newRefreshTokenHash, expiresAt);

    logger.info({ userId: user.id, event: 'TOKEN_REFRESH' }, 'Auth tokens refreshed');

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  async getCurrentUser(userId: string): Promise<AuthUserSummary> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapUserToSummary(user);
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isCurrentValid = await comparePassword(input.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new ValidationError('Current password entered is incorrect');
    }

    const newPasswordHash = await hashPassword(input.newPassword);
    await this.repository.updatePassword(userId, newPasswordHash);

    // Invalidate all existing refresh tokens for security
    await this.repository.revokeAllUserRefreshTokens(userId);

    logger.info({ userId, event: 'PASSWORD_CHANGED' }, 'User changed password');
  }

  async forgotPassword(
    input: ForgotPasswordInput,
  ): Promise<{ message: string; devToken?: string }> {
    const user = await this.repository.findUserByEmail(input.email);
    let devToken: string | undefined = undefined;

    if (user && user.status === UserStatus.ACTIVE) {
      const { token, hash, expiresAt } = generatePasswordResetToken();
      await this.repository.storePasswordResetToken(user.id, hash, expiresAt);

      logger.info(
        { userId: user.id, event: 'PASSWORD_RESET_REQUESTED' },
        'Password reset requested',
      );

      // In development mode, provide token for testing verification
      if (env.NODE_ENV !== 'production') {
        devToken = token;
      }
    }

    // Always return generic message to prevent account enumeration
    return {
      message:
        'If an account exists with the provided email address, password reset instructions have been issued.',
      devToken,
    };
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const existing = await this.repository.findPasswordResetToken(tokenHash);

    if (!existing || existing.usedAt || existing.expiresAt < new Date()) {
      throw new ValidationError(
        'Password reset token is invalid, expired, or has already been used',
      );
    }

    const newPasswordHash = await hashPassword(input.newPassword);
    await this.repository.updatePassword(existing.userId, newPasswordHash);
    await this.repository.markPasswordResetTokenUsed(existing.id);

    // Invalidate all active sessions
    await this.repository.revokeAllUserRefreshTokens(existing.userId);

    logger.info(
      { userId: existing.userId, event: 'PASSWORD_RESET_SUCCESS' },
      'Password successfully reset',
    );
  }
}

export const authService = new AuthService();
