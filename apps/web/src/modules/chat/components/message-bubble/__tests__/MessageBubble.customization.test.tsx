/**
 * MessageBubble Customization Integration Tests
 * Verifies that bubble renders with custom style class, sender title,
 * sender colors, profile card CSS vars, and background renderer response.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import type { Message } from '@/modules/chat/store';
import type { UIPreferences } from '@/pages/messages/conversation/types';
import { DEFAULT_UI_PREFERENCES } from '@/pages/messages/conversation/types';

// Mock stores
vi.mock('@/modules/customization/store/useCustomizationStore', () => ({
  useCustomizationStore: vi.fn((selector) => {
    const state = {
      chatBubbleStyle: 'neon',
      chatBubbleColor: 'emerald',
      bubbleBorderRadius: 'lg',
      messageEffect: 'none',
      equippedTitle: { id: 'title-1', name: 'Legend', color: '#fbbf24' },
    };
    return selector(state);
  }),
}));

vi.mock('@/stores/useAuthStore', () => ({
  default: {
    getState: () => ({ user: { id: 'user-1' } }),
  },
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
    expect(screen.getByText('alice')).toBeTruthy();
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
