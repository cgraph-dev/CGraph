import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ErrorState, {
  NetworkError,
  NotFoundError,
  PermissionError,
  RateLimitError,
} from '../error-state';

vi.mock('@heroicons/react/24/outline', () => ({
  ExclamationTriangleIcon: (props: any) => <svg data-testid="exclamation-icon" {...props} />,
  ArrowPathIcon: (props: any) => <svg data-testid="arrow-path-icon" {...props} />,
}));

// =============================================================================
// ErrorState component
// =============================================================================

describe('ErrorState', () => {
  // ── Default rendering ────────────────────────────────────────────────

  it('renders default title', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders default message', () => {
    render(<ErrorState />);
    expect(
      screen.getByText('An error occurred while loading content. Please try again.')
    ).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });

  // ── Custom props ─────────────────────────────────────────────────────

  it('renders custom title', () => {
    render(<ErrorState title="Oops" />);
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<ErrorState message="Custom error detail" />);
    expect(screen.getByText('Custom error detail')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<ErrorState icon={<span data-testid="custom-icon">!</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders default icon when no custom icon provided', () => {
    render(<ErrorState />);
    expect(screen.getByTestId('exclamation-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorState className="mt-8" />);
    expect(container.firstElementChild!).toHaveClass('mt-8');
  });

  // ── Retry button ─────────────────────────────────────────────────────

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorState onRetry={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
  });

  it('renders default retry label "Try Again"', () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders custom retry label', () => {
    render(<ErrorState onRetry={() => {}} retryLabel="Reload" />);
    expect(screen.getByText('Reload')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('retry button has accessible aria-label', () => {
    render(<ErrorState onRetry={() => {}} retryLabel="Retry Now" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Retry Now');
  });
});

// =============================================================================
// Predefined error variants
// =============================================================================

describe('NetworkError', () => {
  it('renders network error title', () => {
    render(<NetworkError />);
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('renders network error message', () => {
    render(<NetworkError />);
    expect(
      screen.getByText('Unable to connect to the server. Please check your internet connection.')
    ).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<NetworkError onRetry={onRetry} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry not provided', () => {
    render(<NetworkError />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('NotFoundError', () => {
  it('renders default "Content Not Found" title', () => {
    render(<NotFoundError />);
    expect(screen.getByText('Content Not Found')).toBeInTheDocument();
  });

  it('renders custom type in title', () => {
    render(<NotFoundError type="Thread" />);
    expect(screen.getByText('Thread Not Found')).toBeInTheDocument();
  });

  it('renders lowercase type in message', () => {
    render(<NotFoundError type="Forum" />);
    expect(
      screen.getByText("The forum you're looking for doesn't exist or has been removed.")
    ).toBeInTheDocument();
  });
});

describe('PermissionError', () => {
  it('renders access denied title', () => {
    render(<PermissionError />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders permission message', () => {
    render(<PermissionError />);
    expect(screen.getByText("You don't have permission to view this content.")).toBeInTheDocument();
  });
});

describe('RateLimitError', () => {
  it('renders rate limited title', () => {
    render(<RateLimitError />);
    expect(screen.getByText('Rate Limited')).toBeInTheDocument();
  });

  it('renders retry button with custom label', () => {
    render(<RateLimitError onRetry={() => {}} />);
    expect(screen.getByText('Try Again Later')).toBeInTheDocument();
  });

  it('calls onRetry when clicked', () => {
    const onRetry = vi.fn();
    render(<RateLimitError onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
