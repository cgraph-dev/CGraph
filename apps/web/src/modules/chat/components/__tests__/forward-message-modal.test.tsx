/** @module forward-message-modal tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: React.PropsWithChildren) => (
    <div data-testid="glass-card">{children}</div>
  ),
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt?: string }) => <img data-testid="themed-avatar" alt={alt} />,
}));

const mockConversations = [
  {
    id: 'c1',
    name: 'Alice',
    type: 'direct' as const,
    isGroup: false,
    members: [],
    avatarUrl: null,
  },
  {
    id: 'c2',
    name: 'Team Chat',
    type: 'group' as const,
    isGroup: true,
    members: [],
    avatarUrl: null,
  },
];

vi.mock('@/modules/chat/store', () => ({
  useChatStore: (selector: (state: { conversations: typeof mockConversations }) => unknown) =>
    selector({ conversations: mockConversations }),
}));

import { ForwardMessageModal } from '../forward-message-modal';

const baseMessage = {
  id: 'msg-1',
  content: 'Hello world',
  type: 'text' as const,
  senderId: 'user-1',
  createdAt: '2026-02-24T12:00:00Z',
  conversationId: 'conv-1',
};

describe('ForwardMessageModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onForward: vi.fn().mockResolvedValue(undefined),
    message: baseMessage,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(<ForwardMessageModal {...defaultProps} isOpen={false} />);
    expect(container.textContent).toBe('');
  });

  it('renders title when open', () => {
    render(<ForwardMessageModal {...defaultProps} />);
    expect(screen.getByText('Forward Message')).toBeInTheDocument();
  });

  it('shows message preview for text messages', () => {
    render(<ForwardMessageModal {...defaultProps} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders conversation list', () => {
    render(<ForwardMessageModal {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Team Chat')).toBeInTheDocument();
  });

  it('shows Direct message label for DMs', () => {
    render(<ForwardMessageModal {...defaultProps} />);
    expect(screen.getByText('Direct message')).toBeInTheDocument();
  });

  it('shows Group label for group chats', () => {
    render(<ForwardMessageModal {...defaultProps} />);
    expect(screen.getByText('Group')).toBeInTheDocument();
  });

  it('has search input', () => {
    render(<ForwardMessageModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('filters conversations by search query', () => {
    render(<ForwardMessageModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'Alice' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Team Chat')).toBeNull();
  });

  it('calls onClose when Cancel button clicked', () => {
    render(<ForwardMessageModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('disables Forward button when no conversations selected', () => {
    render(<ForwardMessageModal {...defaultProps} />);
    const forwardBtn = screen.getByText(/forward/i, { selector: 'button' });
    expect(forwardBtn).toBeDisabled();
  });
});
