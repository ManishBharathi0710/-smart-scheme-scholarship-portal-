import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogRecord } from '../../../types/analytics';

const mockLogs: AuditLogRecord[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    actorUserId: 'u-1',
    actorEmail: 'admin@gov.in',
    actorRole: 'ADMIN',
    action: 'SCHEME_PUBLISHED',
    entityType: 'Scheme',
    entityId: 'sc-100',
    result: 'SUCCESS',
    ipAddress: '192.168.1.1',
    timestamp: new Date('2026-09-20T10:00:00Z').toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    actorUserId: 'u-2',
    actorEmail: 'verifier@gov.in',
    actorRole: 'VERIFIER',
    action: 'DOCUMENT_REJECTED',
    entityType: 'UserDocument',
    entityId: 'doc-200',
    result: 'FAILURE',
    ipAddress: '192.168.1.2',
    timestamp: new Date('2026-09-21T11:00:00Z').toISOString(),
  },
];

describe('AuditLogTable Component (Module 9)', () => {
  it('renders table headers and audit log rows accurately', () => {
    const onPageChange = vi.fn();

    render(
      <AuditLogTable
        logs={mockLogs}
        currentPage={1}
        totalPages={1}
        totalItems={2}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText('SCHEME_PUBLISHED')).toBeInTheDocument();
    expect(screen.getByText('DOCUMENT_REJECTED')).toBeInTheDocument();
    expect(screen.getByText('admin@gov.in')).toBeInTheDocument();
    expect(screen.getByText('verifier@gov.in')).toBeInTheDocument();
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    expect(screen.getByText('FAILURE')).toBeInTheDocument();
  });

  it('toggles inspection details drawer when clicking Inspect', () => {
    const onPageChange = vi.fn();

    render(
      <AuditLogTable
        logs={mockLogs}
        currentPage={1}
        totalPages={1}
        totalItems={2}
        onPageChange={onPageChange}
      />
    );

    const inspectButtons = screen.getAllByRole('button', { name: /view details for audit entry/i });
    expect(inspectButtons).toHaveLength(2);

    fireEvent.click(inspectButtons[0]!);

    expect(
      screen.getByText(/Audit Record Payload Details \(11111111-1111-1111-1111-111111111111\)/i)
    ).toBeInTheDocument();
  });

  it('triggers onFilterChange when submitting the filter form', () => {
    const onFilterChange = vi.fn();

    render(
      <AuditLogTable
        logs={mockLogs}
        currentPage={1}
        totalPages={1}
        totalItems={2}
        onPageChange={vi.fn()}
        onFilterChange={onFilterChange}
      />
    );

    const actionInput = screen.getByPlaceholderText(/filter by action/i);
    fireEvent.change(actionInput, { target: { value: 'SCHEME_PUBLISHED' } });

    const filterButton = screen.getByRole('button', { name: /^Filter$/i });
    fireEvent.click(filterButton);

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SCHEME_PUBLISHED' })
    );
  });
});
