import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DocumentsPage } from './DocumentsPage';
import { documentsApi } from '../api/documents.api';
import { UserDocument } from '../../../types/document';

vi.mock('../api/documents.api');

const mockDoc1: UserDocument = {
  id: 'doc-1',
  userId: 'user-1',
  documentGroupId: 'group-1',
  version: 1,
  isCurrent: true,
  documentType: 'INCOME_CERTIFICATE',
  documentTypeLabel: 'Income Certificate',
  documentCategory: 'INCOME',
  originalFileName: 'income_cert_2026.pdf',
  mimeType: 'application/pdf',
  fileSize: 1024 * 350,
  checksum: 'chk-1',
  documentStatus: 'READY',
  ocrStatus: 'COMPLETED',
  verificationStatus: 'VERIFIED_FOR_USE',
  issuedAt: '2026-01-10',
  expiresAt: '2027-01-10',
  isExpired: false,
  issuingAuthority: 'Tahsildar Revenue Dept',
  documentNumberMasked: 'INC-XXXX-1234',
  ocrConsent: true,
  ocrConsentedAt: '2026-01-10T10:00:00Z',
  hasExtraction: true,
  latestExtractionId: 'ext-1',
  createdAt: '2026-01-10T10:00:00Z',
  updatedAt: '2026-01-10T10:00:00Z',
};

const mockDoc2: UserDocument = {
  id: 'doc-2',
  userId: 'user-1',
  documentGroupId: 'group-2',
  version: 1,
  isCurrent: true,
  documentType: 'COMMUNITY_CERTIFICATE',
  documentTypeLabel: 'Community / Caste Certificate',
  documentCategory: 'COMMUNITY',
  originalFileName: 'caste_cert.pdf',
  mimeType: 'application/pdf',
  fileSize: 1024 * 512,
  checksum: 'chk-2',
  documentStatus: 'NEEDS_REVIEW',
  ocrStatus: 'LOW_CONFIDENCE',
  verificationStatus: 'PENDING_REVIEW',
  issuedAt: '2025-05-15',
  expiresAt: null,
  isExpired: false,
  issuingAuthority: 'Sub-Collector',
  documentNumberMasked: 'CST-XXXX-5678',
  ocrConsent: true,
  ocrConsentedAt: '2026-01-10T10:00:00Z',
  hasExtraction: true,
  latestExtractionId: 'ext-2',
  createdAt: '2026-01-12T10:00:00Z',
  updatedAt: '2026-01-12T10:00:00Z',
};

describe('DocumentsPage Component (Module 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(documentsApi.getDocuments).mockResolvedValue({
      items: [mockDoc1, mockDoc2],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('renders document vault header, metric counts, and document cards', async () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>,
    );

    // Header and title
    expect(screen.getByText(/My Documents & Verification Readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/Secure Citizen Document Vault/i)).toBeInTheDocument();

    // Metrics bar
    await waitFor(() => {
      expect(screen.getByText('Income Certificate')).toBeInTheDocument();
    });

    expect(screen.getByText('Community / Caste Certificate')).toBeInTheDocument();
    expect(screen.getByText(/Tahsildar Revenue Dept/i)).toBeInTheDocument();
    expect(screen.getByText(/Sub-Collector/i)).toBeInTheDocument();

    // Action buttons
    expect(screen.getAllByRole('button', { name: /Download/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Review Data/i })).toHaveLength(2);
  });

  it('filters documents when selecting a category tab', async () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Income Certificate')).toBeInTheDocument();
    });

    // Click "Community" tab
    const communityTab = screen.getByRole('button', { name: 'Community' });
    fireEvent.click(communityTab);

    // Only Community Certificate should remain
    expect(screen.queryByText('Income Certificate')).not.toBeInTheDocument();
    expect(screen.getByText('Community / Caste Certificate')).toBeInTheDocument();
  });

  it('opens upload modal when clicking "Upload Document"', async () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Income Certificate')).toBeInTheDocument();
    });

    const uploadBtn = screen.getByRole('button', { name: /Upload Document/i });
    fireEvent.click(uploadBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Choose Document File')).toBeInTheDocument();
    expect(screen.getByText(/Enable OCR information extraction/i)).toBeInTheDocument();
  });

  it('calls downloadDocumentFile when clicking Download button', async () => {
    vi.mocked(documentsApi.downloadDocumentFile).mockResolvedValue();

    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Income Certificate')).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByRole('button', { name: /Download/i });
    fireEvent.click(downloadButtons[0]!);

    await waitFor(() => {
      expect(documentsApi.downloadDocumentFile).toHaveBeenCalledWith('doc-1', 'income_cert_2026.pdf');
    });
  });

  it('displays statutory legal disclaimer at the bottom', async () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Legal Notice & Disclaimer/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Final document acceptance and eligibility decisions are made solely by the respective scheme or scholarship authority/i),
    ).toBeInTheDocument();
  });
});
