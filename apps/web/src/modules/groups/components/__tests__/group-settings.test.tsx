/**
 * @file group-settings.test.tsx
 * @description Tests for GroupSettings component — comprehensive group settings
 *   interface with tabs for overview, roles, members, channels, etc.
 * @module groups/components/__tests__/GroupSettings
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────
vi.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string') {
        return ({ children, initial, animate, exit, transition, variants, whileHover, whileTap, whileInView, layout, layoutId, ...rest }: any) => {
          const Tag = prop as any;
          return <Tag {...rest}>{children}</Tag>;
        };
      }
      return undefined;
    },
  });
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({ start: vi.fn() }),
    useInView: () => true,
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useTransform: () => ({ get: () => 0 }),
    useSpring: () => ({ get: () => 0 }),
  };
});

vi.mock('@/lib/animation-presets', () => ({ tweens: { standard: {} }, springs: { snappy: {}, bouncy: {} }, loop: () => ({}), loopWithDelay: () => ({}) }));
vi.mock('@/stores/theme', () => ({ useThemeStore: () => ({ theme: { colorPreset: 'blue' } }), THEME_COLORS: { blue: { primary: '#3b82f6', accent: '#8b5cf6' } } }));

vi.mock('../role-manager', () => ({
  RoleManager: () => <div data-testid="role-manager">RoleManager</div>,
}));

const mockSetActiveTab = vi.fn();
const mockUseGroupSettings = {
  activeGroup: { id: 'g-1', name: 'Test Group', description: 'desc', iconUrl: null, bannerUrl: null, roles: [], channels: [] },
  activeTab: 'overview',
  setActiveTab: mockSetActiveTab,
  isOwner: true,
  formData: { name: 'Test Group', description: 'desc' },
  handleFormChange: vi.fn(),
  hasChanges: false,
  isSaving: false,
  handleSave: vi.fn(),
  handleReset: vi.fn(),
  showLeaveConfirm: false,
  setShowLeaveConfirm: vi.fn(),
  showDeleteConfirm: false,
  setShowDeleteConfirm: vi.fn(),
  handleLeave: vi.fn(),
  handleDelete: vi.fn(),
};

vi.mock('./useGroupSettings', () => ({
  useGroupSettings: () => mockUseGroupSettings,
}));

vi.mock('./settings-sidebar', () => ({
  SettingsSidebar: ({ onTabChange }: { onTabChange: (tab: string) => void }) => (
    <div data-testid="settings-sidebar">
      <button onClick={() => onTabChange('overview')}>Overview</button>
      <button onClick={() => onTabChange('roles')}>Roles</button>
      <button onClick={() => onTabChange('danger')}>Danger</button>
    </div>
  ),
}));

vi.mock('./overview-tab', () => ({ OverviewTab: () => <div data-testid="overview-tab">Overview</div> }));
vi.mock('./members-tab', () => ({ MembersTab: () => <div data-testid="members-tab">Members</div> }));
vi.mock('./invites-tab', () => ({ InvitesTab: () => <div data-testid="invites-tab">Invites</div> }));
vi.mock('./channels-tab', () => ({ ChannelsTab: () => <div data-testid="channels-tab">Channels</div> }));
vi.mock('./notifications-tab', () => ({ NotificationsTab: () => <div data-testid="notifications-tab">Notifications</div> }));
vi.mock('./audit-log-tab', () => ({ AuditLogTab: () => <div data-testid="audit-log-tab">AuditLog</div> }));
vi.mock('./emoji-tab', () => ({ EmojiTab: () => <div data-testid="emoji-tab">Emoji</div> }));
vi.mock('./danger-tab', () => ({ DangerTab: () => <div data-testid="danger-tab">Danger</div> }));
vi.mock('./confirm-modal', () => ({ ConfirmModal: () => null }));
vi.mock('./save-bar', () => ({
  SaveBar: ({ hasChanges }: { hasChanges: boolean }) => (
    <div data-testid="save-bar">{hasChanges ? 'Unsaved' : 'Saved'}</div>
  ),
}));

import { GroupSettings } from '../group-settings/group-settings';

// ── Tests ──────────────────────────────────────────────────────────────
describe('GroupSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGroupSettings.activeGroup = { id: 'g-1', name: 'Test Group', description: 'desc', iconUrl: null, bannerUrl: null, roles: [], channels: [] };
    mockUseGroupSettings.activeTab = 'overview';
  });

  it('renders settings sidebar', () => {
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('settings-sidebar')).toBeInTheDocument();
  });

  it('renders overview tab by default', () => {
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
  });

  it('shows "Group not found" when activeGroup is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseGroupSettings.activeGroup = null as any;
    render(<GroupSettings groupId="g-999" onClose={vi.fn()} />);
    expect(screen.getByText('Group not found')).toBeInTheDocument();
  });

  it('renders save bar', () => {
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('save-bar')).toBeInTheDocument();
  });

  it('save bar shows "Saved" when no changes', () => {
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('renders roles tab when activeTab is roles', () => {
    mockUseGroupSettings.activeTab = 'roles';
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('role-manager')).toBeInTheDocument();
  });

  it('renders danger tab when activeTab is danger', () => {
    mockUseGroupSettings.activeTab = 'danger';
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('danger-tab')).toBeInTheDocument();
  });

  it('renders members tab when activeTab is members', () => {
    mockUseGroupSettings.activeTab = 'members';
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('members-tab')).toBeInTheDocument();
  });
});
