import { z } from 'zod';
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

export const updatePersonalSchema = z.object({
  fullName: z.string().trim().min(2).max(150).optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  age: z.coerce.number().int().min(3).max(120).optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number')
    .optional()
    .nullable(),
});

export const updateLocationSchema = z.object({
  state: z.string().trim().min(2).max(100).optional().nullable(),
  district: z.string().trim().min(2).max(100).optional().nullable(),
  cityTown: z.string().trim().max(100).optional().nullable(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .optional()
    .nullable(),
  areaType: z.nativeEnum(AreaType).optional().nullable(),
});

export const updateEducationSchema = z.object({
  educationLevel: z.nativeEnum(EducationLevel).optional().nullable(),
  courseName: z.string().trim().max(150).optional().nullable(),
  specialization: z.string().trim().max(150).optional().nullable(),
  institutionType: z.nativeEnum(InstitutionType).optional().nullable(),
  institutionName: z.string().trim().max(200).optional().nullable(),
  yearOfStudy: z.coerce.number().int().min(1).max(10).optional().nullable(),
  academicPercentage: z.coerce
    .number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100')
    .optional()
    .nullable(),
  academicCgpa: z.coerce
    .number()
    .min(0, 'CGPA cannot be negative')
    .max(10, 'CGPA cannot exceed 10')
    .optional()
    .nullable(),
  passingYear: z.coerce.number().int().min(1950).max(2050).optional().nullable(),
});

export const updateFinancialSchema = z.object({
  annualFamilyIncome: z.coerce
    .number()
    .min(0, 'Annual income cannot be negative')
    .max(100000000, 'Income value exceeds maximum threshold')
    .optional()
    .nullable(),
  incomeRange: z.nativeEnum(IncomeRange).optional().nullable(),
  incomeSource: z.string().trim().max(100).optional().nullable(),
  bplCardHolder: z.boolean().optional().nullable(),
});

export const updateSocialSchema = z.object({
  category: z.nativeEnum(SocialCategory).optional().nullable(),
  minorityStatus: z.boolean().optional().nullable(),
  minorityCommunity: z.string().trim().max(50).optional().nullable(),
  disabilityStatus: z.boolean().optional().nullable(),
  disabilityPercentage: z.coerce.number().int().min(0).max(100).optional().nullable(),
  disabilityType: z.string().trim().max(100).optional().nullable(),
  isFirstGenerationGraduate: z.boolean().optional().nullable(),
  singleGirlChild: z.boolean().optional().nullable(),
  orphanStatus: z.boolean().optional().nullable(),
});

export const updateOccupationSchema = z.object({
  occupationType: z.nativeEnum(OccupationType).optional().nullable(),
  employmentStatus: z.string().trim().max(100).optional().nullable(),
  organizationName: z.string().trim().max(150).optional().nullable(),
  farmerCategory: z.nativeEnum(FarmerCategory).optional().nullable(),
});

export const updatePreferencesSchema = z.object({
  categories: z.array(z.nativeEnum(PreferenceCategory)),
});

export const updateConsentSchema = z.object({
  consentType: z.nativeEnum(ConsentType),
  granted: z.boolean(),
});

export const fullProfileUpdateSchema = z.object({
  personal: updatePersonalSchema.optional(),
  location: updateLocationSchema.optional(),
  education: updateEducationSchema.optional(),
  financial: updateFinancialSchema.optional(),
  social: updateSocialSchema.optional(),
  occupation: updateOccupationSchema.optional(),
  preferences: z.array(z.nativeEnum(PreferenceCategory)).optional(),
});

export type UpdatePersonalInput = z.infer<typeof updatePersonalSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
export type UpdateFinancialInput = z.infer<typeof updateFinancialSchema>;
export type UpdateSocialInput = z.infer<typeof updateSocialSchema>;
export type UpdateOccupationInput = z.infer<typeof updateOccupationSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type UpdateConsentInput = z.infer<typeof updateConsentSchema>;
export type FullProfileUpdateInput = z.infer<typeof fullProfileUpdateSchema>;
