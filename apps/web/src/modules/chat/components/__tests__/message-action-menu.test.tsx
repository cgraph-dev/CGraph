/** @module message-action-menu tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  EllipsisVerticalIcon: () => <span data-testid="ellipsis-icon" />,
}));

vi.mock('../message-bubble/icons', () => ({
  ReplyIcon: () => <span data-testid="reply-icon" />,
  EditIcon: () => <span data-testid="edit-icon" />,
  PinIcon: () => <span data-testid="pin-icon" />,
  ForwardIcon: () => <span data-testid="forward-icon" />,
  DeleteIcon: () => <span data-testid="delete-icon" />,
}));

import { MessageActionMenu } from '../message-bubble/message-action-menu';

describe('MessageActionMenu', () => {
  const defaultProps = {
    onReply: vi.fn(),
    onEdit: vi.fn(),
    onPin: vi.fn(),
    onForward: vi.fn(),
    onDelete: vi.fn(),
    isMenuOpen: false,
    onToggleMenu: vi.fn(),
    isOwn: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reply button', () => {
    render(<MessageActionMenu {...defaultProps} />);
    expect(screen.getByTestId('reply-icon')).toBeInTheDocument();
  });

  it('renders ellipsis more button', () => {
    render(<MessageActionMenu {...defaultProps} />);
    expect(screen.getByTestId('ellipsis-icon')).toBeInTheDocument();
  });

  it('calls onReply when reply button clicked', () => {
    render(<MessageActionMenu {...defaultProps} />);
    const replyBtn = screen.getByTestId('reply-icon').closest('button');
    if (replyBtn) fireEvent.click(replyBtn);
    expect(defaultProps.onReply).toHaveBeenCalled();
  });

  it('calls onToggleMenu when more button clicked', () => {
    render(<MessageActionMenu {...defaultProps} />);
    const moreBtn = screen.getByTestId('ellipsis-icon').closest('button');
    if (moreBtn) fireEvent.click(moreBtn);
    expect(defaultProps.onToggleMenu).toHaveBeenCalled();
  });

  it('shows dropdown actions when menu is open', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen={true} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Pin')).toBeInTheDocument();
    expect(screen.getByText('Forward')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('hides dropdown when menu is closed', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen={false} />);
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('calls onEdit when Edit clicked', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen={true} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(defaultProps.onEdit).toHaveBeenCalled();
  });

  it('calls onDelete when Delete clicked', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen={true} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(defaultProps.onDelete).toHaveBeenCalled();
  });

  it('calls onForward when Forward clicked', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen={true} />);
    fireEvent.click(screen.getByText('Forward'));
    expect(defaultProps.onForward).toHaveBeenCalled();
  });
});
