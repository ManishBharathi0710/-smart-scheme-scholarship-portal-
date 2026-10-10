import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationsPage } from './NotificationsPage';
import { notificationsApi } from '../api/notifications.api';
import { NotificationItemData } from '../../../types/notification';

vi.mock('../api/notifications.api');

const mockNotif1: NotificationItemData = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'SCHEME_DEADLINE_APPROACHING',
  title: 'Application deadline approaching',
  message: 'The application period for "State Merit Scholarship" closes in 3 days.',
  severity: 'IMPORTANT',
  channel: 'IN_APP',
  status: 'UNREAD',
  readAt: null,
  sentAt: '2026-09-26T10:00:00Z',
  scheduledFor: null,
  expiresAt: null,
  entityType: 'SCHEME',
  entityId: 'scheme-1',
  actionUrl: '/schemes/state-merit-scholarship',
  metadata: { daysRemaining: 3 },
  createdAt: '2026-09-26T10:00:00Z',
  updatedAt: '2026-09-26T10:00:00Z',
};

const mockNotif2: NotificationItemData = {
  id: 'notif-2',
  userId: 'user-1',
  type: 'DOCUMENT_PROCESSING_COMPLETED',
  title: 'Document processing complete',
  message: 'Your document "income_cert.pdf" has been processed.',
  severity: 'INFO',
  channel: 'IN_APP',
  status: 'READ',
  readAt: '2026-09-26T11:00:00Z',
  sentAt: '2026-09-26T09:00:00Z',
  scheduledFor: null,
  expiresAt: null,
  entityType: 'DOCUMENT',
  entityId: 'doc-1',
  actionUrl: '/documents',
  metadata: null,
  createdAt: '2026-09-26T09:00:00Z',
  updatedAt: '2026-09-26T11:00:00Z',
};

describe('NotificationsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header, filters, and notification items', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      items: [mockNotif1, mockNotif2],
      total: 2,
      unreadCount: 1,
      page: 1,
      limit: 15,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Citizen Notifications & Alerts/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Application deadline approaching')).toBeInTheDocument();
      expect(screen.getByText('Document processing complete')).toBeInTheDocument();
    });

    expect(screen.getByText(/All Notifications/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unread/i })).toBeInTheDocument();
  });

  it('filters notifications by unread tab', async () => {
    vi.mocked(notificationsApi.getNotifications)
      .mockResolvedValueOnce({
        items: [mockNotif1, mockNotif2],
        total: 2,
        unreadCount: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        items: [mockNotif1],
        total: 1,
        unreadCount: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Application deadline approaching')).toBeInTheDocument();
    });

    const unreadTab = screen.getByRole('button', { name: /Unread/i });
    fireEvent.click(unreadTab);

    await waitFor(() => {
      expect(notificationsApi.getNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'UNREAD' })
      );
    });
  });

  it('marks a notification as read when mark read button is clicked', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      items: [mockNotif1],
      total: 1,
      unreadCount: 1,
      page: 1,
      limit: 15,
      totalPages: 1,
    });

    vi.mocked(notificationsApi.markAsRead).mockResolvedValue({
      ...mockNotif1,
      status: 'READ',
      readAt: '2026-09-26T12:00:00Z',
    });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Application deadline approaching')).toBeInTheDocument();
    });

    const markReadBtn = screen.getByRole('button', { name: /Mark read/i });
    fireEvent.click(markReadBtn);

    await waitFor(() => {
      expect(notificationsApi.markAsRead).toHaveBeenCalledWith('notif-1');
    });
  });

  it('marks all notifications as read', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      items: [mockNotif1],
      total: 1,
      unreadCount: 1,
      page: 1,
      limit: 15,
      totalPages: 1,
    });

    vi.mocked(notificationsApi.markAllAsRead).mockResolvedValue({ count: 1 });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Application deadline approaching')).toBeInTheDocument();
    });

    const markAllBtn = screen.getByRole('button', { name: /Mark all read/i });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(notificationsApi.markAllAsRead).toHaveBeenCalled();
    });
  });

  it('displays empty state when no notifications are found', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      items: [],
      total: 0,
      unreadCount: 0,
      page: 1,
      limit: 15,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No notifications to display/i)).toBeInTheDocument();
    });
  });
});
