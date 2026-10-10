import { ProfileRepository, profileRepository } from './profile.repository.js';
import {
  UpdatePersonalInput,
  UpdateLocationInput,
  UpdateEducationInput,
  UpdateFinancialInput,
  UpdateSocialInput,
  UpdateOccupationInput,
  FullProfileUpdateInput,
} from './profile.schemas.js';
import { StructuredUserProfile, ProfileCompletionResult, SectionScore } from './profile.types.js';
import { Consent, ConsentType, PreferenceCategory } from '@prisma/client';
import { NotFoundError } from '../../errors/app-error.js';
import { logger } from '../../utils/logger.js';

export class ProfileService {
  private readonly repository: ProfileRepository;

  constructor(repository: ProfileRepository = profileRepository) {
    this.repository = repository;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatProfile(raw: any): StructuredUserProfile {
    return {
      id: raw.id,
      userId: raw.userId,
      fullName: raw.fullName,
      dateOfBirth: raw.dateOfBirth,
      age: raw.age,
      gender: raw.gender,
      mobileNumber: raw.mobileNumber,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      location: raw.location
        ? {
            state: raw.location.state,
            district: raw.location.district,
            cityTown: raw.location.cityTown,
            pincode: raw.location.pincode,
            areaType: raw.location.areaType,
          }
        : null,
      education: raw.education
        ? {
            educationLevel: raw.education.educationLevel,
            courseName: raw.education.courseName,
            specialization: raw.education.specialization,
            institutionType: raw.education.institutionType,
            institutionName: raw.education.institutionName,
            yearOfStudy: raw.education.yearOfStudy,
            academicPercentage: raw.education.academicPercentage
              ? Number(raw.education.academicPercentage)
              : null,
            academicCgpa: raw.education.academicCgpa ? Number(raw.education.academicCgpa) : null,
            passingYear: raw.education.passingYear,
          }
        : null,
      financial: raw.financial
        ? {
            annualFamilyIncome: raw.financial.annualFamilyIncome
              ? Number(raw.financial.annualFamilyIncome)
              : null,
            incomeRange: raw.financial.incomeRange,
            incomeSource: raw.financial.incomeSource,
            bplCardHolder: raw.financial.bplCardHolder,
          }
        : null,
      social: raw.social
        ? {
            category: raw.social.category,
            minorityStatus: raw.social.minorityStatus,
            minorityCommunity: raw.social.minorityCommunity,
            disabilityStatus: raw.social.disabilityStatus,
            disabilityPercentage: raw.social.disabilityPercentage,
            disabilityType: raw.social.disabilityType,
            isFirstGenerationGraduate: raw.social.isFirstGenerationGraduate,
            singleGirlChild: raw.social.singleGirlChild,
            orphanStatus: raw.social.orphanStatus,
          }
        : null,
      occupation: raw.occupation
        ? {
            occupationType: raw.occupation.occupationType,
            employmentStatus: raw.occupation.employmentStatus,
            organizationName: raw.occupation.organizationName,
            farmerCategory: raw.occupation.farmerCategory,
          }
        : null,
      preferences: raw.user?.preferences
        ? raw.user.preferences.map((p: { category: PreferenceCategory }) => p.category)
        : [],
      consents: raw.user?.consents || [],
    };
  }

  async getProfile(userId: string): Promise<StructuredUserProfile> {
    const raw = await this.repository.getProfileByUserId(userId);
    if (!raw) {
      throw new NotFoundError('User profile not found');
    }
    return this.formatProfile(raw);
  }

  async updatePersonal(userId: string, input: UpdatePersonalInput): Promise<StructuredUserProfile> {
    const existing = await this.repository.getProfileByUserId(userId);
    if (!existing) throw new NotFoundError('User profile not found');

    await this.repository.updatePersonal(existing.id, input);
    return this.getProfile(userId);
  }

  async updateLocation(userId: string, input: UpdateLocationInput): Promise<StructuredUserProfile> {
    const existing = await this.repository.getProfileByUserId(userId);
    if (!existing) throw new NotFoundError('User profile not found');

    await this.repository.updateLocation(existing.id, input);
    return this.getProfile(userId);
  }

  async updateEducation(
    userId: string,
    input: UpdateEducationInput,
  ): Promise<StructuredUserProfile> {
    const existing = await this.repository.getProfileByUserId(userId);
    if (!existing) throw new NotFoundError('User profile not found');

    await this.repository.updateEducation(existing.id, input);
    return this.getProfile(userId);
  }

  async updateFinancial(
    userId: string,
    input: UpdateFinancialInput,
  ): Promise<StructuredUserProfile> {
    const existing = await this.repository.getProfileByUserId(userId);
    if (!existing) throw new NotFoundError('User profile not found');

    await this.repository.updateFinancial(existing.id, input);
    return this.getProfile(userId);
  }

  async updateSocial(userId: string, input: UpdateSocialInput): Promise<StructuredUserProfile> {
    const existing = await this.repository.getProfileByUserId(userId);
    if (!existing) throw new NotFoundError('User profile not found');

    await this.repository.updateSocial(existing.id, input);
    return this.getProfile(userId);
  }

  async updateOccupation(
    userId: string,
    input: UpdateOccupationInput,
  ): Promise<StructuredUserProfile> {
    const existing = await this.repository.getProfileByUserId(userId);
    if (!existing) throw new NotFoundError('User profile not found');

    await this.repository.updateOccupation(existing.id, input);
    return this.getProfile(userId);
  }

  async updatePreferences(
    userId: string,
    categories: PreferenceCategory[],
  ): Promise<StructuredUserProfile> {
    await this.repository.updatePreferences(userId, categories);
    return this.getProfile(userId);
  }

  async updateFullProfile(
    userId: string,
    input: FullProfileUpdateInput,
  ): Promise<StructuredUserProfile> {
    const existing = await this.repository.getProfileByUserId(userId);
    if (!existing) throw new NotFoundError('User profile not found');

    if (input.personal) await this.repository.updatePersonal(existing.id, input.personal);
    if (input.location) await this.repository.updateLocation(existing.id, input.location);
    if (input.education) await this.repository.updateEducation(existing.id, input.education);
    if (input.financial) await this.repository.updateFinancial(existing.id, input.financial);
    if (input.social) await this.repository.updateSocial(existing.id, input.social);
    if (input.occupation) await this.repository.updateOccupation(existing.id, input.occupation);
    if (input.preferences) await this.repository.updatePreferences(userId, input.preferences);

    logger.info({ userId, event: 'PROFILE_UPDATED' }, 'Citizen profile fully updated');
    return this.getProfile(userId);
  }

  async calculateCompletion(userId: string): Promise<ProfileCompletionResult> {
    const profile = await this.getProfile(userId);

    // Section 1: Personal (Weight: 15)
    const personalMissing: string[] = [];
    if (!profile.fullName) personalMissing.push('Full Name');
    if (!profile.age && !profile.dateOfBirth) personalMissing.push('Age or Date of Birth');
    if (!profile.gender || profile.gender === 'PREFER_NOT_TO_SAY') personalMissing.push('Gender');
    const personalRatio = (3 - personalMissing.length) / 3;
    const personalSection: SectionScore = {
      name: 'Personal Information',
      weight: 15,
      score: Math.round(personalRatio * 15),
      completed: personalMissing.length === 0,
      missingFields: personalMissing,
    };

    // Section 2: Location (Weight: 15)
    const locationMissing: string[] = [];
    if (!profile.location?.state) locationMissing.push('State');
    if (!profile.location?.district) locationMissing.push('District');
    if (!profile.location?.pincode) locationMissing.push('Pincode');
    const locationRatio = (3 - locationMissing.length) / 3;
    const locationSection: SectionScore = {
      name: 'Location & Residence',
      weight: 15,
      score: Math.round(locationRatio * 15),
      completed: locationMissing.length === 0,
      missingFields: locationMissing,
    };

    // Section 3: Education (Weight: 20)
    const educationMissing: string[] = [];
    if (!profile.education?.educationLevel) educationMissing.push('Education Level');
    if (!profile.education?.courseName) educationMissing.push('Course / Standard');
    if (!profile.education?.institutionName) educationMissing.push('Institution Name');
    if (profile.education?.academicPercentage == null && profile.education?.academicCgpa == null) {
      educationMissing.push('Academic Marks / Percentage');
    }
    const educationRatio = (4 - educationMissing.length) / 4;
    const educationSection: SectionScore = {
      name: 'Education Profile',
      weight: 20,
      score: Math.round(educationRatio * 20),
      completed: educationMissing.length === 0,
      missingFields: educationMissing,
    };

    // Section 4: Financial (Weight: 20)
    const financialMissing: string[] = [];
    if (profile.financial?.annualFamilyIncome == null && !profile.financial?.incomeRange) {
      financialMissing.push('Annual Family Income');
    }
    const financialRatio = (1 - financialMissing.length) / 1;
    const financialSection: SectionScore = {
      name: 'Financial Profile',
      weight: 20,
      score: Math.round(financialRatio * 20),
      completed: financialMissing.length === 0,
      missingFields: financialMissing,
    };

    // Section 5: Social (Weight: 15)
    const socialMissing: string[] = [];
    if (!profile.social?.category || profile.social.category === 'PREFER_NOT_TO_SAY') {
      socialMissing.push('Social Category');
    }
    const socialRatio = (1 - socialMissing.length) / 1;
    const socialSection: SectionScore = {
      name: 'Social Eligibility',
      weight: 15,
      score: Math.round(socialRatio * 15),
      completed: socialMissing.length === 0,
      missingFields: socialMissing,
    };

    // Section 6: Occupation (Weight: 10)
    const occupationMissing: string[] = [];
    if (!profile.occupation?.occupationType) occupationMissing.push('Occupation Status');
    const occupationRatio = (1 - occupationMissing.length) / 1;
    const occupationSection: SectionScore = {
      name: 'Occupation Status',
      weight: 10,
      score: Math.round(occupationRatio * 10),
      completed: occupationMissing.length === 0,
      missingFields: occupationMissing,
    };

    // Section 7: Preferences (Weight: 5)
    const preferencesMissing: string[] = [];
    if (profile.preferences.length === 0) preferencesMissing.push('Benefit Preferences');
    const preferencesRatio = profile.preferences.length > 0 ? 1 : 0;
    const preferencesSection: SectionScore = {
      name: 'Benefit Preferences',
      weight: 5,
      score: Math.round(preferencesRatio * 5),
      completed: preferencesMissing.length === 0,
      missingFields: preferencesMissing,
    };

    const overallPercentage =
      personalSection.score +
      locationSection.score +
      educationSection.score +
      financialSection.score +
      socialSection.score +
      occupationSection.score +
      preferencesSection.score;

    // Ready for recommendations if core attributes are known: State, Education Level, Income
    const isReadyForRecommendations =
      Boolean(profile.location?.state) &&
      Boolean(profile.education?.educationLevel) &&
      (profile.financial?.annualFamilyIncome != null || Boolean(profile.financial?.incomeRange));

    let summary = 'Profile is ready for high-accuracy recommendation evaluation.';
    if (overallPercentage < 50) {
      summary = 'Basic profile started. Add location, education, and income for scheme matching.';
    } else if (!isReadyForRecommendations) {
      summary =
        'Please provide State, Education Level, and Annual Income to unlock recommendations.';
    }

    return {
      overallPercentage: Math.min(100, overallPercentage),
      isReadyForRecommendations,
      sections: {
        personal: personalSection,
        location: locationSection,
        education: educationSection,
        financial: financialSection,
        social: socialSection,
        occupation: occupationSection,
        preferences: preferencesSection,
      },
      summary,
    };
  }

  async updateConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
  ): Promise<Consent> {
    const result = await this.repository.upsertConsent(userId, consentType, granted);
    logger.info(
      { userId, consentType, granted, event: granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED' },
      'User consent updated',
    );
    return result;
  }

  async getConsents(userId: string): Promise<Consent[]> {
    return this.repository.getUserConsents(userId);
  }
}

export const profileService = new ProfileService();
