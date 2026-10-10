import { BaseRepository, PrismaTransactionClient } from '../../database/base-repository.js';
import {
  UpdatePersonalInput,
  UpdateLocationInput,
  UpdateEducationInput,
  UpdateFinancialInput,
  UpdateSocialInput,
  UpdateOccupationInput,
} from './profile.schemas.js';
import {
  Consent,
  ConsentType,
  PreferenceCategory,
  UserPreference,
  UserProfile,
} from '@prisma/client';

export class ProfileRepository extends BaseRepository {
  async getProfileByUserId(userId: string, tx?: PrismaTransactionClient) {
    const db = this.getDb(tx);

    let profile = await db.userProfile.findUnique({
      where: { userId },
      include: {
        location: true,
        education: true,
        financial: true,
        social: true,
        occupation: true,
        user: {
          include: {
            preferences: true,
            consents: true,
          },
        },
      },
    });

    // If profile record was missing, initialize it
    if (!profile) {
      profile = await this.transaction(async (trx) => {
        const newProfile = await trx.userProfile.create({
          data: { userId },
        });
        await trx.locationProfile.create({ data: { profileId: newProfile.id } });
        await trx.educationProfile.create({ data: { profileId: newProfile.id } });
        await trx.financialProfile.create({ data: { profileId: newProfile.id } });
        await trx.socialEligibilityProfile.create({ data: { profileId: newProfile.id } });
        await trx.occupationProfile.create({ data: { profileId: newProfile.id } });

        return trx.userProfile.findUnique({
          where: { id: newProfile.id },
          include: {
            location: true,
            education: true,
            financial: true,
            social: true,
            occupation: true,
            user: {
              include: {
                preferences: true,
                consents: true,
              },
            },
          },
        });
      });
    }

    return profile;
  }

  async updatePersonal(
    profileId: string,
    data: UpdatePersonalInput,
    tx?: PrismaTransactionClient,
  ): Promise<UserProfile> {
    const db = this.getDb(tx);
    return db.userProfile.update({
      where: { id: profileId },
      data: {
        fullName: data.fullName ?? undefined,
        dateOfBirth: data.dateOfBirth ?? undefined,
        age: data.age ?? undefined,
        gender: data.gender ?? undefined,
        mobileNumber: data.mobileNumber ?? undefined,
      },
    });
  }

  async updateLocation(profileId: string, data: UpdateLocationInput, tx?: PrismaTransactionClient) {
    const db = this.getDb(tx);
    return db.locationProfile.upsert({
      where: { profileId },
      update: {
        state: data.state ?? undefined,
        district: data.district ?? undefined,
        cityTown: data.cityTown ?? undefined,
        pincode: data.pincode ?? undefined,
        areaType: data.areaType ?? undefined,
      },
      create: {
        profileId,
        state: data.state || null,
        district: data.district || null,
        cityTown: data.cityTown || null,
        pincode: data.pincode || null,
        areaType: data.areaType || 'RURAL',
      },
    });
  }

  async updateEducation(
    profileId: string,
    data: UpdateEducationInput,
    tx?: PrismaTransactionClient,
  ) {
    const db = this.getDb(tx);
    return db.educationProfile.upsert({
      where: { profileId },
      update: {
        educationLevel: data.educationLevel ?? undefined,
        courseName: data.courseName ?? undefined,
        specialization: data.specialization ?? undefined,
        institutionType: data.institutionType ?? undefined,
        institutionName: data.institutionName ?? undefined,
        yearOfStudy: data.yearOfStudy ?? undefined,
        academicPercentage: data.academicPercentage ?? undefined,
        academicCgpa: data.academicCgpa ?? undefined,
        passingYear: data.passingYear ?? undefined,
      },
      create: {
        profileId,
        educationLevel: data.educationLevel || null,
        courseName: data.courseName || null,
        specialization: data.specialization || null,
        institutionType: data.institutionType || null,
        institutionName: data.institutionName || null,
        yearOfStudy: data.yearOfStudy || null,
        academicPercentage: data.academicPercentage ?? null,
        academicCgpa: data.academicCgpa ?? null,
        passingYear: data.passingYear || null,
      },
    });
  }

