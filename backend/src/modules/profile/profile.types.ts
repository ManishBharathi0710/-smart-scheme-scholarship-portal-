import {
  Gender,
  AreaType,
  EducationLevel,
  InstitutionType,
  IncomeRange,
  SocialCategory,
  OccupationType,
  FarmerCategory,
  PreferenceCategory,
  ConsentType,
} from '@prisma/client';

export interface SectionScore {
  name: string;
  weight: number;
  score: number;
  completed: boolean;
  missingFields: string[];
}

export interface ProfileCompletionResult {
  overallPercentage: number;
  isReadyForRecommendations: boolean;
  sections: Record<string, SectionScore>;
  summary: string;
}

export interface StructuredUserProfile {
  id: string;
  userId: string;
  fullName: string | null;
  dateOfBirth: Date | null;
  age: number | null;
  gender: Gender | null;
  mobileNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  location: {
    state: string | null;
    district: string | null;
    cityTown: string | null;
    pincode: string | null;
    areaType: AreaType | null;
  } | null;
  education: {
    educationLevel: EducationLevel | null;
    courseName: string | null;
    specialization: string | null;
    institutionType: InstitutionType | null;
    institutionName: string | null;
    yearOfStudy: number | null;
    academicPercentage: number | null;
    academicCgpa: number | null;
    passingYear: number | null;
  } | null;
  financial: {
    annualFamilyIncome: number | null;
    incomeRange: IncomeRange | null;
    incomeSource: string | null;
    bplCardHolder: boolean | null;
  } | null;
  social: {
    category: SocialCategory | null;
    minorityStatus: boolean | null;
    minorityCommunity: string | null;
    disabilityStatus: boolean | null;
    disabilityPercentage: number | null;
    disabilityType: string | null;
    isFirstGenerationGraduate: boolean | null;
    singleGirlChild: boolean | null;
    orphanStatus: boolean | null;
  } | null;
  occupation: {
    occupationType: OccupationType | null;
    employmentStatus: string | null;
    organizationName: string | null;
    farmerCategory: FarmerCategory | null;
  } | null;
  preferences: PreferenceCategory[];
  consents: Array<{
    consentType: ConsentType;
    granted: boolean;
    grantedAt: Date | null;
    revokedAt: Date | null;
    version: string;
  }>;
}
