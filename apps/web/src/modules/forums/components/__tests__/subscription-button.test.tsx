/** @module subscription-button tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/shared/components/ui', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
    ...rest
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button
      onClick={onClick as React.MouseEventHandler}
      disabled={disabled as boolean}
      className={className as string}
      {...rest}
    >
      {children}
    </button>
  ),
  Popover: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  PopoverContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  PopoverTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Select: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: () => null,
  Switch: () => <input type="checkbox" data-testid="switch" />,
  Label: ({ children }: React.PropsWithChildren) => <label>{children}</label>,
  Separator: () => <hr />,
}));

vi.mock('lucide-react', () => ({
  Bell: (props: Record<string, unknown>) => <svg data-testid="bell-icon" {...props} />,
  BellOff: (props: Record<string, unknown>) => <svg data-testid="bell-off-icon" {...props} />,
  Loader2: (props: Record<string, unknown>) => <svg data-testid="loader" {...props} />,
}));

import { SubscriptionButton } from '../subscription-button';

describe('SubscriptionButton', () => {
  const defaultProps = {
    type: 'thread' as const,
    targetId: 'thread-1',
    isSubscribed: false,
    onSubscribe: vi.fn().mockResolvedValue(undefined),
    onUnsubscribe: vi.fn().mockResolvedValue(undefined),
    onUpdateSettings: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders "Watch Thread" when not subscribed', () => {
    render(<SubscriptionButton {...defaultProps} />);
    expect(screen.getByText('Watch Thread')).toBeInTheDocument();
  });

  it('renders "Watching" when subscribed to thread', () => {
    render(<SubscriptionButton {...defaultProps} isSubscribed />);
    expect(screen.getByText('Watching')).toBeInTheDocument();
  });

  it('renders "Watch Forum" for forum type', () => {
    render(<SubscriptionButton {...defaultProps} type="forum" />);
    expect(screen.getByText('Watch Forum')).toBeInTheDocument();
  });

  it('renders "Watch Board" for board type', () => {
    render(<SubscriptionButton {...defaultProps} type="board" />);
    expect(screen.getByText('Watch Board')).toBeInTheDocument();
  });

  it('renders "Watching Forum" when subscribed to forum', () => {
    render(<SubscriptionButton {...defaultProps} type="forum" isSubscribed />);
    expect(screen.getByText('Watching Forum')).toBeInTheDocument();
  });

  it('shows bell-off icon when not subscribed', () => {
    render(<SubscriptionButton {...defaultProps} />);
    expect(screen.getByTestId('bell-off-icon')).toBeInTheDocument();
  });

  it('shows bell icon when subscribed', () => {
    render(<SubscriptionButton {...defaultProps} isSubscribed />);
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('calls onSubscribe when clicking subscribe', async () => {
    render(<SubscriptionButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Watch Thread'));
    await waitFor(() => {
      expect(defaultProps.onSubscribe).toHaveBeenCalledOnce();
    });
  });

  it('calls onUnsubscribe when clicking unsubscribe', async () => {
    render(<SubscriptionButton {...defaultProps} isSubscribed />);
    fireEvent.click(screen.getByText('Watching'));
    await waitFor(() => {
      expect(defaultProps.onUnsubscribe).toHaveBeenCalledOnce();
    });
  });

  it('applies custom className', () => {
    const { container } = render(<SubscriptionButton {...defaultProps} className="my-custom" />);
    expect(container.firstChild).toHaveClass('my-custom');
  });
});
