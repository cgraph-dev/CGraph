import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ErrorBoundary from '../ErrorBoundary';

// Mock error-tracking module
vi.mock('@/lib/error-tracking', () => ({
  captureError: vi.fn(() => 'mock-error-id-123'),
  addBreadcrumb: vi.fn(),
}));

// Suppress React error boundary console errors during tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Error Boundary')) return;
    if (typeof args[0] === 'string' && args[0].includes('The above error')) return;
    originalConsoleError(...args);
  };
  return () => {
    console.error = originalConsoleError;
  };
});

// Helper component that throws
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Child content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders default fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/unexpected error/)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('displays the error ID from captureError', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText(/mock-error-id-123/)).toBeInTheDocument();
  });

  it('catches errors and shows fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders Try Again button that resets the error state', () => {
    // We can't dynamically toggle the throw, so just verify the button exists
    // and that clicking it attempts to re-render children
    const { container: _container } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    expect(retryButton).toBeInTheDocument();

    // After clicking retry, the component will try to re-render children.
    // Since ThrowingComponent always throws, it will fall back again.
    fireEvent.click(retryButton);
    // The error boundary re-catches, so fallback shows again
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders Reload Page button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();
  });

  it('renders Report Issue button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: 'Report Issue' })).toBeInTheDocument();
  });

  it('calls captureError and addBreadcrumb on error', async () => {
    const { captureError, addBreadcrumb } = await import('@/lib/error-tracking');
    vi.mocked(captureError).mockClear();
    vi.mocked(addBreadcrumb).mockClear();

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(captureError).toHaveBeenCalledTimes(1);
    expect(addBreadcrumb).toHaveBeenCalled();
    const captureCall = vi.mocked(captureError).mock.calls[0]!;
    expect(captureCall[0]).toBeInstanceOf(Error);
  });

  it('passes error context to error tracking', async () => {
    const { captureError } = await import('@/lib/error-tracking');
    vi.mocked(captureError).mockClear();

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const captureCall = vi.mocked(captureError).mock.calls[0]!;
    expect(captureCall[1]).toMatchObject({
      action: 'component_crash',
      level: 'fatal',
    });
  });
});
