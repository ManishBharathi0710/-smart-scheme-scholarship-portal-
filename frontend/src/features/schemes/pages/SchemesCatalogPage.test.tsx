import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SchemesCatalogPage } from './SchemesCatalogPage';
import { schemesApi } from '../api/schemes.api';
import { PublicSchemeCard, FilterMetadata } from '../../../types/scheme';

vi.mock('../api/schemes.api');

const mockSchemes: PublicSchemeCard[] = [
  {
    id: 'scheme-uuid-1',
    name: 'Post-Matric Scholarship for Backward Classes',
    slug: 'post-matric-scholarship-bc',
    shortName: 'PMS-BC',
    shortDescription: 'Financial assistance for post-secondary education of eligible students.',
    programType: 'SCHOLARSHIP',
    categories: ['EDUCATION'],
    departmentName: 'Department of Backward Classes Welfare',
    departmentLevel: 'STATE',
    stateScope: 'Tamil Nadu',
    verificationStatus: 'VERIFIED',
    applicationMethod: 'ONLINE',
    primaryBenefit: {
      type: 'SCHOLARSHIP',
      amount: 25000,
      frequency: 'ANNUAL',
      description: '₹25,000 per academic year directly deposited to bank account.',
    },
    activeApplicationPeriod: {
      openDate: '2026-07-01',
      closeDate: '2026-10-31',
      title: '2026-2027 Cycle',
      status: 'OPEN',
    },
    lastVerifiedAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'scheme-uuid-2',
    name: 'Chief Minister Micro-Enterprise Seed Subsidy',
    slug: 'cm-micro-enterprise-seed-subsidy',
    shortName: 'CMMESS',
    shortDescription: 'One-time capital subsidy for micro-enterprises and self-employed youth.',
    programType: 'SUBSIDY',
    categories: ['ENTREPRENEURSHIP'],
    departmentName: 'Micro, Small and Medium Enterprises Department',
    departmentLevel: 'STATE',
    stateScope: 'Tamil Nadu',
    verificationStatus: 'VERIFIED',
    applicationMethod: 'ONLINE',
    primaryBenefit: {
      type: 'SUBSIDY',
      amount: 50000,
      frequency: 'ONE_TIME',
      description: 'Capital subsidy towards machinery acquisition.',
    },
    activeApplicationPeriod: {
      openDate: null,
      closeDate: null,
      title: 'Annual Rolling',
      status: 'OPEN',
    },
    lastVerifiedAt: '2026-08-15T09:00:00.000Z',
  },
];

const mockFilterMeta: FilterMetadata = {
  programTypes: ['SCHOLARSHIP', 'WELFARE_SCHEME', 'SUBSIDY', 'LOAN', 'INSURANCE', 'PENSION'],
  categories: ['EDUCATION', 'AGRICULTURE', 'ENTREPRENEURSHIP', 'HEALTH'],
  departments: [
    { id: 'dept-1', name: 'Department of Backward Classes Welfare', level: 'STATE' },
    { id: 'dept-2', name: 'Micro, Small and Medium Enterprises Department', level: 'STATE' },
  ],
};

describe('SchemesCatalogPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(schemesApi.getFilterMetadata).mockResolvedValue(mockFilterMeta);
    vi.mocked(schemesApi.getPublishedSchemes).mockResolvedValue({
      items: mockSchemes,
      pagination: {
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('renders verified schemes catalog with headers and filter controls', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SchemesCatalogPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Public Scheme & Scholarship Discovery Directory/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by scheme name/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Post-Matric Scholarship for Backward Classes')).toBeInTheDocument();
      expect(screen.getByText('Chief Minister Micro-Enterprise Seed Subsidy')).toBeInTheDocument();
    });
  });

  it('displays structured benefit and verified badge', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SchemesCatalogPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('₹25,000')).toBeInTheDocument();
      expect(screen.getByText('₹50,000')).toBeInTheDocument();
      const verifiedBadges = screen.getAllByText(/Verified Official/i);
      expect(verifiedBadges.length).toBeGreaterThan(0);
    });
  });

  it('updates search query when user types in search bar', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SchemesCatalogPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const searchInput = screen.getByPlaceholderText(/Search by scheme name/i);
    fireEvent.change(searchInput, { target: { value: 'Scholarship' } });

    expect(searchInput).toHaveValue('Scholarship');
  });

  it('shows empty state when no schemes match criteria', async () => {
    vi.mocked(schemesApi.getPublishedSchemes).mockResolvedValueOnce({
      items: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SchemesCatalogPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No schemes found/i)).toBeInTheDocument();
      expect(screen.getByText(/No verified public schemes matched your current search/i)).toBeInTheDocument();
    });
  });
});
