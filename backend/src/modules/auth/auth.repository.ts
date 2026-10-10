import { User, RefreshToken, PasswordResetToken, UserRole, UserStatus } from '@prisma/client';
import { BaseRepository, PrismaTransactionClient } from '../../database/base-repository.js';

export class AuthRepository extends BaseRepository {
  async findUserByEmail(email: string, tx?: PrismaTransactionClient): Promise<User | null> {
    const db = this.getDb(tx);
    return db.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string, tx?: PrismaTransactionClient): Promise<User | null> {
    const db = this.getDb(tx);
    return db.user.findUnique({
      where: { id },
    });
  }

  async createUserWithInitialProfile(
    data: {
      email: string;
      passwordHash: string;
      role?: UserRole;
      status?: UserStatus;
    },
    fullName?: string,
  ): Promise<User> {
    return this.transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role || UserRole.USER,
          status: data.status || UserStatus.ACTIVE,
        },
      });

      // 2. Create UserProfile
      const profile = await tx.userProfile.create({
        data: {
          userId: user.id,
          fullName: fullName || null,
        },
      });

      // 3. Initialize associated empty sub-profiles for clean 1-to-1 relations
      await tx.locationProfile.create({ data: { profileId: profile.id } });
      await tx.educationProfile.create({ data: { profileId: profile.id } });
      await tx.financialProfile.create({ data: { profileId: profile.id } });
      await tx.socialEligibilityProfile.create({ data: { profileId: profile.id } });
      await tx.occupationProfile.create({ data: { profileId: profile.id } });

      // 4. Initialize basic baseline consents (profile processing default true upon registration)
      await tx.consent.createMany({
        data: [
          {
            userId: user.id,
            consentType: 'PROFILE_PROCESSING',
            granted: true,
            version: '1.0',
            grantedAt: new Date(),
          },
          {
            userId: user.id,
            consentType: 'RECOMMENDATION_PROCESSING',
            granted: true,
            version: '1.0',
            grantedAt: new Date(),
          },
        ],
      });

      return user;
    });
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
    tx?: PrismaTransactionClient,
  ): Promise<void> {
    const db = this.getDb(tx);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async updateLastLogin(userId: string, tx?: PrismaTransactionClient): Promise<void> {
    const db = this.getDb(tx);
    await db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async storeRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    tx?: PrismaTransactionClient,
  ): Promise<RefreshToken> {
    const db = this.getDb(tx);
    return db.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findRefreshToken(
    tokenHash: string,
    tx?: PrismaTransactionClient,
  ): Promise<(RefreshToken & { user: User }) | null> {
    const db = this.getDb(tx);
    return db.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async revokeRefreshToken(id: string, tx?: PrismaTransactionClient): Promise<void> {
    const db = this.getDb(tx);
    await db.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string, tx?: PrismaTransactionClient): Promise<void> {
    const db = this.getDb(tx);
    await db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async storePasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    tx?: PrismaTransactionClient,
  ): Promise<PasswordResetToken> {
    const db = this.getDb(tx);
    return db.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findPasswordResetToken(
    tokenHash: string,
    tx?: PrismaTransactionClient,
  ): Promise<(PasswordResetToken & { user: User }) | null> {
    const db = this.getDb(tx);
    return db.passwordResetToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async markPasswordResetTokenUsed(id: string, tx?: PrismaTransactionClient): Promise<void> {
    const db = this.getDb(tx);
    await db.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}

export const authRepository = new AuthRepository();
