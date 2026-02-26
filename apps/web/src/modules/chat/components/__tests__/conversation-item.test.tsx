/** @module conversation-item tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  loop: () => ({}),
}));

vi.mock('@/lib/logger', () => ({
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt?: string }) => <img data-testid="themed-avatar" alt={alt} />,
}));

vi.mock('../conversation-list/conversation-menu', () => ({
  ConversationMenu: () => <div data-testid="conversation-menu" />,
}));

vi.mock('../conversation-list/utils', () => ({
  getConversationName: (c: { name?: string }) => c.name || 'Test User',
  getConversationAvatar: () => 'https://example.com/avatar.png',
  getConversationAvatarBorderId: () => 'border-1',
  getConversationOnlineStatus: () => true,
  formatMessageTime: () => '2:30 PM',
}));

import { ConversationItem } from '../conversation-list/conversation-item';

const baseConversation = {
  id: 'conv-1',
  name: 'Alice',
  isGroup: false,
  isPinned: false,
  isMuted: false,
  unreadCount: 0,
  lastMessage: {
    content: 'Hello!',
    createdAt: '2026-02-24T12:00:00Z',
  },
  members: [],
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ConversationItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the conversation name', () => {
    renderWithRouter(
      <ConversationItem
        conversation={baseConversation}
        currentUserId="user-1"
        typingUsers={[]}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders last message content', () => {
    renderWithRouter(
      <ConversationItem
        conversation={baseConversation}
        currentUserId="user-1"
        typingUsers={[]}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('shows typing indicator for single user', () => {
    renderWithRouter(
      <ConversationItem
        conversation={baseConversation}
        currentUserId="user-1"
        typingUsers={['Bob']}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText(/Bob.*typing/i)).toBeInTheDocument();
  });

  it('shows typing indicator for multiple users', () => {
    renderWithRouter(
      <ConversationItem
        conversation={baseConversation}
        currentUserId="user-1"
        typingUsers={['Bob', 'Carol']}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText(/typing/i)).toBeInTheDocument();
  });

  it('renders unread badge when count > 0', () => {
    renderWithRouter(
      <ConversationItem
        conversation={{ ...baseConversation, unreadCount: 5 }}
        currentUserId="user-1"
        typingUsers={[]}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('caps unread count at 99+', () => {
    renderWithRouter(
      <ConversationItem
        conversation={{ ...baseConversation, unreadCount: 150 }}
        currentUserId="user-1"
        typingUsers={[]}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('renders themed avatar', () => {
    renderWithRouter(
      <ConversationItem
        conversation={baseConversation}
        currentUserId="user-1"
        typingUsers={[]}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByTestId('themed-avatar')).toBeInTheDocument();
  });

  it('renders last message time', () => {
    renderWithRouter(
      <ConversationItem
        conversation={baseConversation}
        currentUserId="user-1"
        typingUsers={[]}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
  });
});
