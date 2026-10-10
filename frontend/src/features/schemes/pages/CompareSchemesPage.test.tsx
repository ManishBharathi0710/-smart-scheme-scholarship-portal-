import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompareSchemesPage } from './CompareSchemesPage';
import { schemesApi } from '../api/schemes.api';
import { savedSchemesApi } from '../../saved-schemes/api/saved-schemes.api';
import { SchemeComparisonResponse } from '../../../types/comparison';

vi.mock('../api/schemes.api');
vi.mock('../../saved-schemes/api/saved-schemes.api');

const mockComparison: SchemeComparisonResponse = {
  comparedCount: 2,
  maxAllowed: 4,
  schemes: [
    {
      id: 'scheme-1',
      slug: 'merit-scholarship',
      name: 'State Merit Scholarship',
      programType: 'SCHOLARSHIP',
      categories: ['EDUCATION'],
      departmentName: 'Department of Higher Education',
      departmentLevel: 'STATE',
      geographicScope: 'Tamil Nadu',
      benefitsSummary: ['Direct scholarship grant of ₹25,000'],
      requiredDocuments: ['Income Certificate', 'Marksheet'],
      applicationStatus: 'OPEN',
      applicationCloseDate: '2026-11-30T23:59:59.000Z',
      applicationMethod: 'ONLINE',
      officialApplicationUrl: 'https://scholarships.gov.in',
      officialSourceUrl: 'https://scholarships.gov.in/source',
      userEligibility: {
        status: 'ELIGIBLE',
        evaluatedAt: '2026-09-26T10:00:00.000Z',
        missingRequirements: [],
      },
    },
    {
      id: 'scheme-2',
      slug: 'skill-stipend',
      name: 'Youth Skill Development Stipend',
      programType: 'TRAINING',
      categories: ['SKILL_DEVELOPMENT'],
      departmentName: 'Department of Skill Development',
      departmentLevel: 'STATE',
      geographicScope: 'Tamil Nadu',
      benefitsSummary: ['Course stipend and certification subsidy of ₹15,000'],
      requiredDocuments: ['Aadhaar Card'],
      applicationStatus: 'OPEN',
      applicationCloseDate: null,
      applicationMethod: 'ONLINE',
      officialApplicationUrl: 'https://skills.gov.in',
      officialSourceUrl: 'https://skills.gov.in/source',
      userEligibility: {
        status: 'LIKELY_ELIGIBLE',
        evaluatedAt: '2026-09-26T10:00:00.000Z',
        missingRequirements: ['Income Certificate'],
      },
    },
  ],
};

describe('CompareSchemesPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(savedSchemesApi.getSavedSchemeIds).mockResolvedValue({
      schemeIds: [],
      count: 0,
    });
    vi.mocked(schemesApi.compareSchemes).mockResolvedValue(mockComparison);
  });

  it('renders comparative matrix with side-by-side schemes and key attributes', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/schemes/compare?ids=scheme-1,scheme-2']}>
          <CompareSchemesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Statutory Schemes Comparison Matrix/i)).toBeInTheDocument();
      expect(screen.getByText('State Merit Scholarship')).toBeInTheDocument();
      expect(screen.getByText('Youth Skill Development Stipend')).toBeInTheDocument();
      expect(screen.getByText('Department of Higher Education')).toBeInTheDocument();
      expect(screen.getByText('Department of Skill Development')).toBeInTheDocument();
      expect(screen.getByText('Your Eligibility Assessment')).toBeInTheDocument();
      expect(screen.getByText('Eligible')).toBeInTheDocument();
      expect(screen.getByText('Likely Eligible')).toBeInTheDocument();
    });
  });

  it('renders empty selection state when no scheme IDs are passed in query params', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/schemes/compare']}>
          <CompareSchemesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('No Schemes Selected for Comparison')).toBeInTheDocument();
    expect(screen.getByText(/Browse Schemes Directory/i)).toBeInTheDocument();
  });
});
