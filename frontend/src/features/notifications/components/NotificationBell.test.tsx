import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { notificationsApi } from '../api/notifications.api';
import { NotificationItemData } from '../../../types/notification';

vi.mock('../api/notifications.api');

const mockRecentItem: NotificationItemData = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'SCHEME_DEADLINE_APPROACHING',
  title: 'Application deadline approaching',
  message: 'Closes in 3 days',
  severity: 'IMPORTANT',
  channel: 'IN_APP',
  status: 'UNREAD',
  readAt: null,
  sentAt: '2026-09-26T10:00:00Z',
  scheduledFor: null,
  expiresAt: null,
  entityType: 'SCHEME',
  entityId: 'scheme-1',
  actionUrl: '/schemes/test-scheme',
  metadata: null,
  createdAt: '2026-09-26T10:00:00Z',
  updatedAt: '2026-09-26T10:00:00Z',
};

describe('NotificationBell Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bell button and badge with unread count', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue(3);
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      items: [mockRecentItem],
      total: 1,
      unreadCount: 3,
      page: 1,
      limit: 5,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    await waitFor(() => {
      const bellButton = screen.getByRole('button', { name: /Notifications/i });
      expect(bellButton).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('opens dropdown menu on click and displays recent notifications', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue(1);
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      items: [mockRecentItem],
      total: 1,
      unreadCount: 1,
      page: 1,
      limit: 5,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    const bellButton = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Notifications preview/i })).toBeInTheDocument();
      expect(screen.getByText('Application deadline approaching')).toBeInTheDocument();
      expect(screen.getByText(/View all notifications/i)).toBeInTheDocument();
    });
  });
});
