import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SchemeDetailPage } from './SchemeDetailPage';
import { schemesApi } from '../api/schemes.api';
import { PublicSchemeDetail } from '../../../types/scheme';

vi.mock('../api/schemes.api');

const mockDetail: PublicSchemeDetail = {
  id: 'scheme-uuid-1',
  name: 'Tamil Nadu Higher Education Special Scholarship',
  slug: 'tn-higher-education-special-scholarship',
  shortName: 'TNHESS',
  description: 'Comprehensive financial support for eligible students enrolled in state universities.',
  shortDescription: 'Higher education support for economically disadvantaged students.',
  programType: 'SCHOLARSHIP',
  categories: ['EDUCATION'],
  department: {
    id: 'dept-1',
    name: 'Higher Education Department',
    level: 'STATE',
    description: 'Government of Tamil Nadu Higher Education Department',
    officialWebsite: 'https://highereducation.tn.gov.in',
  },
  stateScope: 'Tamil Nadu',
  status: 'PUBLISHED',
  verificationStatus: 'VERIFIED',
  officialSourceUrl: 'https://highereducation.tn.gov.in/schemes/tnhess',
  officialApplicationUrl: 'https://scholarships.gov.in',
  applicationMethod: 'ONLINE',
  benefits: [
    {
      id: 'benefit-1',
      benefitType: 'SCHOLARSHIP',
      amount: 25000,
      currency: 'INR',
      frequency: 'ANNUAL',
      duration: 'Course duration (up to 4 years)',
      description: 'Annual tuition and maintenance assistance.',
    },
  ],
  documents: [
    {
      id: 'doc-1',
      documentType: 'INCOME_CERTIFICATE',
      name: 'Family Income Certificate',
      description: 'Issued by Revenue Tahsildar within the past 12 months.',
      mandatory: true,
      notes: 'Maximum allowable income ₹2,50,000.',
    },
    {
      id: 'doc-2',
      documentType: 'MARKSHEET',
      name: 'HSC / 12th Standard Marksheet',
      description: 'Official marksheet showing at least 60% aggregate.',
      mandatory: true,
      notes: null,
    },
  ],
  applicationPeriods: [
    {
      id: 'period-1',
      title: '2026-2027 Cycle',
      applicationOpenDate: '2026-08-01',
      applicationCloseDate: '2026-11-30',
      academicYear: '2026-2027',
      financialYear: '2026-2027',
      status: 'OPEN',
      instructions: 'Late applications will not be entertained.',
    },
  ],
  eligibilityRequirements: [
    {
      field: 'annual_family_income',
      operator: 'LESS_THAN_OR_EQUAL',
      mandatory: true,
      description: 'Annual family income must not exceed ₹2,50,000.',
    },
    {
      field: 'academic_percentage',
      operator: 'GREATER_THAN_OR_EQUAL',
      mandatory: true,
      description: 'Minimum 60% aggregate marks in previous examination.',
    },
    {
      field: 'state',
      operator: 'EQUALS',
      mandatory: true,
      description: 'Applicant must be a permanent resident of Tamil Nadu.',
    },
  ],
  lastVerifiedAt: '2026-09-22T08:00:00.000Z',
  publishedAt: '2026-09-23T10:00:00.000Z',
  isPublished: true,
  updatedAt: '2026-09-23T10:00:00.000Z',
};

describe('SchemeDetailPage Component', () => {
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

    vi.mocked(schemesApi.getPublishedSchemeDetail).mockResolvedValue(mockDetail);
  });

  it('renders verified scheme details, official trust badge and statutory eligibility requirements', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/schemes/tn-higher-education-special-scholarship']}>
          <Routes>
            <Route path="/schemes/:idOrSlug" element={<SchemeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tamil Nadu Higher Education Special Scholarship')).toBeInTheDocument();
      expect(screen.getByText('Annual family income must not exceed ₹2,50,000.')).toBeInTheDocument();
      expect(screen.getByText('Minimum 60% aggregate marks in previous examination.')).toBeInTheDocument();
      expect(screen.getByText('Applicant must be a permanent resident of Tamil Nadu.')).toBeInTheDocument();
    });

    // Verify statutory disclaimer exists (No recommendation score generated in Module 3)
    expect(
      screen.getByText(/Statutory Eligibility Requirements/i),
    ).toBeInTheDocument();
  });

  it('renders structured benefits and required documents checklist', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/schemes/tn-higher-education-special-scholarship']}>
          <Routes>
            <Route path="/schemes/:idOrSlug" element={<SchemeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('₹25,000')).toBeInTheDocument();
      expect(screen.getByText('Family Income Certificate')).toBeInTheDocument();
      expect(screen.getByText('HSC / 12th Standard Marksheet')).toBeInTheDocument();
    });
  });

  it('opens external application confirmation modal when clicking apply button', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/schemes/tn-higher-education-special-scholarship']}>
          <Routes>
            <Route path="/schemes/:idOrSlug" element={<SchemeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply on Official Portal/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Apply on Official Portal/i }));

    expect(screen.getByText(/Leaving Portal for Official Website/i)).toBeInTheDocument();
    expect(
      screen.getByText(/You are being directed to the official authorized portal for this scheme/i),
    ).toBeInTheDocument();

    const proceedButton = screen.getByRole('button', { name: /Proceed to Official Site/i });
    fireEvent.click(proceedButton);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://scholarships.gov.in',
      '_blank',
      'noopener,noreferrer',
    );

    windowOpenSpy.mockRestore();
  });
});
