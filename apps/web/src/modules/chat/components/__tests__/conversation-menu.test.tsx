/** @module conversation-menu tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string} onClick={onClick as React.MouseEventHandler}>
        {children}
      </div>
    ),
    button: ({
      children,
      onClick,
      className,
    }: React.PropsWithChildren<{ onClick?: () => void; className?: string }>) => (
      <button onClick={onClick} className={className}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  EllipsisHorizontalIcon: () => <span data-testid="ellipsis-icon" />,
  ArchiveBoxIcon: () => <span data-testid="archive-icon" />,
  BellSlashIcon: () => <span data-testid="mute-icon" />,
  BookmarkIcon: () => <span data-testid="pin-icon" />,
}));

import { ConversationMenu } from '../conversation-list/conversation-menu';

describe('ConversationMenu', () => {
  const defaultProps = {
    conversation: {
      id: 'conv-1',
      isPinned: false,
      isMuted: false,
    },
    onAction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the ellipsis trigger button', () => {
    render(<ConversationMenu {...defaultProps} />);
    expect(screen.getByTestId('ellipsis-icon')).toBeInTheDocument();
  });

  it('shows Pin option when not pinned', () => {
    render(<ConversationMenu {...defaultProps} />);
    const trigger = screen.getByTestId('ellipsis-icon').closest('button');
    if (trigger) fireEvent.click(trigger);
    expect(screen.getByText('Pin')).toBeInTheDocument();
  });

  it('shows Unpin option when pinned', () => {
    render(
      <ConversationMenu
        {...defaultProps}
        conversation={{ ...defaultProps.conversation, isPinned: true }}
      />,
    );
    const trigger = screen.getByTestId('ellipsis-icon').closest('button');
    if (trigger) fireEvent.click(trigger);
    expect(screen.getByText('Unpin')).toBeInTheDocument();
  });

  it('shows Mute option when not muted', () => {
    render(<ConversationMenu {...defaultProps} />);
    const trigger = screen.getByTestId('ellipsis-icon').closest('button');
    if (trigger) fireEvent.click(trigger);
    expect(screen.getByText('Mute')).toBeInTheDocument();
  });

  it('shows Unmute option when muted', () => {
    render(
      <ConversationMenu
        {...defaultProps}
        conversation={{ ...defaultProps.conversation, isMuted: true }}
      />,
    );
    const trigger = screen.getByTestId('ellipsis-icon').closest('button');
    if (trigger) fireEvent.click(trigger);
    expect(screen.getByText('Unmute')).toBeInTheDocument();
  });

  it('shows Archive option', () => {
    render(<ConversationMenu {...defaultProps} />);
    const trigger = screen.getByTestId('ellipsis-icon').closest('button');
    if (trigger) fireEvent.click(trigger);
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('calls onAction with correct action type', () => {
    render(<ConversationMenu {...defaultProps} />);
    const trigger = screen.getByTestId('ellipsis-icon').closest('button');
    if (trigger) fireEvent.click(trigger);
    fireEvent.click(screen.getByText('Archive'));
    expect(defaultProps.onAction).toHaveBeenCalledWith('archive');
  });
});
