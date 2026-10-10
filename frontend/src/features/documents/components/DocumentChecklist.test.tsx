import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DocumentChecklist } from './DocumentChecklist';
import { documentsApi } from '../api/documents.api';
import { SchemeDocumentReadiness } from '../../../types/document';

vi.mock('../api/documents.api');

const mockReadiness: SchemeDocumentReadiness = {
  schemeId: 'scheme-123',
  schemeName: 'Pre-Matric Scholarship Scheme',
  totalRequirements: 3,
  readyCount: 2,
  missingCount: 1,
  needsReviewCount: 0,
  expiredCount: 0,
  isFullyPrepared: false,
  requirements: [
    {
      requirementId: 'req-1',
      requirementName: 'Annual Income Certificate',
      documentType: 'INCOME_CERTIFICATE',
      mandatory: true,
      description: 'Income proof issued by revenue authorities',
      readinessStatus: 'READY',
      matchedDocument: {
        id: 'doc-1',
        originalFileName: 'income_cert.pdf',
        documentStatus: 'READY',
        ocrStatus: 'COMPLETED',
        expiresAt: '2027-01-01',
        isExpired: false,
      },
      readinessNote: 'Ready for use.',
    },
    {
      requirementId: 'req-2',
      requirementName: 'Community Certificate',
      documentType: 'COMMUNITY_CERTIFICATE',
      mandatory: true,
      description: 'Caste / Community certificate',
      readinessStatus: 'READY',
      matchedDocument: {
        id: 'doc-2',
        originalFileName: 'community_cert.pdf',
        documentStatus: 'READY',
        ocrStatus: 'COMPLETED',
        expiresAt: null,
        isExpired: false,
      },
      readinessNote: 'Ready for use.',
    },
    {
      requirementId: 'req-3',
      requirementName: 'Bank Passbook Proof',
      documentType: 'BANK_PASSBOOK',
      mandatory: true,
      description: 'First page of savings bank account passbook',
      readinessStatus: 'MISSING',
      matchedDocument: null,
      readinessNote: 'Missing mandatory document. Upload to proceed with scheme application.',
    },
  ],
  evaluatedAt: '2026-09-26T12:00:00Z',
  disclaimer:
    'Documents uploaded here are used to help organize application requirements and extract information. Final document acceptance and legal eligibility decisions are made by the respective scheme authority.',
};

describe('DocumentChecklist Component (Module 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(documentsApi.getSchemeDocumentReadiness).mockResolvedValue(mockReadiness);
  });

  it('renders readiness header, progress count, and requirement items', async () => {
    render(
      <MemoryRouter>
        <DocumentChecklist schemeId="scheme-123" />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Document Verification Readiness')).toBeInTheDocument();
    });

    expect(screen.getByText('2 of 3 Documents Ready')).toBeInTheDocument();
    expect(screen.getByText('Annual Income Certificate')).toBeInTheDocument();
    expect(screen.getByText('Community Certificate')).toBeInTheDocument();
    expect(screen.getByText('Bank Passbook Proof')).toBeInTheDocument();

    // Badges
    expect(screen.getAllByText('✓ Ready')).toHaveLength(2);
    expect(screen.getByText('× Missing')).toBeInTheDocument();

    // Upload action for missing requirement
    expect(screen.getByRole('link', { name: /Upload/i })).toBeInTheDocument();
  });

  it('displays mandatory disclaimer and does NOT declare final legal eligibility', async () => {
    render(
      <MemoryRouter>
        <DocumentChecklist schemeId="scheme-123" />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Final document acceptance and legal eligibility decisions are made by the respective scheme authority/i)).toBeInTheDocument();
    });

    // Verify it NEVER claims final approval
    expect(screen.queryByText(/You are legally approved/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Government has verified your eligibility/i)).not.toBeInTheDocument();
  });
});
