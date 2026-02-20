/**
 * useWebRTC Hook Unit Tests
 *
 * Tests for the WebRTC call management hook.
 * Validates call lifecycle, media controls, and event handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebRTC } from '../useWebRTC';

// --- Mocks ----------------------------------------------------------------

const mockGetState = vi.fn(() => ({
  roomId: null,
  status: 'idle' as const,
  participants: [],
  localStream: null,
  remoteStreams: new Map(),
  isMuted: false,
  isVideoEnabled: true,
  isScreenSharing: false,
  error: null,
}));

const mockStartCall = vi.fn().mockResolvedValue('room-123');
const mockAnswerCall = vi.fn().mockResolvedValue(true);
const mockEndCall = vi.fn().mockResolvedValue(undefined);
const mockToggleMute = vi.fn().mockReturnValue(true);
const mockToggleVideo = vi.fn().mockReturnValue(false);
const mockStartScreenShare = vi.fn().mockResolvedValue(true);
const mockStopScreenShare = vi.fn().mockResolvedValue(undefined);
const mockOn = vi.fn();

vi.mock('@/lib/webrtc/webrtcService', () => ({
  WebRTCManager: vi.fn().mockImplementation(() => ({
    on: mockOn,
    getState: mockGetState,
    startCall: mockStartCall,
    answerCall: mockAnswerCall,
    endCall: mockEndCall,
    toggleMute: mockToggleMute,
    toggleVideo: mockToggleVideo,
    startScreenShare: mockStartScreenShare,
    stopScreenShare: mockStopScreenShare,
  })),
}));

const mockGetSocket = vi.fn().mockReturnValue({ id: 'socket-1' });
vi.mock('@/lib/socket', () => ({
  useSocket: vi.fn(() => ({
    getSocket: mockGetSocket,
  })),
}));

vi.mock('@/components/feedback/Toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------

describe('useWebRTC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetState.mockReturnValue({
      roomId: null,
      status: 'idle',
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      isMuted: false,
      isVideoEnabled: true,
      isScreenSharing: false,
      error: null,
    });
  });

  // --- Initial state -------------------------------------------------------

  it('returns idle call state by default', () => {
    const { result } = renderHook(() => useWebRTC());
    expect(result.current.callState.status).toBe('idle');
    expect(result.current.isCallActive).toBe(false);
    expect(result.current.isConnecting).toBe(false);
  });

  it('returns null streams initially', () => {
    const { result } = renderHook(() => useWebRTC());
    expect(result.current.localStream).toBeNull();
    expect(result.current.remoteStream).toBeNull();
  });

  // --- Socket missing ------------------------------------------------------

  it('does not create manager when socket is unavailable', () => {
    mockGetSocket.mockReturnValueOnce(null);
    const { result } = renderHook(() => useWebRTC());
    // Should still render with idle defaults
    expect(result.current.callState.status).toBe('idle');
  });

  // --- startCall -----------------------------------------------------------

  it('starts a call and updates state', async () => {
    mockGetState.mockReturnValue({
      roomId: 'room-123' as any,
      status: 'ringing' as any,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      isMuted: false,
      isVideoEnabled: true,
      isScreenSharing: false,
      error: null,
    });

    const { result } = renderHook(() => useWebRTC());

    await act(async () => {
      await result.current.startCall('user-456', { video: true, audio: true });
    });

    expect(mockStartCall).toHaveBeenCalledWith('user-456', { video: true, audio: true });
  });

  it('shows toast error when startCall returns no room', async () => {
    const { toast } = await import('@/components/feedback/Toast');
    mockStartCall.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useWebRTC());

    await act(async () => {
      await result.current.startCall('user-456');
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to start call');
  });

  // --- answerCall ----------------------------------------------------------

  it('answers an incoming call', async () => {
    mockGetState.mockReturnValue({
      roomId: 'room-789' as any,
      status: 'connected' as any,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      isMuted: false,
      isVideoEnabled: true,
      isScreenSharing: false,
      error: null,
    });

    const { result } = renderHook(() => useWebRTC());

    await act(async () => {
      await result.current.answerCall('room-789', { video: false, audio: true });
    });

    expect(mockAnswerCall).toHaveBeenCalledWith('room-789', { video: false, audio: true });
  });

  it('shows toast error when answerCall fails', async () => {
    const { toast } = await import('@/components/feedback/Toast');
    mockAnswerCall.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useWebRTC());

    await act(async () => {
      await result.current.answerCall('room-fail');
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to answer call');
  });

  // --- endCall -------------------------------------------------------------

  it('ends the current call and clears remote stream', async () => {
    mockGetState.mockReturnValue({
      roomId: null,
      status: 'idle',
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      isMuted: false,
      isVideoEnabled: true,
      isScreenSharing: false,
      error: null,
    });

    const { result } = renderHook(() => useWebRTC());

    await act(async () => {
      await result.current.endCall();
    });

    expect(mockEndCall).toHaveBeenCalled();
    expect(result.current.remoteStream).toBeNull();
  });

  // --- toggleMute / toggleVideo -------------------------------------------

  it('toggles mute state', () => {
    mockGetState.mockReturnValue({
      roomId: 'room-1' as any,
      status: 'connected' as any,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      isMuted: true,
      isVideoEnabled: true,
      isScreenSharing: false,
      error: null,
    });

    const { result } = renderHook(() => useWebRTC());

    let isMuted: boolean;
    act(() => {
      isMuted = result.current.toggleMute();
    });

    expect(mockToggleMute).toHaveBeenCalled();
    expect(isMuted!).toBe(true);
  });

  it('toggles video state', () => {
    mockGetState.mockReturnValue({
      roomId: 'room-1' as any,
      status: 'connected' as any,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      isMuted: false,
      isVideoEnabled: false,
      isScreenSharing: false,
      error: null,
    });

    const { result } = renderHook(() => useWebRTC());

    let isVideoOn: boolean;
    act(() => {
      isVideoOn = result.current.toggleVideo();
    });

    expect(mockToggleVideo).toHaveBeenCalled();
    expect(isVideoOn!).toBe(false);
  });

  // --- Screen sharing ------------------------------------------------------

  it('starts screen sharing', async () => {
    const { result } = renderHook(() => useWebRTC());

    let success: boolean;
    await act(async () => {
      success = await result.current.startScreenShare();
    });

    expect(mockStartScreenShare).toHaveBeenCalled();
    expect(success!).toBe(true);
  });

  it('stops screen sharing', async () => {
    const { result } = renderHook(() => useWebRTC());

    await act(async () => {
      await result.current.stopScreenShare();
    });

    expect(mockStopScreenShare).toHaveBeenCalled();
  });

  // --- Derived state -------------------------------------------------------

  it('isCallActive is true when status is "connected"', () => {
    mockGetState.mockReturnValue({
      roomId: 'room-1' as any,
      status: 'connected' as any,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      isMuted: false,
      isVideoEnabled: true,
      isScreenSharing: false,
      error: null,
    });

    const { result } = renderHook(() => useWebRTC());

    // Trigger a state sync by starting a call (which calls getState)
    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isCallActive).toBe(true);
  });

  it('isConnecting is true when status is "ringing"', () => {
    mockGetState.mockReturnValue({
      roomId: 'room-1' as any,
      status: 'ringing' as any,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      isMuted: false,
      isVideoEnabled: true,
      isScreenSharing: false,
      error: null,
    });

    const { result } = renderHook(() => useWebRTC());

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isConnecting).toBe(true);
  });

  // --- Callback options ----------------------------------------------------

  it('accepts callback options without crashing', () => {
    const onConnected = vi.fn();
    const onEnded = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useWebRTC({
        conversationId: 'conv-1',
        onCallConnected: onConnected,
        onCallEnded: onEnded,
        onError,
      })
    );

    expect(result.current.callState.status).toBe('idle');
  });
});
