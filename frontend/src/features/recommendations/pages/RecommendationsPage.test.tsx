import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecommendationsPage } from './RecommendationsPage';
import { recommendationsApi } from '../api/recommendations.api';
import type { RecommendationCard } from '../../../types/recommendation';

vi.mock('../api/recommendations.api');

const mockRecommendations: RecommendationCard[] = [
  {
    id: 'rec-uuid-1',
    schemeId: 'scheme-uuid-1',
    schemeName: 'Post-Matric Scholarship for BC Students',
    slug: 'post-matric-scholarship-bc',
    shortDescription: 'Financial assistance for post-secondary education of eligible students.',
    programType: 'SCHOLARSHIP',
    categories: ['EDUCATION'],
    departmentName: 'Department of Backward Classes Welfare',
    stateScope: 'Tamil Nadu',
    eligibilityStatus: 'ELIGIBLE',
    applicationStatus: 'OPEN',
    isExpiringSoon: true,
    deadline: '2026-10-31',
    primaryBenefit: {
      type: 'SCHOLARSHIP',
      amount: 25000,
      frequency: 'ANNUAL',
      description: '₹25,000 annual scholarship allowance',
    },
    matchedCount: 3,
    failedCount: 0,
    unknownCount: 0,
    summary: 'You satisfy all mandatory eligibility criteria for this scheme.',
    missingFields: [],
    schemeVersionNumber: 1,
    evaluatedAt: '2026-09-26T08:00:00.000Z',
  },
  {
    id: 'rec-uuid-2',
    schemeId: 'scheme-uuid-2',
    schemeName: 'Differently Abled Higher Education Assistance',
    slug: 'differently-abled-higher-ed',
    shortDescription: 'Scholarship grant for differently abled students in higher education.',
    programType: 'SCHOLARSHIP',
    categories: ['EDUCATION', 'PERSONS_WITH_DISABILITIES'],
    departmentName: 'Department for Welfare of Differently Abled Persons',
    stateScope: 'Tamil Nadu',
    eligibilityStatus: 'NEEDS_VERIFICATION',
    applicationStatus: 'OPEN',
    isExpiringSoon: false,
    deadline: '2026-11-15',
    primaryBenefit: {
      type: 'SCHOLARSHIP',
      amount: 30000,
      frequency: 'ANNUAL',
      description: 'Academic allowance for disabled students',
    },
    matchedCount: 2,
    failedCount: 0,
    unknownCount: 1,
    summary: 'Disability status is required to confirm eligibility.',
    missingFields: ['disability_status'],
    schemeVersionNumber: 1,
    evaluatedAt: '2026-09-26T08:00:00.000Z',
  },
];

const mockSummaryCounts = {
  total: 2,
  ELIGIBLE: 1,
  LIKELY_ELIGIBLE: 0,
  NEEDS_VERIFICATION: 1,
  NOT_ELIGIBLE: 0,
  EXPIRING_SOON: 1,
};

describe('RecommendationsPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
      },
    });

    vi.mocked(recommendationsApi.getRecommendations).mockResolvedValue({
      items: mockRecommendations,
      pagination: {
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1,
      },
    });

    vi.mocked(recommendationsApi.getSummaryCounts).mockResolvedValue(mockSummaryCounts);

    vi.mocked(recommendationsApi.refreshRecommendations).mockResolvedValue({
      totalSchemesEvaluated: 5,
      eligibleCount: 2,
      likelyEligibleCount: 1,
      needsVerificationCount: 1,
      notEligibleCount: 1,
      refreshedAt: '2026-09-26T08:30:00.000Z',
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RecommendationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(recommendationsApi.getRecommendations).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByTestId('recommendations-loading-skeleton')).toBeInTheDocument();
  });

  it('renders recommendation cards and summary metrics on successful load', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Post-Matric Scholarship for BC Students')).toBeInTheDocument();
    });

    // Check summary strip text
    expect(screen.getByText('Satisfies all statutory rules')).toBeInTheDocument();
    expect(screen.getByText('Missing profile facts')).toBeInTheDocument();

    // Check cards rendered
    expect(screen.getByText('Differently Abled Higher Education Assistance')).toBeInTheDocument();
    expect(screen.getByText('3 criteria satisfied')).toBeInTheDocument();
    expect(screen.getByText('1 needs verification')).toBeInTheDocument();
  });

  it('handles status filter tab clicks', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Post-Matric Scholarship for BC Students')).toBeInTheDocument();
    });

    // Click Eligible filter tab
    const eligibleFilterBtn = screen.getByRole('button', { name: /^Eligible$/i });
    fireEvent.click(eligibleFilterBtn);

    expect(recommendationsApi.getRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ELIGIBLE',
      })
    );
  });

  it('triggers refresh evaluation when "Re-Evaluate Profile" button is clicked', async () => {
    vi.mocked(recommendationsApi.refreshRecommendations).mockResolvedValueOnce({
      totalSchemesEvaluated: 5,
      eligibleCount: 2,
      likelyEligibleCount: 1,
      needsVerificationCount: 1,
      notEligibleCount: 1,
      refreshedAt: '2026-09-26T08:30:00.000Z',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Post-Matric Scholarship for BC Students')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByTestId('refresh-recommendations-btn');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(recommendationsApi.refreshRecommendations).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText(/Evaluation refreshed: 2 eligible, 1 likely eligible, 1 requiring verification./i)
    ).toBeInTheDocument();
  });

  it('renders empty state when no recommendations match filters', async () => {
    vi.mocked(recommendationsApi.getRecommendations).mockResolvedValueOnce({
      items: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('empty-recommendations-state')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/We couldn't find a matching scheme based on the information currently available in your profile/i)
    ).toBeInTheDocument();
  });
});
