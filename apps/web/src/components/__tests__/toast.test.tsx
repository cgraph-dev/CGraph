import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ToastProvider, useToast } from '../feedback/toast';

// ── Helper: consumer component ─────────────────────────────────────────

function ToastConsumer() {
  const { showToast, toasts, hideToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('success', 'Saved!')}>Show Success</button>
      <button onClick={() => showToast('error', 'Failed!')}>Show Error</button>
      <button onClick={() => showToast('warning', 'Careful!')}>Show Warning</button>
      <button onClick={() => showToast('info', 'FYI')}>Show Info</button>
      <button onClick={() => showToast('success', 'No auto', 0)}>No Auto</button>
      {toasts.length > 0 && <button onClick={() => hideToast(toasts[0]!.id)}>Hide First</button>}
      <span data-testid="count">{toasts.length}</span>
    </div>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('Toast system', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── ToastProvider rendering ────────────────────────────────────────

  it('renders children inside the provider', () => {
    render(
      <ToastProvider>
        <p>Hello</p>
      </ToastProvider>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders no toasts initially', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  // ── showToast ──────────────────────────────────────────────────────

  it('shows a success toast', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();
    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('shows an error toast', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByText('Failed!')).toBeInTheDocument();
  });

  it('shows a warning toast', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Warning'));
    expect(screen.getByText('Careful!')).toBeInTheDocument();
  });

  it('shows an info toast', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Info'));
    expect(screen.getByText('FYI')).toBeInTheDocument();
  });

  it('can show multiple toasts', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByTestId('count').textContent).toBe('2');
  });

  // ── Toast role ─────────────────────────────────────────────────────

  it('renders toast items with role="alert"', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // ── hideToast / dismiss ────────────────────────────────────────────

  it('hides a toast when hideToast is called', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide First'));
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('dismisses a toast when the dismiss button is clicked', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));
    const dismissBtn = screen.getByLabelText('Dismiss');
    fireEvent.click(dismissBtn);
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  // ── Auto-dismiss ──────────────────────────────────────────────────

  it('auto-dismisses after the default duration (5000ms)', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  it('does not auto-dismiss before the duration elapses', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));

    act(() => {
      vi.advanceTimersByTime(4999);
    });

    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('does not auto-dismiss when duration is 0', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('No Auto'));

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  // ── Toast type styling ─────────────────────────────────────────────

  it('applies success color classes', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('green');
  });

  it('applies error color classes', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Error'));
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('red');
  });

  it('applies warning color classes', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Warning'));
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('yellow');
  });

  it('applies info color classes', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Info'));
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('blue');
  });

  // ── useToast outside provider ──────────────────────────────────────

  it('throws when useToast is used outside ToastProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ToastConsumer />)).toThrow('useToast must be used within a ToastProvider');
    spy.mockRestore();
  });

  // ── Edge: rapid add/remove ─────────────────────────────────────────

  it('handles rapid add and remove correctly', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Hide First'));
    // One removed, one remains
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
    expect(screen.getByText('Failed!')).toBeInTheDocument();
  });
});
