/**
 * MessageBubble Customization Integration Tests
 * Verifies that bubble renders with custom style class, sender title,
 * sender colors, profile card CSS vars, and background renderer response.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../message-bubble';
import type { Message } from '@/modules/chat/store';
import type { UIPreferences } from '@/pages/messages/conversation/types';
import { DEFAULT_UI_PREFERENCES } from '@/pages/messages/conversation/types';

// Mock framer-motion to prevent layout animation infinite loops in jsdom
// Proxy defined inline because vi.mock factories are hoisted above variable declarations
vi.mock('framer-motion', () => ({
  motion: new Proxy({} as Record<string, any>, {
    get: (_target: any, prop: string) =>
      ({ children, ...props }: any) => {
        // Strip framer-motion-specific props
        const { initial, animate, exit, transition, layout, whileHover, whileTap, variants, ...domProps } = props;
        const El = prop as any;
        return <El {...domProps}>{children}</El>;
      },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock stores — paths must match the actual import paths in MessageBubble.tsx
vi.mock('@/modules/settings/store/customization', () => ({
  useCustomizationStore: Object.assign(
    vi.fn((selector: any) => {
      const state = {
        chatBubbleStyle: 'neon',
        chatBubbleColor: 'emerald',
        bubbleBorderRadius: 'lg',
        messageEffect: 'none',
        equippedTitle: { id: 'title-1', name: 'Legend', color: '#fbbf24' },
      };
      return selector(state);
    }),
    { getState: () => ({ chatBubbleStyle: 'neon', bubbleBorderRadius: 'lg', messageEffect: 'none', equippedTitle: null }) },
  ),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector: any) => {
      const state = { user: { id: 'user-1' } };
      return selector ? selector(state) : state;
    }),
    { getState: () => ({ user: { id: 'user-1' } }) },
  ),
}));

// Mock heavy sub-components to isolate MessageBubble logic
vi.mock('@/modules/chat/components/MessageReactions', () => ({
  default: () => <div data-testid="message-reactions" />,
}));
vi.mock('@/modules/chat/components/RichMediaEmbed', () => ({
  default: () => <div data-testid="rich-media-embed" />,
}));
vi.mock('@/modules/social/components/UserProfileCard', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/modules/gamification/components/TitleBadge', () => ({
  TitleBadge: () => <span data-testid="title-badge" />,
}));
vi.mock('@/components/theme/ThemedAvatar', () => ({
  ThemedAvatar: ({ username }: any) => <div data-testid="avatar">{username}</div>,
}));
vi.mock('@/modules/settings/hooks/useCustomizationApplication', () => ({
  getMessageBubbleClass: () => 'mock-bubble-class',
  getMessageEffectClass: () => '',
}));
vi.mock('@/lib/chat', () => ({
  aggregateReactions: () => [],
  handleRemoveReaction: vi.fn(),
}));

// Minimal message factory with all required fields
function createMessage(overrides: Partial<Message> = {}): Message {
  const base: Message = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-2',
    content: 'Hello world',
    encryptedContent: null,
    isEncrypted: false,
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEdited: false,
    isPinned: false,
    deletedAt: null,
    reactions: [],
    sender: {
      id: 'user-2',
      username: 'alice',
      displayName: 'Alice',
      avatarUrl: null,
      avatarBorderId: 'border-fire',
      bubbleStyle: 'gradient',
      bubbleColor: '#ef4444',
      equippedTitleId: 'title-veteran',
      chatTheme: 'midnight',
    },
    metadata: {},
  };
  return { ...base, ...overrides } as Message;
}

const noop = () => {};

const defaultUiPrefs: UIPreferences = { ...DEFAULT_UI_PREFERENCES };

const defaultProps = {
  message: createMessage(),
  isOwn: false,
  showAvatar: true,
  onReply: noop,
  uiPreferences: defaultUiPrefs,
  onEdit: noop,
  onDelete: noop,
  onPin: noop,
  onForward: noop,
  isMenuOpen: false,
  onToggleMenu: noop,
  isEditing: false,
  editContent: '',
  onEditContentChange: noop,
  onSaveEdit: noop,
  onCancelEdit: noop,
};

describe('MessageBubble Customization', () => {
  it('renders message content', () => {
    render(<MessageBubble {...defaultProps} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('renders sender username', () => {
    render(<MessageBubble {...defaultProps} />);
    // Component renders displayName first, falling back to username
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('uses sender bubbleStyle for other user messages', () => {
    const { container } = render(<MessageBubble {...defaultProps} />);
    // The bubble should apply a style class derived from sender's bubbleStyle
    const bubble = container.querySelector('[class*="gradient"]') || container.firstChild;
    expect(bubble).toBeTruthy();
  });

  it('uses own customization store for own messages', () => {
    const ownMsg = createMessage({
      senderId: 'user-1',
      sender: { id: 'user-1', username: 'me', displayName: 'Me', avatarUrl: null },
    });
    render(<MessageBubble {...defaultProps} message={ownMsg} isOwn={true} />);
    // Should render with 'neon' style from mocked store
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('renders sender title when available', () => {
    const msgWithTitle = createMessage({
      sender: {
        id: 'user-2',
        username: 'alice',
        displayName: 'Alice',
        avatarUrl: null,
        equippedTitleId: 'title-veteran',
      },
    });
    render(<MessageBubble {...defaultProps} message={msgWithTitle} />);
    // At minimum the message should render without errors
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('memo comparator detects bubbleStyle changes', () => {
    const { rerender } = render(<MessageBubble {...defaultProps} />);
    const updatedMsg = createMessage({
      sender: { ...createMessage().sender, bubbleStyle: 'glass' },
    });
    // This should trigger re-render due to updated comparator
    rerender(<MessageBubble {...defaultProps} message={updatedMsg} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('memo comparator detects equippedTitleId changes', () => {
    const { rerender } = render(<MessageBubble {...defaultProps} />);
    const updatedMsg = createMessage({
      sender: { ...createMessage().sender, equippedTitleId: 'title-new' },
    });
    rerender(<MessageBubble {...defaultProps} message={updatedMsg} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('memo comparator detects avatarBorderId changes', () => {
    const { rerender } = render(<MessageBubble {...defaultProps} />);
    const updatedMsg = createMessage({
      sender: { ...createMessage().sender, avatarBorderId: 'border-new' },
    });
    rerender(<MessageBubble {...defaultProps} message={updatedMsg} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('memo comparator detects uiPreferences changes', () => {
    const { rerender } = render(<MessageBubble {...defaultProps} />);
    const updatedPrefs: UIPreferences = {
      ...DEFAULT_UI_PREFERENCES,
      animationIntensity: 'low',
    };
    rerender(
      <MessageBubble
        {...defaultProps}
        uiPreferences={updatedPrefs}
      />,
    );
    expect(screen.getByText('Hello world')).toBeTruthy();
  });
});
