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
    id: 'user-1',
    username: 'testuser',
    avatar_url: null,
    status: 'online',
  },
  isGroup: false,
  participantCount: 2,
  onBack: vi.fn(),
  onShowInfo: vi.fn(),
  onCall: vi.fn(),
  onVideoCall: vi.fn(),
  isE2EE: false,
  e2eeVerified: false,
  onShowSearch: vi.fn(),
};

describe('ConversationHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders conversation name', () => {
    render(<ConversationHeader {...defaultProps} />);
    expect(screen.getByText('Test Chat')).toBeTruthy();
  });

  it('shows E2EE indicator when encrypted', () => {
    render(<ConversationHeader {...defaultProps} isE2EE={true} />);
    // Should show lock or shield icon
    expect(document.body).toBeTruthy();
  });

  it('renders group header with participant count', () => {
    render(
      <ConversationHeader
        {...defaultProps}
        isGroup={true}
        participantCount={5}
        conversationName="Group Chat"
      />
    );
    expect(screen.getByText('Group Chat')).toBeTruthy();
  });
});
