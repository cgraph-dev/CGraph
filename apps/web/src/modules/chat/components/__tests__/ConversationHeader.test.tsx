import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversationHeader } from '../ConversationHeader';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  PhoneIcon: () => <span data-testid="phone-icon" />,
  VideoCameraIcon: () => <span data-testid="video-icon" />,
  InformationCircleIcon: () => <span data-testid="info-icon" />,
  LockClosedIcon: () => <span data-testid="lock-icon" />,
  ShieldCheckIcon: () => <span data-testid="shield-icon" />,
  Cog6ToothIcon: () => <span data-testid="cog-icon" />,
  SparklesIcon: () => <span data-testid="sparkles-icon" />,
  MagnifyingGlassIcon: () => <span data-testid="search-icon" />,
  ClockIcon: () => <span data-testid="clock-icon" />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/theme/ThemedAvatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="avatar">{alt}</div>,
}));

vi.mock('@/modules/social/components/UserProfileCard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
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
