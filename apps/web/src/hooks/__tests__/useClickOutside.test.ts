/**
 * Tests for useClickOutside and useClickOutsideRef hooks
 *
 * Validates click-outside detection for dropdowns, modals, popovers.
 * Tests mousedown, touchstart, Escape key, enabled/disabled state, and cleanup.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import { useClickOutside, useClickOutsideRef } from '../useClickOutside';

describe('useClickOutside', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls callback on mousedown outside the element', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(callback));

    // Simulate the ref being attached to a DOM element
    const innerEl = document.createElement('div');
    const outerEl = document.createElement('div');
    document.body.appendChild(outerEl);
    outerEl.appendChild(innerEl);

    // Attach ref
    (result.current as { current: HTMLDivElement | null }).current = innerEl;

    // Click outside
    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(callback).toHaveBeenCalledOnce();

    // Cleanup
    document.body.removeChild(outerEl);
  });

  it('does NOT call callback on mousedown inside the element', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(callback));

    const el = document.createElement('div');
    document.body.appendChild(el);
    (result.current as { current: HTMLDivElement | null }).current = el;

    // Click inside
    act(() => {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(el);
  });

  it('calls callback on touchstart outside the element', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(callback));

    const el = document.createElement('div');
    document.body.appendChild(el);
    (result.current as { current: HTMLDivElement | null }).current = el;

    act(() => {
      document.dispatchEvent(new Event('touchstart', { bubbles: true }));
    });

    expect(callback).toHaveBeenCalledOnce();

    document.body.removeChild(el);
  });

  it('calls callback on Escape key press', () => {
    const callback = vi.fn();
    renderHook(() => useClickOutside<HTMLDivElement>(callback));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(callback).toHaveBeenCalledOnce();
  });

  it('does NOT call callback on non-Escape key press', () => {
    const callback = vi.fn();
    renderHook(() => useClickOutside<HTMLDivElement>(callback));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('does NOT listen when enabled is false', () => {
    const callback = vi.fn();
    renderHook(() => useClickOutside<HTMLDivElement>(callback, false));

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('removes event listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const callback = vi.fn();
    const { unmount } = renderHook(() => useClickOutside<HTMLDivElement>(callback));

    unmount();

    const removedEvents = removeSpy.mock.calls.map((c) => c[0]);
    expect(removedEvents).toContain('mousedown');
    expect(removedEvents).toContain('touchstart');
    expect(removedEvents).toContain('keydown');
  });

  it('uses the latest callback ref without re-attaching listeners', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { result, rerender } = renderHook(({ cb }) => useClickOutside<HTMLDivElement>(cb), {
      initialProps: { cb: callback1 },
    });

    // Attach a DOM element to the ref so the inside/outside check works
    const el = document.createElement('div');
    document.body.appendChild(el);
    (result.current as { current: HTMLDivElement | null }).current = el;

    // Update callback
    rerender({ cb: callback2 });

    // Click outside
    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    // callback2 should be called (via ref), not callback1
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledOnce();

    document.body.removeChild(el);
  });
});

describe('useClickOutsideRef', () => {
  it('calls callback when clicking outside the provided ref', () => {
    const callback = vi.fn();
    const el = document.createElement('div');
    document.body.appendChild(el);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useClickOutsideRef(ref, callback);
    });

    // Click outside
    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(callback).toHaveBeenCalledOnce();

    document.body.removeChild(el);
  });

  it('does NOT call callback when clicking inside the provided ref', () => {
    const callback = vi.fn();
    const el = document.createElement('div');
    document.body.appendChild(el);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useClickOutsideRef(ref, callback);
    });

    act(() => {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(el);
  });

  it('does NOT listen when enabled is false', () => {
    const callback = vi.fn();
    const el = document.createElement('div');
    document.body.appendChild(el);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useClickOutsideRef(ref, callback, false);
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(el);
  });
});
