import { RecommendationCardDto } from '../recommendations/recommendations.types.js';
import { SavedSchemeCardDto } from '../saved-schemes/saved-schemes.types.js';

export interface DashboardProfileSummary {
  fullName: string | null;
  email?: string | null;
  state: string | null;
  educationLevel: string | null;
  category: string | null;
  income: number | null;
  isReadyForRecommendations: boolean;
  completionPercentage: number;
  summary: string;
}

export interface DashboardRecommendationSummary {
  totalEvaluated: number;
  eligible: number;
  likelyEligible: number;
  needsVerification: number;
  notEligible: number;
  expiringSoon: number;
}

export interface DashboardActionItem {
  id: string;
  type: 'PROFILE_COMPLETION' | 'APPLICATION_DEADLINE' | 'VERIFICATION_NEEDED' | 'EXPLORE_NEW';
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DashboardAggregateDto {
  profile: DashboardProfileSummary;
  recommendationSummary: DashboardRecommendationSummary;
  topRecommendations: RecommendationCardDto[];
  closingSoon: RecommendationCardDto[];
  savedSchemes: {
    totalCount: number;
    items: SavedSchemeCardDto[];
  };
  actionItems: DashboardActionItem[];
}
