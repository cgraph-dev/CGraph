/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversationHeader } from '../conversation-header';

// Mock dependencies

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="avatar">{alt}</div>,
}));

vi.mock('@/modules/social/components/user-profile-card', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn() },
}));

vi.mock('@/lib/utils', () => ({
  getAvatarBorderId: vi.fn(() => 'default'),
}));

const defaultProps = {
  conversationName: 'Test Chat',
  otherParticipant: {
    id: 'participant-1',
    userId: 'user-1',
    user: {
      id: 'user-1',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      status: 'online',
    },
    nickname: null,
    isMuted: false,
    mutedUntil: null,
    joinedAt: new Date().toISOString(),
  },
  isOtherUserOnline: true,
  typing: [] as string[],
  uiPreferences: {
    glassEffect: 'default' as const,
    enableGlow: false,
    enableHaptic: false,
  },
  onStartVoiceCall: vi.fn(),
  onStartVideoCall: vi.fn(),
  onToggleSearch: vi.fn(),
  onToggleScheduledList: vi.fn(),
  onToggleInfoPanel: vi.fn(),
  onToggleSettings: vi.fn(),
  onToggleE2EETester: vi.fn(),
  onVerifyIdentity: vi.fn(),
  showScheduledList: false,
  showInfoPanel: false,
  showSettings: false,
  formatLastSeen: (_lastSeenAt: string | null | undefined) => 'recently',
};

describe('ConversationHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders conversation name', () => {
    render(<ConversationHeader {...defaultProps} />);
    expect(screen.getAllByText('Test Chat').length).toBeGreaterThan(0);
  });

  it('renders with all required props', () => {
    render(<ConversationHeader {...defaultProps} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with different conversation name', () => {
    render(<ConversationHeader {...defaultProps} conversationName="Group Chat" />);
    expect(screen.getAllByText('Group Chat').length).toBeGreaterThan(0);
  });
});
