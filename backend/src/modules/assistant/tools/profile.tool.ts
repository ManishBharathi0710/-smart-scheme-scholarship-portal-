import { ProfileService } from '../../profile/profile.service.js';
import { logger } from '../../../utils/logger.js';

export interface MinimizedProfileContext {
  age?: number | null;
  gender?: string | null;
  state?: string | null;
  district?: string | null;
  educationLevel?: string | null;
  courseName?: string | null;
  socialCategory?: string | null;
  occupationType?: string | null;
  isMinority?: boolean;
  isDifferentlyAbled?: boolean;
}

export class ProfileTool {
  private readonly profileService: ProfileService;

  constructor(profileService: ProfileService = new ProfileService()) {
    this.profileService = profileService;
  }

  /**
   * Retrieves strictly minimized profile summary for authorized citizen.
   * Never exposes raw identity documents, full Aadhaar, bank numbers, or precise addresses.
   */
  public async getProfileSummary(userId: string): Promise<MinimizedProfileContext | null> {
    try {
      const profile = await this.profileService.getProfile(userId);
      if (!profile) {
        return null;
      }

      return {
        age: profile.age,
        gender: profile.gender,
        state: profile.location?.state || null,
        district: profile.location?.district || null,
        educationLevel: profile.education?.educationLevel || null,
        courseName: profile.education?.courseName || null,
        socialCategory: profile.social?.category || null,
        occupationType: profile.occupation?.employmentStatus || null,
        isMinority: Boolean(profile.social?.minorityStatus),
        isDifferentlyAbled: Boolean(profile.social?.disabilityStatus),
      };
    } catch (error) {
      logger.warn({
        userId,
        error: error instanceof Error ? error.message : String(error),
        msg: 'ProfileTool failed to retrieve profile summary',
      });
      return null;
    }
  }
}

export const profileTool = new ProfileTool();
