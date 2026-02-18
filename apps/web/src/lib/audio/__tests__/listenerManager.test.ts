/**
 * Spatial Audio Listener Manager Tests
 *
 * Tests for the AudioListener position/orientation management:
 * - HRTF initialization
 * - Position updates
 * - Orientation → forward vector math
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListenerManager } from '../spatial-audio/listener-manager';

// ── Mock AudioListener ───────────────────────────────────────────────────
function createMockAudioContext(): AudioContext {
  return {
    currentTime: 0,
    listener: {
      positionX: { value: 0, setValueAtTime: vi.fn() },
      positionY: { value: 0, setValueAtTime: vi.fn() },
      positionZ: { value: 0, setValueAtTime: vi.fn() },
      forwardX: { value: 0, setValueAtTime: vi.fn() },
      forwardY: { value: 0, setValueAtTime: vi.fn() },
      forwardZ: { value: -1, setValueAtTime: vi.fn() },
      upX: { value: 0, setValueAtTime: vi.fn() },
      upY: { value: 1, setValueAtTime: vi.fn() },
      upZ: { value: 0, setValueAtTime: vi.fn() },
      setPosition: vi.fn(),
      setOrientation: vi.fn(),
    },
  } as unknown as AudioContext;
}

describe('ListenerManager', () => {
  let ctx: AudioContext;
  let manager: ListenerManager;

  beforeEach(() => {
    ctx = createMockAudioContext();
    manager = new ListenerManager(() => ctx);
  });

  describe('initializeHRTF', () => {
    it('should set listener to default position and orientation', async () => {
      await manager.initializeHRTF();

      const listener = ctx.listener as unknown as Record<string, { value: number }>;
      expect(listener.positionX.value).toBe(0);
      expect(listener.positionY.value).toBe(0);
      expect(listener.positionZ.value).toBe(0);
      expect(listener.forwardX.value).toBe(0);
      expect(listener.forwardY.value).toBe(0);
      expect(listener.forwardZ.value).toBe(-1);
      expect(listener.upX.value).toBe(0);
      expect(listener.upY.value).toBe(1);
      expect(listener.upZ.value).toBe(0);
    });

    it('should handle null audio context', async () => {
      const nullManager = new ListenerManager(() => null);
      // Should not throw
      await expect(nullManager.initializeHRTF()).resolves.not.toThrow();
    });
  });

  describe('setListenerPosition', () => {
    it('should update the AudioListener position', () => {
      manager.setListenerPosition({ x: 10, y: 20, z: 30 });

      const listener = ctx.listener as unknown as Record<string, { setValueAtTime: ReturnType<typeof vi.fn> }>;
      expect(listener.positionX.setValueAtTime).toHaveBeenCalledWith(10, 0);
      expect(listener.positionY.setValueAtTime).toHaveBeenCalledWith(20, 0);
      expect(listener.positionZ.setValueAtTime).toHaveBeenCalledWith(30, 0);
    });
  });

  describe('setListenerOrientation', () => {
    it('should compute correct forward vector for yaw=0, pitch=0 (facing -Z)', () => {
      manager.setListenerOrientation({ yaw: 0, pitch: 0, roll: 0 });

      const listener = ctx.listener as unknown as Record<string, { setValueAtTime: ReturnType<typeof vi.fn> }>;

      // At yaw=0, pitch=0:
      // forwardX = sin(0) * cos(0) = 0
      // forwardY = sin(0) = 0
      // forwardZ = -cos(0) * cos(0) = -1
      const forwardXCall = listener.forwardX.setValueAtTime.mock.calls[0];
      const forwardYCall = listener.forwardY.setValueAtTime.mock.calls[0];
      const forwardZCall = listener.forwardZ.setValueAtTime.mock.calls[0];

      expect(forwardXCall![0]).toBeCloseTo(0, 5);
      expect(forwardYCall![0]).toBeCloseTo(0, 5);
      expect(forwardZCall![0]).toBeCloseTo(-1, 5);
    });

    it('should compute correct forward vector for yaw=PI/2 (facing +X)', () => {
      manager.setListenerOrientation({ yaw: Math.PI / 2, pitch: 0, roll: 0 });

      const listener = ctx.listener as unknown as Record<string, { setValueAtTime: ReturnType<typeof vi.fn> }>;

      // At yaw=PI/2, pitch=0:
      // forwardX = sin(PI/2) * cos(0) = 1
      // forwardY = sin(0) = 0
      // forwardZ = -cos(PI/2) * cos(0) ≈ 0
      const forwardXCall = listener.forwardX.setValueAtTime.mock.calls[0];
      const forwardYCall = listener.forwardY.setValueAtTime.mock.calls[0];
      const forwardZCall = listener.forwardZ.setValueAtTime.mock.calls[0];

      expect(forwardXCall![0]).toBeCloseTo(1, 5);
      expect(forwardYCall![0]).toBeCloseTo(0, 5);
      expect(forwardZCall![0]).toBeCloseTo(0, 3);
    });

    it('should compute correct forward vector for pitch=PI/4 (looking up 45°)', () => {
      manager.setListenerOrientation({ yaw: 0, pitch: Math.PI / 4, roll: 0 });

      const listener = ctx.listener as unknown as Record<string, { setValueAtTime: ReturnType<typeof vi.fn> }>;

      // At yaw=0, pitch=PI/4:
      // forwardX = sin(0) * cos(PI/4) = 0
      // forwardY = sin(PI/4) ≈ 0.707
      // forwardZ = -cos(0) * cos(PI/4) ≈ -0.707
      const forwardYCall = listener.forwardY.setValueAtTime.mock.calls[0];
      const forwardZCall = listener.forwardZ.setValueAtTime.mock.calls[0];

      expect(forwardYCall![0]).toBeCloseTo(Math.SQRT1_2, 5);
      expect(forwardZCall![0]).toBeCloseTo(-Math.SQRT1_2, 5);
    });

    it('should handle combined yaw and pitch', () => {
      manager.setListenerOrientation({ yaw: Math.PI, pitch: 0, roll: 0 });

      const listener = ctx.listener as unknown as Record<string, { setValueAtTime: ReturnType<typeof vi.fn> }>;

      // At yaw=PI, pitch=0:
      // forwardX = sin(PI) * cos(0) ≈ 0
      // forwardY = sin(0) = 0
      // forwardZ = -cos(PI) * cos(0) = 1 (facing +Z, behind)
      const forwardXCall = listener.forwardX!.setValueAtTime.mock.calls[0];
      const forwardZCall = listener.forwardZ!.setValueAtTime.mock.calls[0];

      expect(forwardXCall![0]).toBeCloseTo(0, 3);
      expect(forwardZCall![0]).toBeCloseTo(1, 5);
    });
  });

  describe('null context handling', () => {
    it('should not throw when audio context is null', () => {
      const nullManager = new ListenerManager(() => null);

      expect(() => nullManager.setListenerPosition({ x: 1, y: 2, z: 3 })).not.toThrow();
      expect(() => nullManager.setListenerOrientation({ yaw: 1, pitch: 1, roll: 1 })).not.toThrow();
    });
  });

  describe('legacy API fallback', () => {
    it('should use setPosition/setOrientation when positionX is not available', () => {
      const legacyCtx = {
        currentTime: 0,
        listener: {
          setPosition: vi.fn(),
          setOrientation: vi.fn(),
        },
      } as unknown as AudioContext;

      const legacyManager = new ListenerManager(() => legacyCtx);

      legacyManager.setListenerPosition({ x: 5, y: 10, z: 15 });

      const listener = legacyCtx.listener as unknown as { setPosition: ReturnType<typeof vi.fn> };
      expect(listener.setPosition).toHaveBeenCalledWith(5, 10, 15);
    });
  });
});
