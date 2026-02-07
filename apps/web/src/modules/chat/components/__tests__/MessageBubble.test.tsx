import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble, type UIPreferences, type MessageBubbleProps } from '../MessageBubble';
import type { Message } from '@/stores/chatStore';

// Mock dependencies
vi.mock('@/stores/chatStore', () => ({
  useChatStore: {
    getState: () => ({
      addReaction: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: { id: 'current-user-1' },
    }),
  },
}));

vi.mock('@/components/profile/UserProfileCard', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="profile-card">{children}</div>
  ),
}));

vi.mock('@/components/theme/ThemedAvatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="avatar">{alt}</div>,
}));

vi.mock('@/components/audio/AdvancedVoiceVisualizer', () => ({
  default: () => <div data-testid="voice-visualizer">Voice Visualizer</div>,
}));

vi.mock('@/components/chat/MessageReactions', () => ({
  default: () => <div data-testid="reactions">Reactions</div>,
}));

vi.mock('@/components/chat/RichMediaEmbed', () => ({
  default: () => <div data-testid="rich-embed">Rich Embed</div>,
}));

vi.mock('@/components/chat/GifMessage', () => ({
  GifMessage: () => <div data-testid="gif-message">GIF</div>,
}));

vi.mock('@/components/chat/FileMessage', () => ({
  FileMessage: () => <div data-testid="file-message">File</div>,
}));

vi.mock('@/components/VoiceMessagePlayer', () => ({
  VoiceMessagePlayer: () => <div data-testid="voice-player">Voice Player</div>,
}));

const defaultUIPreferences: UIPreferences = {
  glassEffect: 'frosted',
  animationIntensity: 'medium',
  showParticles: false,
  enableGlow: false,
  enable3D: false,
  enableHaptic: false,
  voiceVisualizerTheme: 'matrix-green',
  messageEntranceAnimation: 'fade',
};

const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  content: 'Test message content',
  senderId: 'user-1',
  conversationId: 'conv-1',
  createdAt: '2026-01-01T12:00:00Z',
  updatedAt: '2026-01-01T12:00:00Z',
  encryptedContent: null,
  isEncrypted: false,
  replyToId: null,
  replyTo: null,
  isPinned: false,
  isEdited: false,
  deletedAt: null,
  metadata: {},
  reactions: [],
  messageType: 'text',
  sender: {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
  },
  ...overrides,
});

const defaultProps: Omit<MessageBubbleProps, 'message'> = {
  isOwn: false,
  showAvatar: true,
  onReply: vi.fn(),
  uiPreferences: defaultUIPreferences,
};

describe('MessageBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders text message content', () => {
      const message = createMockMessage({ content: 'Hello, world!' });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    it('renders avatar for non-own messages when showAvatar is true', () => {
      const message = createMockMessage();
      render(<MessageBubble {...defaultProps} message={message} isOwn={false} showAvatar={true} />);

      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('does not render avatar for own messages', () => {
      const message = createMockMessage();
      render(<MessageBubble {...defaultProps} message={message} isOwn={true} showAvatar={true} />);

      expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
    });

    it.skip('renders message reactions', () => {
      const message = createMockMessage();
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByTestId('reactions')).toBeInTheDocument();
    });
  });

  describe('message types', () => {
    it.skip('renders GIF message', () => {
      const message = createMockMessage({ messageType: 'gif' });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByTestId('gif-message')).toBeInTheDocument();
    });

    it.skip('renders file message', () => {
      const message = createMockMessage({
        messageType: 'file',
        metadata: { fileUrl: 'http://example.com/file.pdf' },
      });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByTestId('file-message')).toBeInTheDocument();
    });

    it('renders voice message with visualizer', () => {
      const message = createMockMessage({
        messageType: 'voice',
        metadata: { url: 'http://example.com/audio.mp3' },
      });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByTestId('voice-visualizer')).toBeInTheDocument();
      expect(screen.getByTestId('voice-player')).toBeInTheDocument();
    });
  });

  describe('reply preview', () => {
    it('renders reply preview when message has replyTo', () => {
      const message = createMockMessage({
        replyTo: {
          ...createMockMessage({ id: 'reply-msg', content: 'Original message' }),
          sender: { id: 'user-2', username: 'replyuser', displayName: null, avatarUrl: null },
        },
      });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByText('replyuser')).toBeInTheDocument();
      expect(screen.getByText('Original message')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders edit form when isEditing is true', () => {
      const message = createMockMessage({ content: 'Editable message' });
      render(
        <MessageBubble
          {...defaultProps}
          message={message}
          isEditing={true}
          editContent="Edited content"
          onEditContentChange={vi.fn()}
          onSaveEdit={vi.fn()}
          onCancelEdit={vi.fn()}
        />
      );

      expect(screen.getByRole('textbox')).toHaveValue('Edited content');
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onSaveEdit when Save button clicked', () => {
      const onSaveEdit = vi.fn();
      const message = createMockMessage();
      render(
        <MessageBubble
          {...defaultProps}
          message={message}
          isEditing={true}
          editContent="Edited"
          onSaveEdit={onSaveEdit}
          onCancelEdit={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Save'));
      expect(onSaveEdit).toHaveBeenCalled();
    });
  });

  describe('timestamp', () => {
    it('renders formatted timestamp', () => {
      const message = createMockMessage({
        createdAt: '2026-01-01T14:30:00Z',
      });
      render(<MessageBubble {...defaultProps} message={message} />);

      // Should show time in h:mm a format
      expect(screen.getByText(/\d{1,2}:\d{2}\s*(AM|PM)/i)).toBeInTheDocument();
    });

    it('shows edited indicator for edited messages', () => {
      const message = createMockMessage({ isEdited: true });
      render(<MessageBubble {...defaultProps} message={message} />);

      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies correct styles for own messages', () => {
      const message = createMockMessage();
      const { container } = render(
        <MessageBubble {...defaultProps} message={message} isOwn={true} />
      );

      const bubble = container.querySelector('.bg-primary-600');
      expect(bubble).toBeInTheDocument();
    });

    it('applies correct styles for other messages', () => {
      const message = createMockMessage();
      const { container } = render(
        <MessageBubble {...defaultProps} message={message} isOwn={false} />
      );

      const bubble = container.querySelector('.bg-dark-700');
      expect(bubble).toBeInTheDocument();
    });
  });
});
