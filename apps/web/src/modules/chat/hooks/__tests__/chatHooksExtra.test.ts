import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const { mockChatState } = vi.hoisted(() => ({
  mockChatState: {
    scheduleMessage: vi.fn(),
    rescheduleMessage: vi.fn(),
  },
}));

vi.mock('@/modules/chat/store', () => {
  const storeSelector = vi.fn((selector?: (s: typeof mockChatState) => unknown) => {
    if (typeof selector === 'function') return selector(mockChatState);
    return mockChatState;
  });
  (storeSelector as any).getState = () => mockChatState;
  return { useChatStore: storeSelector, Message: {} };
});

vi.mock('@/components/Toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn(), medium: vi.fn(), light: vi.fn() },
}));

import { useE2EEError } from '../useE2EEError';
import { useScheduleMessage } from '../useScheduleMessage';

// ─── useE2EEError ────────────────────────────────────────────────────────────

describe('useE2EEError', () => {
  it('returns initial hidden state', () => {
    const { result } = renderHook(() => useE2EEError());
    expect(result.current.showE2EEError).toBe(false);
    expect(result.current.e2eeErrorMessage).toBe('');
    expect(result.current.pendingMessage).toBeNull();
  });

  it('showError sets error message and shows error', () => {
    const { result } = renderHook(() => useE2EEError());

    act(() => {
      result.current.showError('Encryption failed');
    });

    expect(result.current.showE2EEError).toBe(true);
    expect(result.current.e2eeErrorMessage).toBe('Encryption failed');
  });

  it('showError with pending message stores the pending message', () => {
    const { result } = renderHook(() => useE2EEError());
    const pending = { content: 'Hello', replyToId: 'r-1' };

    act(() => {
      result.current.showError('Key mismatch', pending);
    });

    expect(result.current.pendingMessage).toEqual(pending);
  });

  it('hideError clears error state but keeps pending message', () => {
    const { result } = renderHook(() => useE2EEError());

    act(() => {
      result.current.showError('Error', { content: 'msg' });
    });
    act(() => {
      result.current.hideError();
    });

    expect(result.current.showE2EEError).toBe(false);
    expect(result.current.e2eeErrorMessage).toBe('');
    expect(result.current.pendingMessage).toEqual({ content: 'msg' });
  });

  it('retryPendingMessage returns pending message and clears all state', () => {
    const { result } = renderHook(() => useE2EEError());
    const pending = { content: 'retry me' };

    act(() => {
      result.current.showError('Error', pending);
    });

    let returned: any;
    act(() => {
      returned = result.current.retryPendingMessage();
    });

    expect(returned).toEqual(pending);
    expect(result.current.pendingMessage).toBeNull();
    expect(result.current.showE2EEError).toBe(false);
    expect(result.current.e2eeErrorMessage).toBe('');
  });

  it('retryPendingMessage returns null when no pending message', () => {
    const { result } = renderHook(() => useE2EEError());

    let returned: any;
    act(() => {
      returned = result.current.retryPendingMessage();
    });

    expect(returned).toBeNull();
  });

  it('clearPendingMessage clears only the pending message', () => {
    const { result } = renderHook(() => useE2EEError());

    act(() => {
      result.current.showError('Error', { content: 'test' });
    });
    act(() => {
      result.current.clearPendingMessage();
    });

    expect(result.current.pendingMessage).toBeNull();
    expect(result.current.showE2EEError).toBe(true);
  });
});

// ─── useScheduleMessage ──────────────────────────────────────────────────────

describe('useScheduleMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useScheduleMessage());
    expect(result.current.showScheduleModal).toBe(false);
    expect(result.current.messageToSchedule).toBe('');
    expect(result.current.showScheduledList).toBe(false);
    expect(result.current.messageToReschedule).toBeNull();
  });

  it('openScheduleModal sets message and opens modal', () => {
    const { result } = renderHook(() => useScheduleMessage());

    act(() => {
      result.current.openScheduleModal('Hello future');
    });

    expect(result.current.showScheduleModal).toBe(true);
    expect(result.current.messageToSchedule).toBe('Hello future');
  });

  it('closeScheduleModal resets all modal state', () => {
    const { result } = renderHook(() => useScheduleMessage());

    act(() => {
      result.current.openScheduleModal('test');
    });
    act(() => {
      result.current.closeScheduleModal();
    });

    expect(result.current.showScheduleModal).toBe(false);
    expect(result.current.messageToSchedule).toBe('');
    expect(result.current.messageToReschedule).toBeNull();
  });

  it('handleSchedule calls scheduleMessage for new messages', async () => {
    mockChatState.scheduleMessage.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useScheduleMessage());

    act(() => {
      result.current.openScheduleModal('Scheduled content');
    });

    const date = new Date('2026-03-01T10:00:00Z');
    await act(async () => {
      await result.current.handleSchedule(date, 'conv-1');
    });

    expect(mockChatState.scheduleMessage).toHaveBeenCalledWith(
      'conv-1',
      'Scheduled content',
      date,
      { type: 'text', replyToId: undefined }
    );
  });

  it('handleSchedule calls rescheduleMessage for rescheduled messages', async () => {
    mockChatState.rescheduleMessage.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useScheduleMessage());

    const msg = { id: 'msg-1', content: 'old content' } as any;
    act(() => {
      result.current.handleRescheduleClick(msg);
    });

    expect(result.current.messageToReschedule).toBe(msg);
    expect(result.current.showScheduleModal).toBe(true);

    const date = new Date('2026-03-01T12:00:00Z');
    await act(async () => {
      await result.current.handleSchedule(date, 'conv-1');
    });

    expect(mockChatState.rescheduleMessage).toHaveBeenCalledWith('msg-1', date);
  });

  it('handleSchedule throws and toasts error on failure', async () => {
    mockChatState.scheduleMessage.mockRejectedValueOnce(new Error('Server error'));
    const { result } = renderHook(() => useScheduleMessage());

    act(() => {
      result.current.openScheduleModal('Fail msg');
    });

    const date = new Date('2026-03-01T10:00:00Z');
    await expect(
      act(async () => {
        await result.current.handleSchedule(date, 'conv-1');
      })
    ).rejects.toThrow('Server error');
  });

  it('handleRescheduleClick sets state from message', () => {
    const { result } = renderHook(() => useScheduleMessage());

    const msg = { id: 'msg-2', content: 'reschedule me' } as any;
    act(() => {
      result.current.handleRescheduleClick(msg);
    });

    expect(result.current.messageToReschedule).toBe(msg);
    expect(result.current.messageToSchedule).toBe('reschedule me');
    expect(result.current.showScheduledList).toBe(false);
    expect(result.current.showScheduleModal).toBe(true);
  });

  it('setters update state individually', () => {
    const { result } = renderHook(() => useScheduleMessage());

    act(() => {
      result.current.setShowScheduleModal(true);
    });
    expect(result.current.showScheduleModal).toBe(true);

    act(() => {
      result.current.setShowScheduledList(true);
    });
    expect(result.current.showScheduledList).toBe(true);

    act(() => {
      result.current.setMessageToSchedule('new msg');
    });
    expect(result.current.messageToSchedule).toBe('new msg');
  });
});
