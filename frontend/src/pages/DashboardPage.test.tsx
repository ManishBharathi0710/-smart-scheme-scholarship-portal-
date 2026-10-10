import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from './DashboardPage';
import { dashboardApi } from '../features/dashboard/api/dashboard.api';
import { savedSchemesApi } from '../features/saved-schemes/api/saved-schemes.api';
import { useAuth } from '../features/auth/context/AuthContext';
import { DashboardData } from '../types/dashboard';

vi.mock('../features/dashboard/api/dashboard.api');
vi.mock('../features/saved-schemes/api/saved-schemes.api');
vi.mock('../features/auth/context/AuthContext');

const mockDashboardData: DashboardData = {
  profile: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    state: 'Tamil Nadu',
    educationLevel: 'UNDERGRADUATE',
    category: 'OBC',
    income: 180000,
    isReadyForRecommendations: true,
    completionPercentage: 85,
    summary: 'Profile is 85% complete and actively evaluated.',
  },
  recommendationSummary: {
    totalEvaluated: 10,
    eligible: 3,
    likelyEligible: 2,
    needsVerification: 1,
    notEligible: 4,
    expiringSoon: 1,
  },
  topRecommendations: [
    {
      id: 'rec-1',
      schemeId: 'scheme-1',
      schemeName: 'Higher Education Fee Waiver',
      slug: 'higher-education-fee-waiver',
      programType: 'SCHOLARSHIP',
      categories: ['EDUCATION'],
      departmentName: 'Department of Higher Education',
      stateScope: 'Tamil Nadu',
      primaryBenefit: {
        type: 'FEE_REIMBURSEMENT',
        amount: 50000,
        frequency: 'ANNUAL',
        description: 'Complete tuition waiver',
      },
      eligibilityStatus: 'ELIGIBLE',
      applicationStatus: 'OPEN',
      isExpiringSoon: false,
      daysUntilDeadline: 45,
      deadline: '2026-11-15T00:00:00.000Z',
      matchedCount: 3,
      failedCount: 0,
      unknownCount: 0,
      summary: 'Matches all criteria',
      schemeVersionNumber: 1,
      evaluatedAt: '2026-09-26T10:00:00.000Z',
    },
  ],
  closingSoon: [],
  savedSchemes: {
    total: 1,
    preview: [],
  },
  actionItems: [
    {
      id: 'action-1',
      type: 'PROFILE_COMPLETION',
      title: 'Complete Occupation Details',
      description: 'Add your employment or student status to unlock more schemes.',
      ctaText: 'Update Profile',
      ctaLink: '/profile/edit',
      priority: 'MEDIUM',
    },
  ],
  generatedAt: '2026-09-26T10:00:00.000Z',
};

describe('DashboardPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'jane@example.com',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: '2026-09-01T00:00:00.000Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
    });

    vi.mocked(dashboardApi.getDashboard).mockResolvedValue(mockDashboardData);
    vi.mocked(savedSchemesApi.getSavedSchemeIds).mockResolvedValue({
      schemeIds: [],
      count: 0,
    });
  });

  it('renders citizen personalized dashboard with metrics and top recommendations', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Jane Doe/i)).toBeInTheDocument();
      // Profile completion banner
      expect(screen.getByText(/Profile 85% Complete/i)).toBeInTheDocument();
      // Recommendation metrics
      expect(screen.getAllByText('Eligible').length).toBeGreaterThan(0);
      expect(screen.getByText('Likely Eligible')).toBeInTheDocument();
      expect(screen.getByText('Needs Verification')).toBeInTheDocument();
      // Recommended scheme card
      expect(screen.getByText('Higher Education Fee Waiver')).toBeInTheDocument();
      // Action items
      expect(screen.getByText('Complete Occupation Details')).toBeInTheDocument();
    });
  });
});
