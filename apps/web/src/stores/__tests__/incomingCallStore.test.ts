/**
 * incomingCallStore Unit Tests
 *
 * Tests for Zustand incoming call store state management.
 * Covers incoming call notifications, accept, and decline actions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useIncomingCallStore } from '../incomingCallStore';
import type { IncomingCall } from '../incomingCallStore';

// Mock incoming call
const mockCall: IncomingCall = {
  roomId: 'room-123',
  callerId: 'user-456',
  callerName: 'John Doe',
  callerAvatar: 'https://example.com/avatar.jpg',
  type: 'video',
  timestamp: Date.now(),
};

const mockAudioCall: IncomingCall = {
  roomId: 'room-789',
  callerId: 'user-012',
  callerName: 'Jane Smith',
  callerAvatar: null,
  type: 'audio',
  timestamp: Date.now(),
};

describe('incomingCallStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useIncomingCallStore.setState({ incomingCall: null });
  });

  describe('initial state', () => {
    it('should have null incoming call initially', () => {
      const state = useIncomingCallStore.getState();
      expect(state.incomingCall).toBeNull();
    });
  });

  describe('setIncomingCall', () => {
    it('should set an incoming video call', () => {
      const { setIncomingCall } = useIncomingCallStore.getState();

      setIncomingCall(mockCall);

      const state = useIncomingCallStore.getState();
      expect(state.incomingCall).toEqual(mockCall);
      expect(state.incomingCall?.type).toBe('video');
    });

    it('should set an incoming audio call', () => {
      const { setIncomingCall } = useIncomingCallStore.getState();

      setIncomingCall(mockAudioCall);

      const state = useIncomingCallStore.getState();
      expect(state.incomingCall).toEqual(mockAudioCall);
      expect(state.incomingCall?.type).toBe('audio');
    });

    it('should handle call with null avatar', () => {
      const { setIncomingCall } = useIncomingCallStore.getState();

      setIncomingCall(mockAudioCall);

      const state = useIncomingCallStore.getState();
      expect(state.incomingCall?.callerAvatar).toBeNull();
    });

    it('should clear incoming call when set to null', () => {
      const { setIncomingCall } = useIncomingCallStore.getState();

      // First set a call
      setIncomingCall(mockCall);
      expect(useIncomingCallStore.getState().incomingCall).not.toBeNull();

      // Then clear it
      setIncomingCall(null);
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should replace existing call with new call', () => {
      const { setIncomingCall } = useIncomingCallStore.getState();

      setIncomingCall(mockCall);
      expect(useIncomingCallStore.getState().incomingCall?.roomId).toBe('room-123');

      setIncomingCall(mockAudioCall);
      expect(useIncomingCallStore.getState().incomingCall?.roomId).toBe('room-789');
    });
  });

  describe('acceptCall', () => {
    it('should clear incoming call when accepted', () => {
      const { setIncomingCall, acceptCall } = useIncomingCallStore.getState();

      setIncomingCall(mockCall);
      expect(useIncomingCallStore.getState().incomingCall).not.toBeNull();

      acceptCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should do nothing when no incoming call', () => {
      const { acceptCall } = useIncomingCallStore.getState();

      // Should not throw
      expect(() => acceptCall()).not.toThrow();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });
  });

  describe('declineCall', () => {
    it('should clear incoming call when declined', () => {
      const { setIncomingCall, declineCall } = useIncomingCallStore.getState();

      setIncomingCall(mockCall);
      expect(useIncomingCallStore.getState().incomingCall).not.toBeNull();

      declineCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should handle decline when no call exists', () => {
      const { declineCall } = useIncomingCallStore.getState();

      // Should not throw
      expect(() => declineCall()).not.toThrow();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });
  });

  describe('call type handling', () => {
    it('should correctly identify video calls', () => {
      const { setIncomingCall } = useIncomingCallStore.getState();

      setIncomingCall(mockCall);
      expect(useIncomingCallStore.getState().incomingCall?.type).toBe('video');
    });

    it('should correctly identify audio calls', () => {
      const { setIncomingCall } = useIncomingCallStore.getState();

      setIncomingCall(mockAudioCall);
      expect(useIncomingCallStore.getState().incomingCall?.type).toBe('audio');
    });
  });

  describe('call workflow', () => {
    it('should handle complete accept workflow', () => {
      const { setIncomingCall, acceptCall } = useIncomingCallStore.getState();

      // Simulate incoming call
      setIncomingCall(mockCall);
      const callBefore = useIncomingCallStore.getState().incomingCall;
      expect(callBefore).not.toBeNull();
      expect(callBefore?.roomId).toBe('room-123');

      // Accept the call
      acceptCall();

      // Call should be cleared (UI handles actual WebRTC connection)
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should handle complete decline workflow', () => {
      const { setIncomingCall, declineCall } = useIncomingCallStore.getState();

      // Simulate incoming call
      setIncomingCall(mockCall);
      expect(useIncomingCallStore.getState().incomingCall).not.toBeNull();

      // Decline the call
      declineCall();

      // Call should be cleared
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();
    });

    it('should handle multiple calls in sequence', () => {
      const { setIncomingCall, declineCall } = useIncomingCallStore.getState();

      // First call comes in
      setIncomingCall(mockCall);
      expect(useIncomingCallStore.getState().incomingCall?.callerId).toBe('user-456');

      // Decline first call
      declineCall();
      expect(useIncomingCallStore.getState().incomingCall).toBeNull();

      // Second call comes in
      setIncomingCall(mockAudioCall);
      expect(useIncomingCallStore.getState().incomingCall?.callerId).toBe('user-012');
    });
  });
});
