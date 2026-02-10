/**
 * Tests for useAdaptiveInterval hook.
 *
 * Verifies that polling intervals correctly adapt to document visibility,
 * critical for reducing server load at 10M+ scale.
 *
 * @module hooks/__tests__/useAdaptiveInterval.test
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAdaptiveInterval } from '../useAdaptiveInterval';

describe('useAdaptiveInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Default: document is visible
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls the callback at the specified interval', () => {
    const callback = vi.fn();
    renderHook(() => useAdaptiveInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('does not start the interval when disabled', () => {
    const callback = vi.fn();
    renderHook(() =>
      useAdaptiveInterval(callback, 1000, { enabled: false })
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it('fires immediately when immediate option is true', () => {
    const callback = vi.fn();
    renderHook(() =>
      useAdaptiveInterval(callback, 1000, { immediate: true })
    );

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('uses the default 4x multiplier when tab is hidden', () => {
    const callback = vi.fn();
    renderHook(() => useAdaptiveInterval(callback, 1000));

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should NOT fire at 1s (active interval)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).not.toHaveBeenCalled();

    // Should NOT fire at 3s either
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(callback).not.toHaveBeenCalled();

    // Should fire at 4s (4x multiplier)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('respects custom hiddenMultiplier', () => {
    const callback = vi.fn();
    renderHook(() =>
      useAdaptiveInterval(callback, 1000, { hiddenMultiplier: 2 })
    );

    // Simulate tab becoming hidden with 2x multiplier
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should fire at 2s (2x multiplier)
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('speeds back up when tab becomes visible again', () => {
    const callback = vi.fn();
    renderHook(() => useAdaptiveInterval(callback, 1000));

    // Go hidden
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Come back visible
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should fire at normal rate (1s)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Verify it's actually at 1s and not 4s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('cleans up interval and event listener on unmount', () => {
    const callback = vi.fn();
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useAdaptiveInterval(callback, 1000)
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // No calls after unmount
    expect(callback).not.toHaveBeenCalled();
    // Event listener removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
  });

  it('uses the latest callback via ref', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useAdaptiveInterval(cb, 1000),
      { initialProps: { cb: callback1 } }
    );

    rerender({ cb: callback2 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should call latest callback
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('handles async callbacks without errors', () => {
    const asyncCallback = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAdaptiveInterval(asyncCallback, 1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(asyncCallback).toHaveBeenCalledTimes(1);
  });

  it('restarts interval when enabled changes from false to true', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ enabled }) =>
        useAdaptiveInterval(callback, 1000, { enabled }),
      { initialProps: { enabled: false } }
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(callback).not.toHaveBeenCalled();

    rerender({ enabled: true });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
