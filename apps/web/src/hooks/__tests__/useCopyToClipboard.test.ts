/**
 * Tests for useCopyToClipboard and useReadClipboard hooks
 *
 * Covers clipboard API interaction, error handling, auto-reset timeout,
 * cleanup on unmount, and fallback when Clipboard API is unavailable.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard, useReadClipboard } from '../useCopyToClipboard';

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('clipboard content'),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with copied=false and error=null', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [, state] = result.current;

    expect(state.copied).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets copied=true after successful copy', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    let success: boolean;
    await act(async () => {
      success = await result.current[0]('Hello');
    });

    expect(success!).toBe(true);
    expect(result.current[1].copied).toBe(true);
    expect(result.current[1].error).toBeNull();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello');
  });

  it('resets copied state after default 2s delay', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current[0]('text');
    });

    expect(result.current[1].copied).toBe(true);

    // Advance past the reset delay
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current[1].copied).toBe(false);
  });

  it('respects custom resetDelay', async () => {
    const { result } = renderHook(() => useCopyToClipboard(500));

    await act(async () => {
      await result.current[0]('text');
    });

    expect(result.current[1].copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current[1].copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current[1].copied).toBe(false);
  });

  it('sets error when writeText fails', async () => {
    const clipboardError = new Error('Permission denied');
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      clipboardError
    );

    const { result } = renderHook(() => useCopyToClipboard());

    let success: boolean;
    await act(async () => {
      success = await result.current[0]('text');
    });

    expect(success!).toBe(false);
    expect(result.current[1].copied).toBe(false);
    expect(result.current[1].error?.message).toBe('Permission denied');
  });

  it('wraps non-Error throwables', async () => {
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      'string error'
    );

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current[0]('text');
    });

    expect(result.current[1].error?.message).toBe('Failed to copy');
  });

  it('returns false when Clipboard API is unavailable', async () => {
    Object.assign(navigator, { clipboard: undefined });

    const { result } = renderHook(() => useCopyToClipboard());

    let success: boolean;
    await act(async () => {
      success = await result.current[0]('text');
    });

    expect(success!).toBe(false);
    expect(result.current[1].error?.message).toBe('Clipboard API not available');
  });

  it('clears previous timeout on rapid copy calls', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { result } = renderHook(() => useCopyToClipboard(5000));

    // First copy
    await act(async () => {
      await result.current[0]('first');
    });
    // Second copy — should clear the first timeout
    await act(async () => {
      await result.current[0]('second');
    });

    // clearTimeout called at least once (from the second copy clearing the first timer)
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('cleans up timeout on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current[0]('text');
    });

    unmount();

    // clearTimeout should have been called during cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});

describe('useReadClipboard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        readText: vi.fn().mockResolvedValue('pasted text'),
      },
    });
  });

  it('reads text from clipboard', async () => {
    const { result } = renderHook(() => useReadClipboard());

    let text: string | null;
    await act(async () => {
      text = await result.current();
    });

    expect(text!).toBe('pasted text');
  });

  it('returns null when Clipboard API is unavailable', async () => {
    Object.assign(navigator, { clipboard: undefined });

    const { result } = renderHook(() => useReadClipboard());

    let text: string | null;
    await act(async () => {
      text = await result.current();
    });

    expect(text!).toBeNull();
  });

  it('returns null when readText fails', async () => {
    (navigator.clipboard.readText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('denied')
    );

    const { result } = renderHook(() => useReadClipboard());

    let text: string | null;
    await act(async () => {
      text = await result.current();
    });

    expect(text!).toBeNull();
  });
});
