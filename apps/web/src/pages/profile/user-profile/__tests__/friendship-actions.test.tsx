/** @module friendship-actions tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FriendshipActions } from '../friendship-actions';

vi.mock('@heroicons/react/24/outline', () => ({
  UserPlusIcon: () => <span data-testid="user-plus" />,
  UserMinusIcon: () => <span data-testid="user-minus" />,
  ChatBubbleLeftIcon: () => <span data-testid="chat-bubble" />,
  EllipsisHorizontalIcon: () => <span data-testid="ellipsis" />,
}));

vi.mock('@/components', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    isLoading,
    leftIcon,
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button
      onClick={onClick as React.MouseEventHandler}
      disabled={(disabled || isLoading) as boolean}
      data-variant={variant as string}
    >
      {leftIcon as React.ReactNode}
      {children}
      {!!isLoading && <span data-testid="loading" />}
    </button>
  ),
}));

vi.mock('@/components/navigation/dropdown', () => ({
  default: ({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) => (
    <div data-testid="dropdown">
      {trigger}
      <div data-testid="dropdown-items">{children}</div>
    </div>
  ),
  DropdownItem: ({
    children,
    onClick,
    danger,
  }: React.PropsWithChildren<{ onClick: () => void; danger?: boolean }>) => (
    <button onClick={onClick} data-danger={danger}>
      {children}
    </button>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { medium: vi.fn(), success: vi.fn() },
}));

import { HapticFeedback } from '@/lib/animations/animation-engine';
const mockHaptic = vi.mocked(HapticFeedback);

const baseProps = {
  isActioning: false,
  onSendRequest: vi.fn(),
  onAcceptRequest: vi.fn(),
  onRemoveFriend: vi.fn(),
  onMessage: vi.fn(),
};

describe('FriendshipActions', () => {
  it('renders Message button when friends', () => {
    render(<FriendshipActions {...baseProps} friendshipStatus="friends" />);
    expect(screen.getByText('Message')).toBeTruthy();
  });

  it('renders Remove Friend in dropdown when friends', () => {
    render(<FriendshipActions {...baseProps} friendshipStatus="friends" />);
    expect(screen.getByText('Remove Friend')).toBeTruthy();
  });

  it('calls onMessage and haptic on Message click', () => {
    render(<FriendshipActions {...baseProps} friendshipStatus="friends" />);
    fireEvent.click(screen.getByText('Message'));
    expect(baseProps.onMessage).toHaveBeenCalled();
    expect(mockHaptic.medium).toHaveBeenCalled();
  });

  it('renders Add Friend button when status is none', () => {
    render(<FriendshipActions {...baseProps} friendshipStatus="none" />);
    expect(screen.getByText('Add Friend')).toBeTruthy();
  });

  it('calls onSendRequest on Add Friend click', () => {
    render(<FriendshipActions {...baseProps} friendshipStatus="none" />);
    fireEvent.click(screen.getByText('Add Friend'));
    expect(baseProps.onSendRequest).toHaveBeenCalled();
    expect(mockHaptic.success).toHaveBeenCalled();
  });

  it('renders disabled "Request Sent" when pending_sent', () => {
    render(<FriendshipActions {...baseProps} friendshipStatus="pending_sent" />);
    const btn = screen.getByText('Request Sent');
    expect(btn.closest('button')?.hasAttribute('disabled')).toBe(true);
  });

  it('renders Accept Request when pending_received', () => {
    render(<FriendshipActions {...baseProps} friendshipStatus="pending_received" />);
    expect(screen.getByText('Accept Request')).toBeTruthy();
  });

  it('calls onAcceptRequest on Accept click', () => {
    render(<FriendshipActions {...baseProps} friendshipStatus="pending_received" />);
    fireEvent.click(screen.getByText('Accept Request'));
    expect(baseProps.onAcceptRequest).toHaveBeenCalled();
  });

  it('returns null for unknown status', () => {
    const { container } = render(
      <FriendshipActions {...baseProps} friendshipStatus={'blocked' as 'none'} />
    );
    expect(container.firstChild).toBeNull();
  });
});
