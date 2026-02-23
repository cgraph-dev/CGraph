/** @module conversation-list tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      onClick,
      ..._props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string} onClick={onClick as React.MouseEventHandler}>
        {children}
      </div>
    ),
    li: ({ children, ..._props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <li>{children}</li>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/lib/haptics', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

const mockConversations = [
  {
    id: 'conv-1',
    name: 'Alice',
    type: 'direct' as const,
    participants: [
      { id: 'user-1', username: 'alice', avatar: null },
      { id: 'current-user', username: 'me', avatar: null },
    ],
    lastMessage: { content: 'Hello!', timestamp: new Date().toISOString() },
    unreadCount: 2,
    isPinned: false,
    isMuted: false,
    isArchived: false,
  },
  {
    id: 'conv-2',
    name: 'Team Chat',
    type: 'group' as const,
    participants: [
      { id: 'user-1', username: 'alice', avatar: null },
      { id: 'user-2', username: 'bob', avatar: null },
    ],
    lastMessage: { content: 'Meeting at 3pm', timestamp: new Date().toISOString() },
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    isArchived: false,
  },
];

vi.mock('@/modules/chat/store', () => ({
  useChatStore: vi.fn(() => ({
    conversations: mockConversations,
    activeConversationId: null,
    typing: {},
  })),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: 'current-user', username: 'me' } }),
  },
}));

vi.mock('./conversation-list-header', () => ({
  ConversationListHeader: ({
    searchQuery,
    onSearch,
  }: {
    searchQuery: string;
    onSearch: (q: string) => void;
  }) => (
    <div data-testid="conversation-list-header">
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('./conversation-item', () => ({
  ConversationItem: ({
    conversation,
    onClick,
  }: {
    conversation: { id: string; name: string };
    onClick: () => void;
  }) => (
    <div data-testid={`conversation-${conversation.id}`} onClick={onClick}>
      {conversation.name}
    </div>
  ),
}));

vi.mock('./empty-state', () => ({
  EmptyState: () => <div data-testid="empty-state">No conversations</div>,
}));

vi.mock('./new-chat-modal', () => ({
  NewChatModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="new-chat-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('@/components/theme/ThemedAvatar', () => ({
  ThemedAvatar: () => <div data-testid="avatar" />,
}));

import { ConversationList } from './conversation-list';

describe('ConversationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the conversation list header', () => {
    render(
      <MemoryRouter>
        <ConversationList />
      </MemoryRouter>
    );
    expect(screen.getByTestId('conversation-list-header')).toBeInTheDocument();
  });

  it('renders conversation items', () => {
    render(
      <MemoryRouter>
        <ConversationList />
      </MemoryRouter>
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Team Chat')).toBeInTheDocument();
  });

  it('renders pinned conversations section when present', () => {
    render(
      <MemoryRouter>
        <ConversationList />
      </MemoryRouter>
    );
    // Team Chat is pinned, should appear
    expect(screen.getByText('Team Chat')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MemoryRouter>
        <ConversationList className="my-custom" />
      </MemoryRouter>
    );
    expect(container.firstChild).toHaveClass('my-custom');
  });
});
