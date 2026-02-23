/** @module auth-button tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      onClick,
      disabled,
      className,
      type,
      ..._props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button
        onClick={onClick as React.MouseEventHandler}
        disabled={disabled as boolean}
        className={className as string}
        type={(type as 'button' | 'submit') || 'button'}
      >
        {children}
      </button>
    ),
    div: ({ children, ..._props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div>{children}</div>
    ),
    span: ({ children, ..._props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { medium: vi.fn() },
}));

import { HapticFeedback } from '@/lib/animations/animation-engine';
import { AuthButton } from '../auth-button';

describe('AuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with children text', () => {
    render(
      <AuthButton variant="primary" size="md">
        Sign In
      </AuthButton>
    );
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(
      <AuthButton variant="primary" size="md">
        Submit
      </AuthButton>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <AuthButton variant="primary" size="md" isLoading loadingText="Signing in...">
        Sign In
      </AuthButton>
    );
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  it('shows default loading text', () => {
    render(
      <AuthButton variant="primary" size="md" isLoading>
        Sign In
      </AuthButton>
    );
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('shows success state', () => {
    render(
      <AuthButton variant="primary" size="md" isSuccess>
        Sign In
      </AuthButton>
    );
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <AuthButton variant="primary" size="md" isError>
        Sign In
      </AuthButton>
    );
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(
      <AuthButton variant="primary" size="md" isLoading>
        Sign In
      </AuthButton>
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when in success state', () => {
    render(
      <AuthButton variant="primary" size="md" isSuccess>
        Sign In
      </AuthButton>
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('triggers haptic feedback on click', () => {
    render(
      <AuthButton variant="primary" size="md">
        Click Me
      </AuthButton>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(HapticFeedback.medium).toHaveBeenCalled();
  });

  it('calls onClick handler', () => {
    const onClick = vi.fn();
    render(
      <AuthButton variant="primary" size="md" onClick={onClick}>
        Click Me
      </AuthButton>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <AuthButton variant="primary" size="md" disabled onClick={onClick}>
        Click Me
      </AuthButton>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
