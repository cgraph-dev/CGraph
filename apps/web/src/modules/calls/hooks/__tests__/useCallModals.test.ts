/**
 * useCallModals Hook Unit Tests
 *
 * Covers: initial state, handleStartVoiceCall, handleStartVideoCall,
 * closeVoiceCallModal, closeVideoCallModal, incoming call query params,
 * haptic feedback, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────

const mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

const mockHapticMedium = vi.fn();
vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { medium: () => mockHapticMedium() },
}));

import { useCallModals } from '../useCallModals';

// ── Tests ──────────────────────────────────────────────────────────────

describe('useCallModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset search params
    mockSearchParams.delete('incomingCall');
    mockSearchParams.delete('callType');
  });

  // ==================== INITIAL STATE ====================

  describe('initial state', () => {
    it('has modals closed by default', () => {
      const { result } = renderHook(() => useCallModals('conv-1'));
      expect(result.current.showVoiceCallModal).toBe(false);
      expect(result.current.showVideoCallModal).toBe(false);
    });

    it('has undefined incomingRoomId', () => {
      const { result } = renderHook(() => useCallModals('conv-1'));
      expect(result.current.incomingRoomId).toBeUndefined();
    });
  });

  // ==================== handleStartVoiceCall ====================

  describe('handleStartVoiceCall', () => {
    it('opens voice call modal when conversationId is provided', () => {
      const { result } = renderHook(() => useCallModals('conv-1'));

      act(() => {
        result.current.handleStartVoiceCall();
      });

      expect(result.current.showVoiceCallModal).toBe(true);
      expect(result.current.showVideoCallModal).toBe(false);
    });

    it('does nothing when conversationId is undefined', () => {
      const { result } = renderHook(() => useCallModals(undefined));

      act(() => {
        result.current.handleStartVoiceCall();
      });

      expect(result.current.showVoiceCallModal).toBe(false);
    });

    it('triggers haptic feedback when enableHaptic=true', () => {
      const { result } = renderHook(() => useCallModals('conv-1'));

      act(() => {
        result.current.handleStartVoiceCall(true);
      });

      expect(mockHapticMedium).toHaveBeenCalledOnce();
    });

    it('does NOT trigger haptic feedback by default', () => {
      const { result } = renderHook(() => useCallModals('conv-1'));

      act(() => {
        result.current.handleStartVoiceCall();
      });

      expect(mockHapticMedium).not.toHaveBeenCalled();
    });
  });

  // ==================== handleStartVideoCall ====================

  describe('handleStartVideoCall', () => {
    it('opens video call modal', () => {
      const { result } = renderHook(() => useCallModals('conv-1'));

      act(() => {
        result.current.handleStartVideoCall();
      });

      expect(result.current.showVideoCallModal).toBe(true);
      expect(result.current.showVoiceCallModal).toBe(false);
    });

    it('does nothing without conversationId', () => {
      const { result } = renderHook(() => useCallModals(undefined));

      act(() => {
        result.current.handleStartVideoCall();
      });

      expect(result.current.showVideoCallModal).toBe(false);
    });

    it('triggers haptic when enabled', () => {
      const { result } = renderHook(() => useCallModals('conv-1'));

      act(() => {
        result.current.handleStartVideoCall(true);
      });

      expect(mockHapticMedium).toHaveBeenCalledOnce();
    });
  });

  // ==================== close modals ====================

  describe('closeVoiceCallModal', () => {
    it('closes the voice modal and clears incomingRoomId', () => {
      const { result } = renderHook(() => useCallModals('conv-1'));

      act(() => {
        result.current.handleStartVoiceCall();
      });
      expect(result.current.showVoiceCallModal).toBe(true);

      act(() => {
        result.current.closeVoiceCallModal();
      });
      expect(result.current.showVoiceCallModal).toBe(false);
      expect(result.current.incomingRoomId).toBeUndefined();
    });
  });

  describe('closeVideoCallModal', () => {
    it('closes the video modal and clears incomingRoomId', () => {
      const { result } = renderHook(() => useCallModals('conv-1'));

      act(() => {
        result.current.handleStartVideoCall();
      });
      expect(result.current.showVideoCallModal).toBe(true);

      act(() => {
        result.current.closeVideoCallModal();
      });
      expect(result.current.showVideoCallModal).toBe(false);
      expect(result.current.incomingRoomId).toBeUndefined();
    });
  });

  // ==================== incoming call query params ====================

  describe('incoming call query params', () => {
    it('opens video modal when callType=video param is present', () => {
      mockSearchParams.set('incomingCall', 'room-123');
      mockSearchParams.set('callType', 'video');

      const { result } = renderHook(() => useCallModals('conv-1'));

      expect(result.current.showVideoCallModal).toBe(true);
      expect(result.current.incomingRoomId).toBe('room-123');
    });

    it('opens voice modal when callType=voice param is present', () => {
      mockSearchParams.set('incomingCall', 'room-456');
      mockSearchParams.set('callType', 'voice');

      const { result } = renderHook(() => useCallModals('conv-1'));

      expect(result.current.showVoiceCallModal).toBe(true);
      expect(result.current.incomingRoomId).toBe('room-456');
    });

    it('cleans up search params after processing', () => {
      mockSearchParams.set('incomingCall', 'room-789');
      mockSearchParams.set('callType', 'video');

      renderHook(() => useCallModals('conv-1'));

      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it('does not open modals when only incomingCall param exists', () => {
      mockSearchParams.set('incomingCall', 'room-999');
      // No callType param

      const { result } = renderHook(() => useCallModals('conv-1'));

      expect(result.current.showVoiceCallModal).toBe(false);
      expect(result.current.showVideoCallModal).toBe(false);
    });
  });

  // ==================== Handler stability ====================

  describe('handler stability', () => {
    it('returns stable handler references across renders', () => {
      const { result, rerender } = renderHook(() => useCallModals('conv-1'));

      const first = result.current.handleStartVoiceCall;
      rerender();
      expect(result.current.handleStartVoiceCall).toBe(first);
    });

    it('updates handler when conversationId changes', () => {
      const { result, rerender } = renderHook(
        ({ id }: { id: string | undefined }) => useCallModals(id),
        { initialProps: { id: 'conv-1' } }
      );

      const first = result.current.handleStartVoiceCall;
      rerender({ id: 'conv-2' });
      expect(result.current.handleStartVoiceCall).not.toBe(first);
    });
  });
});