  async updateFinancial(
    profileId: string,
    data: UpdateFinancialInput,
    tx?: PrismaTransactionClient,
  ) {
    const db = this.getDb(tx);
    return db.financialProfile.upsert({
      where: { profileId },
      update: {
        annualFamilyIncome: data.annualFamilyIncome ?? undefined,
        incomeRange: data.incomeRange ?? undefined,
        incomeSource: data.incomeSource ?? undefined,
        bplCardHolder: data.bplCardHolder ?? undefined,
      },
      create: {
        profileId,
        annualFamilyIncome: data.annualFamilyIncome ?? null,
        incomeRange: data.incomeRange || null,
        incomeSource: data.incomeSource || null,
        bplCardHolder: data.bplCardHolder ?? false,
      },
    });
  }

  async updateSocial(profileId: string, data: UpdateSocialInput, tx?: PrismaTransactionClient) {
    const db = this.getDb(tx);
    return db.socialEligibilityProfile.upsert({
      where: { profileId },
      update: {
        category: data.category ?? undefined,
        minorityStatus: data.minorityStatus ?? undefined,
        minorityCommunity: data.minorityCommunity ?? undefined,
        disabilityStatus: data.disabilityStatus ?? undefined,
        disabilityPercentage: data.disabilityPercentage ?? undefined,
        disabilityType: data.disabilityType ?? undefined,
        isFirstGenerationGraduate: data.isFirstGenerationGraduate ?? undefined,
        singleGirlChild: data.singleGirlChild ?? undefined,
        orphanStatus: data.orphanStatus ?? undefined,
      },
      create: {
        profileId,
        category: data.category || 'PREFER_NOT_TO_SAY',
        minorityStatus: data.minorityStatus ?? false,
        minorityCommunity: data.minorityCommunity || null,
        disabilityStatus: data.disabilityStatus ?? false,
        disabilityPercentage: data.disabilityPercentage ?? null,
        disabilityType: data.disabilityType || null,
        isFirstGenerationGraduate: data.isFirstGenerationGraduate ?? false,
        singleGirlChild: data.singleGirlChild ?? false,
        orphanStatus: data.orphanStatus ?? false,
      },
    });
  }

  async updateOccupation(
    profileId: string,
    data: UpdateOccupationInput,
    tx?: PrismaTransactionClient,
  ) {
    const db = this.getDb(tx);
    return db.occupationProfile.upsert({
      where: { profileId },
      update: {
        occupationType: data.occupationType ?? undefined,
        employmentStatus: data.employmentStatus ?? undefined,
        organizationName: data.organizationName ?? undefined,
        farmerCategory: data.farmerCategory ?? undefined,
      },
      create: {
        profileId,
        occupationType: data.occupationType || 'STUDENT',
        employmentStatus: data.employmentStatus || null,
        organizationName: data.organizationName || null,
        farmerCategory: data.farmerCategory || 'NONE',
      },
    });
  }

  async updatePreferences(
    userId: string,
    categories: PreferenceCategory[],
  ): Promise<UserPreference[]> {
    return this.transaction(async (tx) => {
      // Clear existing preferences and recreate
      await tx.userPreference.deleteMany({ where: { userId } });
      if (categories.length > 0) {
        await tx.userPreference.createMany({
          data: categories.map((category) => ({
            userId,
            category,
          })),
        });
      }
      return tx.userPreference.findMany({ where: { userId } });
    });
  }

  async upsertConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
  ): Promise<Consent> {
    const now = new Date();
    return this.defaultDb.consent.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
      update: {
        granted,
        grantedAt: granted ? now : undefined,
        revokedAt: !granted ? now : null,
      },
      create: {
        userId,
        consentType,
        granted,
        version: '1.0',
        grantedAt: granted ? now : null,
        revokedAt: !granted ? now : null,
      },
    });
  }

  async getUserConsents(userId: string): Promise<Consent[]> {
    return this.defaultDb.consent.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export const profileRepository = new ProfileRepository();
