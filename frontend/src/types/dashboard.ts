import { RecommendationCard } from './recommendation';
import { SavedSchemeCard } from './saved-scheme';

export interface DashboardProfile {
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

export interface DashboardData {
  profile: DashboardProfile;
  recommendationSummary: DashboardRecommendationSummary;
  topRecommendations: RecommendationCard[];
  closingSoon: RecommendationCard[];
  savedSchemes: {
    total: number;
    preview: SavedSchemeCard[];
  };
  actionItems: DashboardActionItem[];
  generatedAt: string;
}
