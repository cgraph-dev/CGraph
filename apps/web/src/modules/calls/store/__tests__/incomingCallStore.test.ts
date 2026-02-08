/**
 * incomingCallStore Unit Tests (modules/calls)
 *
 * Tests for Zustand incoming call store state management.
 * Covers incoming call notifications, accept, decline, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useIncomingCallStore } from '@/modules/calls/store';
import type { IncomingCall } from '@/modules/calls/store';

// ==================== MOCK DATA ====================

const mockVideoCall: IncomingCall = {
  roomId: 'room-100',
  callerId: 'caller-1',
  callerName: 'Alice',
  callerAvatar: 'https://example.com/alice.png',
  type: 'video',
  timestamp: 1700000000000,
};

const mockAudioCall: IncomingCall = {
  roomId: 'room-200',
  callerId: 'caller-2',
  callerName: 'Bob',
  callerAvatar: null,
  type: 'audio',
  timestamp: 1700000001000,
};

const mockVideoCall2: IncomingCall = {
  roomId: 'room-300',
  callerId: 'caller-3',
  callerName: 'Charlie',
  callerAvatar: 'https://example.com/charlie.png',
  type: 'video',
  timestamp: 1700000002000,
};

describe('incomingCallStore (modules/calls)', () => {
  beforeEach(() => {
    useIncomingCallStore.setState({ incomingCall: null });
  });

  // ==================== INITIAL STATE ====================

  describe('initial state', () => {
    it('should have null incoming call initially', () => {
      const state = useIncomingCallStore.getState();
      expect(state.incomingCall).toBeNull();
    });

    it('should expose setIncomingCall, acceptCall, and declineCall actions', () => {
      const state = useIncomingCallStore.getState();
      expect(typeof state.setIncomingCall).toBe('function');
      expect(typeof state.acceptCall).toBe('function');
      expect(typeof state.declineCall).toBe('function');
    });
  });

  // ==================== setIncomingCall ====================

  describe('setIncomingCall', () => {
    it('should set an incoming video call', () => {
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);

      const state = useIncomingCallStore.getState();
      expect(state.incomingCall).toEqual(mockVideoCall);
      expect(state.incomingCall?.type).toBe('video');
      expect(state.incomingCall?.roomId).toBe('room-100');
    });

    it('should set an incoming audio call', () => {
      useIncomingCallStore.getState().setIncomingCall(mockAudioCall);

      const state = useIncomingCallStore.getState();
      expect(state.incomingCall).toEqual(mockAudioCall);
      expect(state.incomingCall?.type).toBe('audio');
    });

    it('should handle call with null avatar', () => {
      useIncomingCallStore.getState().setIncomingCall(mockAudioCall);

      expect(useIncomingCallStore.getState().incomingCall?.callerAvatar).toBeNull();
      expect(useIncomingCallStore.getState().incomingCall?.callerName).toBe('Bob');
    });

    it('should clear incoming call when set to null', () => {
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);
      expect(useIncomingCallStore.getState().incomingCall).not.toBeNull();

      useIncomingCallStore.getState().setIncomingCall(null);
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should replace existing call with a new call', () => {
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);
      expect(useIncomingCallStore.getState().incomingCall?.callerId).toBe('caller-1');

      useIncomingCallStore.getState().setIncomingCall(mockAudioCall);
      expect(useIncomingCallStore.getState().incomingCall?.callerId).toBe('caller-2');
      expect(useIncomingCallStore.getState().incomingCall?.type).toBe('audio');
    });

    it('should preserve all call properties', () => {
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);

      const call = useIncomingCallStore.getState().incomingCall;
      expect(call?.roomId).toBe('room-100');
      expect(call?.callerId).toBe('caller-1');
      expect(call?.callerName).toBe('Alice');
      expect(call?.callerAvatar).toBe('https://example.com/alice.png');
      expect(call?.type).toBe('video');
      expect(call?.timestamp).toBe(1700000000000);
    });
  });

  // ==================== acceptCall ====================

  describe('acceptCall', () => {
    it('should clear incoming call when accepted', () => {
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);
      expect(useIncomingCallStore.getState().incomingCall).not.toBeNull();

      useIncomingCallStore.getState().acceptCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should do nothing when no incoming call exists', () => {
      expect(() => useIncomingCallStore.getState().acceptCall()).not.toThrow();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should accept audio calls the same as video calls', () => {
      useIncomingCallStore.getState().setIncomingCall(mockAudioCall);
      useIncomingCallStore.getState().acceptCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });
  });

  // ==================== declineCall ====================

  describe('declineCall', () => {
    it('should clear incoming call when declined', () => {
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);
      expect(useIncomingCallStore.getState().incomingCall).not.toBeNull();

      useIncomingCallStore.getState().declineCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should handle decline when no call exists', () => {
      expect(() => useIncomingCallStore.getState().declineCall()).not.toThrow();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });
  });

  // ==================== CALL WORKFLOWS ====================

  describe('call workflows', () => {
    it('should handle full accept workflow', () => {
      // Incoming call arrives
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);
      const callBefore = useIncomingCallStore.getState().incomingCall;
      expect(callBefore).not.toBeNull();
      expect(callBefore?.roomId).toBe('room-100');
      expect(callBefore?.callerName).toBe('Alice');

      // User accepts
      useIncomingCallStore.getState().acceptCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should handle full decline workflow', () => {
      useIncomingCallStore.getState().setIncomingCall(mockAudioCall);
      expect(useIncomingCallStore.getState().incomingCall?.callerName).toBe('Bob');

      useIncomingCallStore.getState().declineCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should handle multiple sequential calls', () => {
      // First call - decline
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);
      expect(useIncomingCallStore.getState().incomingCall?.callerId).toBe('caller-1');
      useIncomingCallStore.getState().declineCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();

      // Second call - accept
      useIncomingCallStore.getState().setIncomingCall(mockAudioCall);
      expect(useIncomingCallStore.getState().incomingCall?.callerId).toBe('caller-2');
      useIncomingCallStore.getState().acceptCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();

      // Third call - decline
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall2);
      expect(useIncomingCallStore.getState().incomingCall?.callerId).toBe('caller-3');
      useIncomingCallStore.getState().declineCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should handle call replacement without accepting/declining first', () => {
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);
      expect(useIncomingCallStore.getState().incomingCall?.roomId).toBe('room-100');

      // New call replaces old without explicit decline
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall2);
      expect(useIncomingCallStore.getState().incomingCall?.roomId).toBe('room-300');
      expect(useIncomingCallStore.getState().incomingCall?.callerName).toBe('Charlie');
    });
  });

  // ==================== EDGE CASES ====================

  describe('edge cases', () => {
    it('should handle rapid set/clear cycles', () => {
      const { setIncomingCall } = useIncomingCallStore.getState();

      setIncomingCall(mockVideoCall);
      setIncomingCall(null);
      setIncomingCall(mockAudioCall);
      setIncomingCall(null);
      setIncomingCall(mockVideoCall2);

      expect(useIncomingCallStore.getState().incomingCall).toEqual(mockVideoCall2);
    });

    it('should handle accept followed by new call', () => {
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);
      useIncomingCallStore.getState().acceptCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();

      useIncomingCallStore.getState().setIncomingCall(mockAudioCall);
      expect(useIncomingCallStore.getState().incomingCall).toEqual(mockAudioCall);
    });

    it('should handle decline followed by new call', () => {
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);
      useIncomingCallStore.getState().declineCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();

      useIncomingCallStore.getState().setIncomingCall(mockVideoCall2);
      expect(useIncomingCallStore.getState().incomingCall?.roomId).toBe('room-300');
    });

    it('should handle double accept gracefully', () => {
      useIncomingCallStore.getState().setIncomingCall(mockVideoCall);
      useIncomingCallStore.getState().acceptCall();
      expect(() => useIncomingCallStore.getState().acceptCall()).not.toThrow();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should handle double decline gracefully', () => {
      useIncomingCallStore.getState().setIncomingCall(mockAudioCall);
      useIncomingCallStore.getState().declineCall();
      expect(() => useIncomingCallStore.getState().declineCall()).not.toThrow();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });
  });
});
