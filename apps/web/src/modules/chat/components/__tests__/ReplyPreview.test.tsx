import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReplyPreview } from '../ReplyPreview';
import type { UIPreferences } from '../MessageBubble';
import type { Message } from '@/modules/chat/store';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      onClick,
      ...props
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      [key: string]: unknown;
    }) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
}));

// Mock GlassCard component
vi.mock('@/components/ui/GlassCard', () => ({
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

// Mock HapticFeedback
vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const defaultUIPreferences: UIPreferences = {
  glassEffect: 'crystal',
  animationIntensity: 'medium',
  showParticles: true,
  enableGlow: true,
  enable3D: true,
  enableHaptic: true,
  voiceVisualizerTheme: 'matrix-green',
  messageEntranceAnimation: 'slide',
};

const mockMessage: Message = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  content: 'This is a test message',
  messageType: 'text',
  encryptedContent: null,
  isEncrypted: false,
  replyToId: null,
  replyTo: null,
  isPinned: false,
  isEdited: false,
  deletedAt: null,
  metadata: {},
  reactions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sender: {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
    avatarBorderId: null,
    theme: 'default',
  },
};

describe('ReplyPreview', () => {
  const onClear = vi.fn();

  beforeEach(() => {
    onClear.mockClear();
  });

  it('displays the message content', () => {
    render(
      <ReplyPreview replyTo={mockMessage} uiPreferences={defaultUIPreferences} onClear={onClear} />
    );

    expect(screen.getByText('This is a test message')).toBeInTheDocument();
  });

  it('displays the sender display name', () => {
    render(
      <ReplyPreview replyTo={mockMessage} uiPreferences={defaultUIPreferences} onClear={onClear} />
    );

    expect(screen.getByText(/Replying to Test User/)).toBeInTheDocument();
  });

  it('falls back to username when displayName is not available', () => {
    const messageWithoutDisplayName: Message = {
      ...mockMessage,
      sender: {
        ...mockMessage.sender,
        displayName: null,
      },
    };

    render(
      <ReplyPreview
        replyTo={messageWithoutDisplayName}
        uiPreferences={defaultUIPreferences}
        onClear={onClear}
      />
    );

    expect(screen.getByText(/Replying to testuser/)).toBeInTheDocument();
  });

  it('calls onClear when close button is clicked', () => {
    render(
      <ReplyPreview replyTo={mockMessage} uiPreferences={defaultUIPreferences} onClear={onClear} />
    );

    // Find and click the close button (it has an SVG with X icon)
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('shows "Unknown" when sender is not available', () => {
    const messageWithoutSender = {
      ...mockMessage,
      sender: {
        id: '',
        username: '',
        displayName: null,
        avatarUrl: null,
      },
    } as Message;

    render(
      <ReplyPreview
        replyTo={messageWithoutSender}
        uiPreferences={defaultUIPreferences}
        onClear={onClear}
      />
    );

    expect(screen.getByText(/Replying to Unknown/)).toBeInTheDocument();
  });

  it('truncates long message content', () => {
    const longMessage: Message = {
      ...mockMessage,
      content:
        'This is a very long message that should be truncated when displayed in the reply preview component because it exceeds the maximum width allowed',
    };

    const { container } = render(
      <ReplyPreview replyTo={longMessage} uiPreferences={defaultUIPreferences} onClear={onClear} />
    );

    // Check that the message text element has truncate class
    const messageText = container.querySelector('.truncate');
    expect(messageText).toBeInTheDocument();
  });
});
