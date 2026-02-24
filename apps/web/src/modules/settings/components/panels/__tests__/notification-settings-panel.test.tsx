/** @module notification-settings-panel tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const mockUpdateNotificationSettings = vi.fn().mockResolvedValue(undefined);
const mockFetchSettings = vi.fn().mockResolvedValue(undefined);

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      notifications: {
        notifyMessages: true,
        notifyMentions: true,
        notifyForumReplies: false,
        notifyFriendRequests: true,
        notifyGroupInvites: false,
        emailNotifications: true,
        notificationSound: true,
      },
    },
    updateNotificationSettings: mockUpdateNotificationSettings,
    fetchSettings: mockFetchSettings,
    isSaving: false,
  })),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: React.PropsWithChildren) => (
    <div data-testid="glass-card">{children}</div>
  ),
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { NotificationSettingsPanel } from '../notification-settings-panel';

describe('NotificationSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSettings.mockResolvedValue(undefined);
  });

  it('renders after loading', async () => {
    render(<NotificationSettingsPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Direct Messages/i)).toBeInTheDocument();
    });
  });

  it('renders key notification setting labels', async () => {
    render(<NotificationSettingsPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Direct Messages/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Forum Replies/i)).toBeInTheDocument();
    expect(screen.getByText(/Friend Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Email Notifications/i)).toBeInTheDocument();
  });

  it('calls fetchSettings on mount', () => {
    render(<NotificationSettingsPanel />);
    expect(mockFetchSettings).toHaveBeenCalled();
  });

  it('renders toggle buttons', async () => {
    render(<NotificationSettingsPanel />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(7);
    });
  });

  it('calls updateNotificationSettings when a toggle is clicked', async () => {
    render(<NotificationSettingsPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Direct Messages/i)).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]!);

    await waitFor(() => {
      expect(mockUpdateNotificationSettings).toHaveBeenCalled();
    });
  });
});
