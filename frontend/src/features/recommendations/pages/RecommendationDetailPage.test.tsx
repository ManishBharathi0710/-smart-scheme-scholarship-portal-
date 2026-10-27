import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RecommendationDetailPage } from './RecommendationDetailPage';
import { recommendationsApi } from '../api/recommendations.api';
import type { RecommendationDetailDto } from '../../../types/recommendation';

vi.mock('../api/recommendations.api');

const mockDetail: RecommendationDetailDto = {
  id: 'rec-uuid-1',
  schemeId: 'scheme-uuid-1',
  schemeVersionId: 'version-uuid-1',
  eligibilityStatus: 'NEEDS_VERIFICATION',
  applicationStatus: 'OPEN',
  isExpiringSoon: true,
  daysUntilDeadline: 5,
  evaluatedAt: '2026-09-26T08:00:00.000Z',
  scheme: {
    id: 'scheme-uuid-1',
    name: 'Differently Abled Higher Education Scholarship',
    slug: 'differently-abled-scholarship',
    programType: 'SCHOLARSHIP',
    categories: ['EDUCATION', 'PERSONS_WITH_DISABILITIES'],
    department: 'Department for Welfare of Differently Abled Persons',
    stateScope: 'Tamil Nadu',
    officialPortalUrl: 'https://welfare.tn.gov.in/apply',
    applicationPeriod: {
      applicationOpenDate: '2026-08-01',
      applicationCloseDate: '2026-10-31',
    },
    benefits: [
      {
        type: 'SCHOLARSHIP',
        amount: 30000,
        frequency: 'ANNUAL',
        coverage: 'Full Tuition',
        description: 'Direct cash assistance for books and tuition fees.',
      },
    ],
    requiredDocuments: [
      {
        name: 'Disability Certificate',
        mandatory: true,
        description: 'Issued by competent medical board (minimum 40% disability)',
      },
      {
        name: 'Income Certificate',
        mandatory: true,
        description: 'Revenue department certificate verifying annual income below ₹2.5 Lakhs',
      },
    ],
  },
  schemeVersion: {
    id: 'version-uuid-1',
    versionNumber: 1,
    changeSummary: 'Initial verified statutory release',
    validFrom: '2026-01-01T00:00:00.000Z',
  },
  matchedCount: 2,
  failedCount: 0,
  unknownCount: 1,
  mandatoryFailuresCount: 0,
  explanation: {
    summary: 'Likely eligible based on verified criteria, pending confirmation of disability status.',
    matched: [
      'Your annual family income of ₹2,00,000 meets the requirement (<= ₹2,50,000).',
      'Your resident state is Tamil Nadu.',
    ],
    failed: [],
    unknown: [
      'Disability status is required by this scheme, but is not present in your profile.',
    ],
    conditions: [
      {
        field: 'annual_family_income',
        fieldLabel: 'Annual Family Income',
        operator: 'LESS_THAN_OR_EQUAL',
        requiredValue: 250000,
        actualValue: 200000,
        result: 'MATCH',
        mandatory: true,
        description: 'Income must be <= 250000',
        explanation: 'Your annual family income of ₹2,00,000 meets the requirement (<= ₹2,50,000).',
      },
      {
        field: 'state',
        fieldLabel: 'State',
        operator: 'EQUALS',
        requiredValue: 'Tamil Nadu',
        actualValue: 'Tamil Nadu',
        result: 'MATCH',
        mandatory: true,
        description: 'State must equal Tamil Nadu',
        explanation: 'Your resident state is Tamil Nadu.',
      },
      {
        field: 'disability_status',
        fieldLabel: 'Disability Status',
        operator: 'EQUALS',
        requiredValue: true,
        actualValue: null,
        result: 'UNKNOWN',
        mandatory: true,
        description: 'Disability must be true',
        explanation: 'Disability status is required by this scheme, but is not present in your profile.',
      },
    ],
  },
  missingInformation: [
    {
      field: 'disability_status',
      label: 'Disability status',
      description: 'Your profile is missing disability details required by this scheme.',
      section: 'social',
    },
  ],
  evaluationDetails: {
    summary: 'Likely eligible based on verified criteria, pending confirmation of disability status.',
    matchedConditions: [],
    failedConditions: [],
    unknownConditions: [],
    missingInformation: [],
    rulesEvaluated: 3,
  },
  slug: 'differently-abled-scholarship',
  schemeName: 'Differently Abled Higher Education Scholarship',
  programType: 'SCHOLARSHIP',
  categories: ['EDUCATION', 'PERSONS_WITH_DISABILITIES'],
  summary: 'Likely eligible based on verified criteria, pending confirmation of disability status.',
  schemeVersionNumber: 1,
};

describe('RecommendationDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (id = 'rec-uuid-1') => {
    return render(
      <MemoryRouter initialEntries={[`/recommendations/${id}`]}>
        <Routes>
          <Route path="/recommendations/:id" element={<RecommendationDetailPage />} />
          <Route path="/recommendations" element={<div>All Recommendations Page</div>} />
          <Route path="/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading skeleton while fetching recommendation', () => {
    vi.mocked(recommendationsApi.getById).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByTestId('recommendation-detail-loading')).toBeInTheDocument();
  });

  it('renders error state when recommendation is not found', async () => {
    vi.mocked(recommendationsApi.getById).mockRejectedValueOnce(
      new Error('Evaluation record does not exist')
    );

    renderComponent('unknown-id');

    await waitFor(() => {
      expect(screen.getByTestId('recommendation-detail-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Unable to Load Evaluation')).toBeInTheDocument();
  });

  it('renders complete recommendation detail with explanations, benefits, and missing information', async () => {
    vi.mocked(recommendationsApi.getById).mockResolvedValueOnce(mockDetail);

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Differently Abled Higher Education Scholarship')
      ).toBeInTheDocument();
    });

    // Verify status badge
    expect(screen.getAllByText('Needs Verification').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Closing Soon/i)).toBeInTheDocument();

    // Verify explanation content
    expect(
      screen.getByText(/Likely eligible based on verified criteria, pending confirmation of disability status/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your resident state is Tamil Nadu./i)
    ).toBeInTheDocument();

    // Verify missing information CTA
    expect(screen.getByTestId('missing-information-card')).toBeInTheDocument();
    expect(screen.getByText('Disability status')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Update Profile Attributes/i })).toBeInTheDocument();

    // Verify benefits and documents
    expect(screen.getByText(/Direct cash assistance for books and tuition fees./i)).toBeInTheDocument();
    expect(screen.getByText('Disability Certificate')).toBeInTheDocument();

    // Verify statutory disclaimer
    expect(screen.getByText(/Official Decision-Support Notice/i)).toBeInTheDocument();
  });

  it('opens and closes the official portal exit warning modal', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    vi.mocked(recommendationsApi.getById).mockResolvedValueOnce(mockDetail);

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Differently Abled Higher Education Scholarship')
      ).toBeInTheDocument();
    });

    // Click Apply on Official Portal button
    const applyBtn = screen.getByTestId('apply-official-portal-btn');
    fireEvent.click(applyBtn);

    // Modal should appear
    expect(screen.getByTestId('exit-portal-modal')).toBeInTheDocument();
    expect(screen.getByText(/Leaving to Official.*Portal/i)).toBeInTheDocument();

    // Confirm navigation
    const confirmBtn = screen.getByTestId('confirm-external-link-btn');
    fireEvent.click(confirmBtn);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://welfare.tn.gov.in/apply',
      '_blank',
      'noopener,noreferrer'
    );

    windowOpenSpy.mockRestore();
  });
});
