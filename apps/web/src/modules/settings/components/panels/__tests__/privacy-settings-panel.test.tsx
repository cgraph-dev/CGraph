/** @module privacy-settings-panel tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string}>{children}</div>
    ),
    button: ({ children, onClick }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button onClick={onClick as React.MouseEventHandler}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const mockUpdatePrivacySettings = vi.fn().mockResolvedValue(undefined);

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      privacy: {
        allowMessageRequests: 'everyone',
        showOnlineStatus: 'everyone',
        allowGroupInvites: 'anyone',
        profileVisibility: 'public',
        allowFriendRequests: true,
        showInSearch: true,
        showReadReceipts: true,
      },
    },
    updatePrivacySettings: mockUpdatePrivacySettings,
    isSaving: false,
  })),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: React.PropsWithChildren) => (
    <div data-testid="glass-card">{children}</div>
  ),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../privacy-field-config', () => ({
  PROFILE_FIELD_VISIBILITY_OPTIONS: [
    { key: 'showEmail', label: 'Email' },
    { key: 'showBio', label: 'Bio' },
  ],
}));

vi.mock('../../privacy-toggle', () => ({
  PrivacyToggle: ({
    label,
    settingKey,
    value,
  }: {
    label: string;
    settingKey: string;
    value: boolean;
  }) => (
    <div data-testid={`privacy-toggle-${settingKey}`}>
      <span>{label}</span>
      <span>{value ? 'On' : 'Off'}</span>
    </div>
  ),
}));

import { PrivacySettingsPanel } from '../privacy-settings-panel';

describe('PrivacySettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders DM permissions select', () => {
    render(<PrivacySettingsPanel />);
    expect(screen.getByText(/Direct Message/i)).toBeInTheDocument();
  });

  it('renders online status select', () => {
    render(<PrivacySettingsPanel />);
    expect(screen.getByText(/Online Status/i)).toBeInTheDocument();
  });

  it('renders group invites select', () => {
    render(<PrivacySettingsPanel />);
    expect(screen.getByText(/Who can add you to groups/i)).toBeInTheDocument();
  });

  it('renders profile visibility select', () => {
    render(<PrivacySettingsPanel />);
    expect(screen.getByText(/Profile Visibility/i)).toBeInTheDocument();
  });

  it('renders privacy toggles for friend requests and search', () => {
    render(<PrivacySettingsPanel />);
    expect(screen.getByText(/Allow Friend Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Show in Search/i)).toBeInTheDocument();
  });

  it('calls updatePrivacySettings on select change', async () => {
    render(<PrivacySettingsPanel />);
    const selects = screen.getAllByRole('combobox');
    if (selects.length > 0) {
      fireEvent.change(selects[0]!, { target: { value: 'friends' } });
      await waitFor(() => {
        expect(mockUpdatePrivacySettings).toHaveBeenCalled();
      });
    }
  });
});
