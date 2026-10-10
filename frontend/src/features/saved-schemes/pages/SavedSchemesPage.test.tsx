import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SavedSchemesPage } from './SavedSchemesPage';
import { savedSchemesApi } from '../api/saved-schemes.api';
import { SavedSchemeCard } from '../../../types/saved-scheme';

vi.mock('../api/saved-schemes.api');

const mockSavedItem: SavedSchemeCard = {
  savedId: 'saved-1',
  savedAt: '2026-09-25T10:00:00.000Z',
  scheme: {
    id: 'scheme-1',
    slug: 'post-matric-scholarship',
    name: 'Post-Matric Scholarship for SC/ST Students',
    shortName: 'PMS-SCST',
    shortDescription: 'State-sponsored financial grant for higher education.',
    programType: 'SCHOLARSHIP',
    categories: ['EDUCATION'],
    departmentName: 'Department of Higher Education',
    stateScope: 'Tamil Nadu',
    primaryBenefit: {
      type: 'SCHOLARSHIP',
      amount: 30000,
      frequency: 'ANNUAL',
      description: 'Annual scholarship assistance',
    },
    activeApplicationPeriod: {
      title: '2026-2027 Cycle',
      openDate: '2026-07-01',
      closeDate: '2026-10-31',
      status: 'OPEN',
    },
    officialPortalUrl: 'https://scholarships.gov.in',
  },
  recommendation: {
    eligibilityStatus: 'ELIGIBLE',
    isExpiringSoon: false,
    matchedCount: 3,
    failedCount: 0,
    unknownCount: 0,
    summary: 'You meet all mandatory criteria based on your profile.',
  },
};

describe('SavedSchemesPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(savedSchemesApi.getSavedSchemes).mockResolvedValue({
      items: [mockSavedItem],
      pagination: {
        page: 1,
        pageSize: 12,
        total: 1,
        totalPages: 1,
      },
    });

    vi.mocked(savedSchemesApi.getSavedSchemeIds).mockResolvedValue({
      schemeIds: ['scheme-1'],
      count: 1,
    });
  });

  it('renders saved schemes header, count badge, and saved cards', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SavedSchemesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/My Saved Schemes & Scholarships/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Post-Matric Scholarship for SC/ST Students')).toBeInTheDocument();
      expect(screen.getByText('Department of Higher Education')).toBeInTheDocument();
      expect(screen.getByText('₹30,000')).toBeInTheDocument();
      expect(screen.getByText('Eligible')).toBeInTheDocument();
    });
  });

  it('filters saved schemes when search filter is typed', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SavedSchemesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Post-Matric Scholarship for SC/ST Students')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search your saved schemes/i);
    fireEvent.change(searchInput, { target: { value: 'Non-existent' } });

    expect(screen.queryByText('Post-Matric Scholarship for SC/ST Students')).not.toBeInTheDocument();
    expect(screen.getByText(/No matching saved schemes/i)).toBeInTheDocument();
  });

  it('shows empty state when user has not bookmarked any schemes', async () => {
    vi.mocked(savedSchemesApi.getSavedSchemes).mockResolvedValueOnce({
      items: [],
      pagination: {
        page: 1,
        pageSize: 12,
        total: 0,
        totalPages: 0,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SavedSchemesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/haven't saved any schemes yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Explore Schemes Directory/i)).toBeInTheDocument();
    });
  });
});
