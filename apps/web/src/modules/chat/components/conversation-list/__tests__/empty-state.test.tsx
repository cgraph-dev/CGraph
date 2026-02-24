/**
 * @file Tests for EmptyState component (conversation-list)
 * @module chat/components/conversation-list/empty-state
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      className,
      onClick,
    }: {
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
    }) => (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    ),
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ChatBubbleLeftRightIcon: ({ className }: { className?: string }) => (
    <span data-testid="chat-icon" className={className} />
  ),
}));

import { EmptyState } from '../empty-state';

describe('ConversationList EmptyState', () => {
  it('renders default empty state when no search query', () => {
    render(<EmptyState searchQuery="" onNewChat={vi.fn()} />);
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('renders default description when no search query', () => {
    render(<EmptyState searchQuery="" onNewChat={vi.fn()} />);
    expect(screen.getByText('Start a new conversation to connect with others')).toBeInTheDocument();
  });

  it('renders search empty state when search query is provided', () => {
    render(<EmptyState searchQuery="hello" onNewChat={vi.fn()} />);
    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });

  it('renders search hint when search query is provided', () => {
    render(<EmptyState searchQuery="hello" onNewChat={vi.fn()} />);
    expect(screen.getByText('Try a different search term')).toBeInTheDocument();
  });

  it('shows "Start a Conversation" button when no search query', () => {
    render(<EmptyState searchQuery="" onNewChat={vi.fn()} />);
    expect(screen.getByText('Start a Conversation')).toBeInTheDocument();
  });

  it('does not show "Start a Conversation" button when searching', () => {
    render(<EmptyState searchQuery="hello" onNewChat={vi.fn()} />);
    expect(screen.queryByText('Start a Conversation')).not.toBeInTheDocument();
  });

  it('calls onNewChat when button is clicked', async () => {
    const user = userEvent.setup();
    const onNewChat = vi.fn();
    render(<EmptyState searchQuery="" onNewChat={onNewChat} />);
    await user.click(screen.getByText('Start a Conversation'));
    expect(onNewChat).toHaveBeenCalledOnce();
  });

  it('renders chat icon', () => {
    render(<EmptyState searchQuery="" onNewChat={vi.fn()} />);
    expect(screen.getByTestId('chat-icon')).toBeInTheDocument();
  });

  it('renders centered layout', () => {
    const { container } = render(<EmptyState searchQuery="" onNewChat={vi.fn()} />);
    expect(container.querySelector('.flex.h-full')).toBeInTheDocument();
  });
});
