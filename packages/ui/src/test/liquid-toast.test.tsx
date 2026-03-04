import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LiquidToastContainer,
  toast,
  dismissToast,
  clearAllToasts,
  useToast,
} from '../components/liquid-toast';

/* Small helper component that exposes store state for testing */
function ToastSpy({ onUpdate }: { onUpdate: (count: number) => void }) {
  const { toasts } = useToast();
  onUpdate(toasts.length);
  return null;
}

describe('LiquidToast', () => {
  beforeEach(() => {
    clearAllToasts();
  });

  it('renders container with aria-live', () => {
    const { container } = render(<LiquidToastContainer />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('shows a toast when toast() is called', () => {
    render(<LiquidToastContainer />);
    act(() => {
      toast({ title: 'Hello', duration: 0 });
    });
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('shows toast description', () => {
    render(<LiquidToastContainer />);
    act(() => {
      toast({ title: 'Title', description: 'Body text', duration: 0 });
    });
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('dismissToast removes from store', () => {
    const spy = vi.fn();
    render(<ToastSpy onUpdate={spy} />);
    let id: string;
    act(() => {
      id = toast({ title: 'Dismiss me', duration: 0 });
    });
    // After adding, spy should have been called with count=1
    expect(spy).toHaveBeenLastCalledWith(1);
    act(() => {
      dismissToast(id!);
    });
    expect(spy).toHaveBeenLastCalledWith(0);
  });

  it('clearAllToasts removes all from store', () => {
    const spy = vi.fn();
    render(<ToastSpy onUpdate={spy} />);
    act(() => {
      toast({ title: 'A', duration: 0 });
      toast({ title: 'B', duration: 0 });
    });
    expect(spy).toHaveBeenLastCalledWith(2);
    act(() => {
      clearAllToasts();
    });
    expect(spy).toHaveBeenLastCalledWith(0);
  });

  it('auto-dismisses after default duration', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    render(<ToastSpy onUpdate={spy} />);
    act(() => {
      toast({ title: 'Auto' });
    });
    expect(spy).toHaveBeenLastCalledWith(1);
    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(spy).toHaveBeenLastCalledWith(0);
    vi.useRealTimers();
  });

  it('does not auto-dismiss when duration is 0', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    render(<ToastSpy onUpdate={spy} />);
    act(() => {
      toast({ title: 'Sticky', duration: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(spy).toHaveBeenLastCalledWith(1);
    vi.useRealTimers();
  });

  it('toast items have role="alert"', () => {
    render(<LiquidToastContainer />);
    act(() => {
      toast({ title: 'Alert toast', duration: 0 });
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders dismiss button on each toast', () => {
    render(<LiquidToastContainer />);
    act(() => {
      toast({ title: 'With dismiss', duration: 0 });
    });
    expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
  });

  it('dismiss button calls dismissToast on click', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(
      <>
        <LiquidToastContainer />
        <ToastSpy onUpdate={spy} />
      </>
    );
    act(() => {
      toast({ title: 'Click dismiss', duration: 0 });
    });
    expect(spy).toHaveBeenLastCalledWith(1);
    await user.click(screen.getByLabelText('Dismiss notification'));
    expect(spy).toHaveBeenLastCalledWith(0);
  });

  it('applies position class bottom-right by default', () => {
    const { container } = render(<LiquidToastContainer />);
    expect(container.firstElementChild?.className).toContain('bottom-4');
    expect(container.firstElementChild?.className).toContain('right-4');
  });

  it('applies position class top-left', () => {
    const { container } = render(<LiquidToastContainer position="top-left" />);
    expect(container.firstElementChild?.className).toContain('top-4');
    expect(container.firstElementChild?.className).toContain('left-4');
  });

  it('returns toast id from toast()', () => {
    let id: string;
    act(() => {
      id = toast({ title: 'ID test' });
    });
    expect(id!).toMatch(/^liquid-toast-/);
  });
});
