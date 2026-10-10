import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationSettingsPage } from './NotificationSettingsPage';
import { notificationsApi } from '../api/notifications.api';
import { NotificationPreferences } from '../../../types/notification';

vi.mock('../api/notifications.api');

const mockPrefs: NotificationPreferences = {
  id: 'pref-1',
  userId: 'user-1',
  deadlineReminders: true,
  schemeUpdates: true,
  recommendationUpdates: true,
  documentAlerts: true,
  emailEnabled: true,
  inAppEnabled: true,
  createdAt: '2026-09-26T10:00:00Z',
  updatedAt: '2026-09-26T10:00:00Z',
};

describe('NotificationSettingsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders preference categories and channel controls with current state', async () => {
    vi.mocked(notificationsApi.getPreferences).mockResolvedValue(mockPrefs);

    render(
      <MemoryRouter>
        <NotificationSettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Notification & Alert Preferences/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText('Application Deadline Reminders')
      ).toBeInTheDocument();
      expect(screen.getByText('Saved Scheme Updates')).toBeInTheDocument();
      expect(screen.getByText('Recommendation Updates')).toBeInTheDocument();
      expect(
        screen.getByText('Document Expiry & Processing Alerts')
      ).toBeInTheDocument();
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(
        screen.getByText('In-App Notification Center')
      ).toBeInTheDocument();
    });

    const deadlineToggle = screen.getByLabelText('Application Deadline Reminders');
    expect(deadlineToggle).toBeChecked();
  });

  it('saves updated preferences and displays success message', async () => {
    vi.mocked(notificationsApi.getPreferences).mockResolvedValue(mockPrefs);
    vi.mocked(notificationsApi.updatePreferences).mockResolvedValue({
      ...mockPrefs,
      emailEnabled: false,
    });

    render(
      <MemoryRouter>
        <NotificationSettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Email Notifications')
      ).toBeInTheDocument();
    });

    const emailToggle = screen.getByLabelText('Email Notifications');
    fireEvent.click(emailToggle);

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(notificationsApi.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ emailEnabled: false })
      );
      expect(
        screen.getByText(/Preferences updated successfully/i)
      ).toBeInTheDocument();
    });
  });
});
