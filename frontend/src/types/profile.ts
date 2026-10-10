export type Gender = 'MALE' | 'FEMALE' | 'TRANSGENDER' | 'PREFER_NOT_TO_SAY' | 'OTHER';

export type AreaType = 'RURAL' | 'URBAN' | 'SEMI_URBAN';

export type EducationLevel =
  | 'SCHOOL'
  | 'HIGHER_SECONDARY'
  | 'UNDERGRADUATE'
  | 'POSTGRADUATE'
  | 'DIPLOMA'
  | 'DOCTORATE'
  | 'ITI'
  | 'OTHER';

export type InstitutionType =
  | 'GOVERNMENT'
  | 'GOVERNMENT_AIDED'
  | 'PRIVATE'
  | 'AUTONOMOUS'
  | 'CENTRAL_UNIVERSITY'
  | 'DEEMED_UNIVERSITY'
  | 'OTHER';

export type IncomeRange =
  | 'BELOW_1_LAKH'
  | 'BETWEEN_1_AND_2_5_LAKH'
  | 'BETWEEN_2_5_AND_5_LAKH'
  | 'BETWEEN_5_AND_8_LAKH'
  | 'ABOVE_8_LAKH';

export type SocialCategory =
  | 'GENERAL'
  | 'OBC'
  | 'SC'
  | 'ST'
  | 'EWS'
  | 'OTHER'
  | 'PREFER_NOT_TO_SAY';

export type OccupationType =
  | 'STUDENT'
  | 'EMPLOYED'
  | 'UNEMPLOYED'
  | 'FARMER'
  | 'SELF_EMPLOYED'
  | 'BUSINESS_OWNER'
  | 'HOMEMAKER'
  | 'RETIRED'
  | 'OTHER';

export type FarmerCategory = 'MARGINAL_FARMER' | 'SMALL_FARMER' | 'LARGE_FARMER' | 'NONE';

export type PreferenceCategory =
  | 'SCHOLARSHIPS'
  | 'EDUCATION'
  | 'AGRICULTURE'
  | 'EMPLOYMENT'
  | 'ENTREPRENEURSHIP'
  | 'HOUSING'
  | 'HEALTHCARE'
  | 'INSURANCE'
  | 'PENSION'
  | 'SKILL_DEVELOPMENT'
  | 'LOANS'
  | 'SUBSIDIES';

export type ConsentType =
  | 'PROFILE_PROCESSING'
  | 'RECOMMENDATION_PROCESSING'
  | 'DOCUMENT_PROCESSING'
  | 'OCR_PROCESSING'
  | 'AI_ASSISTANCE'
  | 'NOTIFICATIONS';

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
  dateOfBirth: string | null;
  age: number | null;
  gender: Gender | null;
  mobileNumber: string | null;
  createdAt: string;
  updatedAt: string;
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
    grantedAt: string | null;
    revokedAt: string | null;
    version: string;
  }>;
}
