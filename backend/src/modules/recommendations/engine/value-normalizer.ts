import { StructuredUserProfile } from '../../profile/profile.types';
import { NormalizedUserFacts, UserFact } from './types';
import { RULE_FIELD_CATALOG } from '../../schemes/schemes.constants';

export class ValueNormalizer {
  /**
   * Normalizes a structured user profile into a standardized facts map.
   * Crucial rule: Missing information must NEVER be coerced to 0, false, or empty strings.
   * They must be marked with state = 'UNKNOWN'.
   */
  static normalizeUserProfile(profile: StructuredUserProfile): NormalizedUserFacts {
    const facts: NormalizedUserFacts = {};

    // 1. Age (derive from dateOfBirth if available, otherwise check age field)
    facts['age'] = this.calculateAgeFact(profile.dateOfBirth, profile.age);

    // 2. Gender
    facts['gender'] = profile.gender
      ? { value: String(profile.gender).toUpperCase(), state: 'KNOWN' }
      : { value: null, state: 'UNKNOWN' };

    // 3. Location (State, District, AreaType)
    facts['state'] = profile.location?.state
      ? { value: String(profile.location.state).trim(), state: 'KNOWN' }
      : { value: null, state: 'UNKNOWN' };

    facts['district'] = profile.location?.district
      ? { value: String(profile.location.district).trim(), state: 'KNOWN' }
      : { value: null, state: 'UNKNOWN' };

    facts['area_type'] = profile.location?.areaType
      ? { value: String(profile.location.areaType).toUpperCase(), state: 'KNOWN' }
      : { value: null, state: 'UNKNOWN' };

    // 4. Financial (Annual Income, BPL Card)
    facts['annual_family_income'] =
      profile.financial?.annualFamilyIncome !== null &&
      profile.financial?.annualFamilyIncome !== undefined
        ? { value: Number(profile.financial.annualFamilyIncome), state: 'KNOWN' }
        : { value: null, state: 'UNKNOWN' };

    facts['bpl_card_holder'] =
      profile.financial?.bplCardHolder !== null && profile.financial?.bplCardHolder !== undefined
        ? { value: Boolean(profile.financial.bplCardHolder), state: 'KNOWN' }
        : { value: null, state: 'UNKNOWN' };

    // 5. Education
    facts['education_level'] = profile.education?.educationLevel
      ? { value: String(profile.education.educationLevel).toUpperCase(), state: 'KNOWN' }
      : { value: null, state: 'UNKNOWN' };

    facts['institution_type'] = profile.education?.institutionType
      ? { value: String(profile.education.institutionType).toUpperCase(), state: 'KNOWN' }
      : { value: null, state: 'UNKNOWN' };

    facts['year_of_study'] =
      profile.education?.yearOfStudy !== null && profile.education?.yearOfStudy !== undefined
        ? { value: Number(profile.education.yearOfStudy), state: 'KNOWN' }
        : { value: null, state: 'UNKNOWN' };

    facts['academic_percentage'] =
      profile.education?.academicPercentage !== null &&
      profile.education?.academicPercentage !== undefined
        ? { value: Number(profile.education.academicPercentage), state: 'KNOWN' }
        : { value: null, state: 'UNKNOWN' };

    // 6. Social Category & Reservations
    facts['category'] = profile.social?.category
      ? { value: String(profile.social.category).toUpperCase(), state: 'KNOWN' }
      : { value: null, state: 'UNKNOWN' };

    facts['minority_status'] =
      profile.social?.minorityStatus !== null && profile.social?.minorityStatus !== undefined
        ? { value: Boolean(profile.social.minorityStatus), state: 'KNOWN' }
        : { value: null, state: 'UNKNOWN' };

    facts['disability_status'] =
      profile.social?.disabilityStatus !== null && profile.social?.disabilityStatus !== undefined
        ? { value: Boolean(profile.social.disabilityStatus), state: 'KNOWN' }
        : { value: null, state: 'UNKNOWN' };

    facts['disability_percentage'] =
      profile.social?.disabilityPercentage !== null &&
      profile.social?.disabilityPercentage !== undefined
        ? { value: Number(profile.social.disabilityPercentage), state: 'KNOWN' }
        : { value: null, state: 'UNKNOWN' };

    facts['is_first_generation_graduate'] =
      profile.social?.isFirstGenerationGraduate !== null &&
      profile.social?.isFirstGenerationGraduate !== undefined
        ? { value: Boolean(profile.social.isFirstGenerationGraduate), state: 'KNOWN' }
        : { value: null, state: 'UNKNOWN' };

    // 7. Occupation & Farming
    facts['occupation_type'] = profile.occupation?.occupationType
      ? { value: String(profile.occupation.occupationType).toUpperCase(), state: 'KNOWN' }
      : { value: null, state: 'UNKNOWN' };

    facts['farmer_category'] = profile.occupation?.farmerCategory
      ? { value: String(profile.occupation.farmerCategory).toUpperCase(), state: 'KNOWN' }
      : { value: null, state: 'UNKNOWN' };

    return facts;
  }

  /**
   * Calculates exact age based on dateOfBirth or fallback age.
   * Correctly checks whether birthday has occurred this year.
   */
  private static calculateAgeFact(
    dob: Date | string | null | undefined,
    fallbackAge: number | null | undefined,
  ): UserFact {
    if (dob) {
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return { value: age, state: 'KNOWN' };
      }
    }

    if (fallbackAge !== null && fallbackAge !== undefined && !isNaN(fallbackAge)) {
      return { value: Number(fallbackAge), state: 'KNOWN' };
    }

    return { value: null, state: 'UNKNOWN' };
  }

  /**
   * Safe comparison normalizer for string comparisons (case-insensitive, trimmed)
   */
  static normalizeString(val: unknown): string {
    if (val === null || val === undefined) return '';
    return String(val).trim().toUpperCase();
  }

  /**
   * Safe comparison normalizer for numeric comparisons
   */
  static normalizeNumber(val: unknown): number | null {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  }

  /**
   * Safe boolean normalizer
   */
  static normalizeBoolean(val: unknown): boolean | null {
    if (val === null || val === undefined) return null;
    if (typeof val === 'boolean') return val;
    if (val === 'true' || val === 'TRUE' || val === 1 || val === '1') return true;
    if (val === 'false' || val === 'FALSE' || val === 0 || val === '0') return false;
    return null;
  }

  /**
   * Retrieves human-readable metadata for a field
   */
  static getFieldDefinition(field: string) {
    return (
      RULE_FIELD_CATALOG[field] || {
        field,
        label: field.replace(/_/g, ' '),
        category: 'GENERAL',
        description: 'Statutory eligibility criterion.',
      }
    );
  }
}
