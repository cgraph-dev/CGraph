/**
 * Tests for useWindowSize and useScrolled hooks
 *
 * Validates responsive layout tracking (window resize with rAF debouncing)
 * and scroll-based header shadow effects.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowSize, useScrolled } from '../useWindowSize';

describe('useWindowSize', () => {
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    rafCallbacks = [];

    // Mock requestAnimationFrame to capture callbacks
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Set initial window size
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial window dimensions', () => {
    const { result } = renderHook(() => useWindowSize());

    // After the initial rAF fires
    act(() => {
      rafCallbacks.forEach((cb) => cb(0));
    });

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('updates on window resize', () => {
    const { result } = renderHook(() => useWindowSize());

    // Flush initial rAF
    act(() => {
      rafCallbacks.forEach((cb) => cb(0));
      rafCallbacks = [];
    });

    // Simulate resize
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });
      window.dispatchEvent(new Event('resize'));
    });

    // Flush rAF
    act(() => {
      rafCallbacks.forEach((cb) => cb(0));
    });

    expect(result.current.width).toBe(1440);
    expect(result.current.height).toBe(900);
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    const removedEvents = removeSpy.mock.calls.map((c) => c[0]);
    expect(removedEvents).toContain('resize');
  });

  it('cancels pending rAF on unmount', () => {
    const cancelSpy = vi.mocked(window.cancelAnimationFrame);
    const { unmount } = renderHook(() => useWindowSize());

    // Trigger a resize to schedule a rAF
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });
});

describe('useScrolled', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts as not scrolled when at top', () => {
    const { result } = renderHook(() => useScrolled(100));
    expect(result.current).toBe(false);
  });

  it('becomes true when scrolled past threshold', () => {
    const { result } = renderHook(() => useScrolled(100));

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });

  it('becomes false when scrolled back above threshold', () => {
    const { result } = renderHook(() => useScrolled(100));

    // Scroll down
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(true);

    // Scroll back up
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(false);
  });

  it('uses default threshold of 0', () => {
    const { result } = renderHook(() => useScrolled());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 1, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });

  it('cleans up scroll listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useScrolled(100));

    unmount();

    const removedEvents = removeSpy.mock.calls.map((c) => c[0]);
    expect(removedEvents).toContain('scroll');
  });
});
