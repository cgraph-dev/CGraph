/**
 * ErrorBoundary Component Tests
 *
 * Verifies error catching, fallback UI, and recovery behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// Suppress console.error from ErrorBoundary's componentDidCatch
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// A component that throws on render
function ThrowingChild({ error }: { error?: Error }) {
  if (error) throw error;
  return <div>Child rendered</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild error={new Error('Test error')} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });

  it('renders the "Back to Home" button in fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild error={new Error('crash')} />
      </ErrorBoundary>
    );
    const btn = screen.getByRole('button', { name: /back to home/i });
    expect(btn).toBeInTheDocument();
  });

  it('renders the "Oops" heading in fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild error={new Error('crash')} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowingChild error={new Error('boom')} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('logs the error via console.error', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild error={new Error('logged error')} />
      </ErrorBoundary>
    );
    expect(console.error).toHaveBeenCalled();
  });
});
