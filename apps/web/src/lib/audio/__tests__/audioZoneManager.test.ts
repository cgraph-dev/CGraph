/**
 * Audio Zone Manager Tests
 *
 * Tests for spatial audio zone management:
 * - Zone CRUD operations
 * - Zone transition detection (distance-based geometry)
 * - Zone effect application
 * - Cleanup
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioZoneManager } from '../audioZoneManager';
import type { AudioZone, AudioSource } from '../spatialAudio.types';

// ── Mock logger ──────────────────────────────────────────────────────────
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ── Factory Helpers ──────────────────────────────────────────────────────
function createZone(overrides: Partial<AudioZone> = {}): AudioZone {
  return {
    id: 'zone-1',
    name: 'Test Zone',
    position: { x: 0, y: 0, z: 0 },
    radius: 10,
    shape: 'sphere',
    reverb: {
      enabled: false,
      type: 'room',
      decay: 1,
      wetDry: 0.5,
      preDelay: 10,
    },
    occlusion: 0,
    gainModifier: 1,
    ...overrides,
  };
}

function createSource(overrides: Partial<AudioSource> = {}): AudioSource {
  return {
    id: 'source-1',
    position: { x: 0, y: 0, z: 0 },
    volume: 1,
    muted: false,
    spatialEnabled: true,
    ...overrides,
  };
}

describe('AudioZoneManager', () => {
  let manager: AudioZoneManager;

  beforeEach(() => {
    manager = new AudioZoneManager();
  });

  // ── Zone CRUD ──────────────────────────────────────────────────────────
  describe('zone CRUD', () => {
    it('should add a zone', () => {
      const zone = createZone();
      manager.addAudioZone(zone);

      const zones = manager.getActiveZones();
      expect(zones).toHaveLength(1);
      expect(zones[0]!.id).toBe('zone-1');
    });

    it('should add multiple zones', () => {
      manager.addAudioZone(createZone({ id: 'z1', name: 'Zone 1' }));
      manager.addAudioZone(createZone({ id: 'z2', name: 'Zone 2' }));
      manager.addAudioZone(createZone({ id: 'z3', name: 'Zone 3' }));

      expect(manager.getActiveZones()).toHaveLength(3);
    });

    it('should remove a zone', () => {
      manager.addAudioZone(createZone({ id: 'z1' }));
      manager.addAudioZone(createZone({ id: 'z2' }));

      manager.removeAudioZone('z1');

      const zones = manager.getActiveZones();
      expect(zones).toHaveLength(1);
      expect(zones[0]!.id).toBe('z2');
    });

    it('should update a zone preserving its ID', () => {
      manager.addAudioZone(createZone({ id: 'z1', name: 'Original' }));

      manager.updateAudioZone('z1', { name: 'Updated', radius: 20 });

      const zones = manager.getActiveZones();
      expect(zones[0]!.name).toBe('Updated');
      expect(zones[0]!.radius).toBe(20);
      expect(zones[0]!.id).toBe('z1'); // ID cannot be changed
    });

    it('should ignore update for non-existent zone', () => {
      manager.updateAudioZone('nonexistent', { name: 'Nope' });
      expect(manager.getActiveZones()).toHaveLength(0);
    });

    it('should return a copy from getZones()', () => {
      manager.addAudioZone(createZone({ id: 'z1' }));

      const zonesMap = manager.getZones();
      zonesMap.delete('z1');

      // Original should not be affected
      expect(manager.getActiveZones()).toHaveLength(1);
    });
  });

  // ── Zone Transitions (Distance-Based Geometry) ─────────────────────────
  describe('checkZoneTransitions', () => {
    it('should detect position inside a zone', () => {
      manager.addAudioZone(
        createZone({
          id: 'z1',
          position: { x: 0, y: 0, z: 0 },
          radius: 10,
        })
      );

      const activeZones = manager.checkZoneTransitions({ x: 3, y: 4, z: 0 });
      // distance = sqrt(9+16+0) = 5, which is < 10
      expect(activeZones).toHaveLength(1);
      expect(activeZones[0]!.id).toBe('z1');
    });

    it('should detect position outside a zone', () => {
      manager.addAudioZone(
        createZone({
          id: 'z1',
          position: { x: 0, y: 0, z: 0 },
          radius: 5,
        })
      );

      const activeZones = manager.checkZoneTransitions({ x: 10, y: 10, z: 10 });
      // distance = sqrt(100+100+100) ≈ 17.3, which is > 5
      expect(activeZones).toHaveLength(0);
    });

    it('should detect position on zone boundary', () => {
      manager.addAudioZone(
        createZone({
          id: 'z1',
          position: { x: 0, y: 0, z: 0 },
          radius: 5,
        })
      );

      // Exactly on the boundary: distance = 5 ≤ 5
      const activeZones = manager.checkZoneTransitions({ x: 5, y: 0, z: 0 });
      expect(activeZones).toHaveLength(1);
    });

    it('should detect position inside multiple overlapping zones', () => {
      manager.addAudioZone(
        createZone({
          id: 'z1',
          position: { x: 0, y: 0, z: 0 },
          radius: 20,
        })
      );
      manager.addAudioZone(
        createZone({
          id: 'z2',
          position: { x: 5, y: 0, z: 0 },
          radius: 15,
        })
      );

      const activeZones = manager.checkZoneTransitions({ x: 3, y: 0, z: 0 });
      // z1: dist=3 ≤ 20 ✓, z2: dist=2 ≤ 15 ✓
      expect(activeZones).toHaveLength(2);
    });

    it('should handle 3D distance correctly', () => {
      manager.addAudioZone(
        createZone({
          id: 'z1',
          position: { x: 10, y: 20, z: 30 },
          radius: 10,
        })
      );

      // Position at (13, 24, 30): distance = sqrt(9+16+0) = 5 ≤ 10
      const inside = manager.checkZoneTransitions({ x: 13, y: 24, z: 30 });
      expect(inside).toHaveLength(1);

      // Position at (25, 35, 45): distance = sqrt(225+225+225) ≈ 25.98 > 10
      const outside = manager.checkZoneTransitions({ x: 25, y: 35, z: 45 });
      expect(outside).toHaveLength(0);
    });

    it('should return empty array with no zones', () => {
      const activeZones = manager.checkZoneTransitions({ x: 0, y: 0, z: 0 });
      expect(activeZones).toHaveLength(0);
    });
  });

  // ── Zone Effects ──────────────────────────────────────────────────────
  describe('applyZoneEffects', () => {
    it('should apply gain modifier and occlusion to source in zone', () => {
      const mockGainNode = {
        gain: { setValueAtTime: vi.fn() },
      };
      const mockCtx = { currentTime: 1.0 } as unknown as AudioContext;

      manager.setAudioContext(mockCtx);
      manager.addAudioZone(
        createZone({
          id: 'z1',
          position: { x: 0, y: 0, z: 0 },
          radius: 10,
          gainModifier: 0.8,
          occlusion: 0.2,
        })
      );

      const source = createSource({
        position: { x: 0, y: 0, z: 0 },
        volume: 1.0,
        gainNode: mockGainNode as unknown as GainNode,
      });

      manager.applyZoneEffects(source);

      // adjustedVolume = volume * gainModifier * (1 - occlusion)
      // = 1.0 * 0.8 * 0.8 ≈ 0.64
      const [volume, time] = mockGainNode.gain.setValueAtTime.mock.calls[0] as [number, number];
      expect(volume).toBeCloseTo(0.64, 10);
      expect(time).toBe(1.0);
    });

    it('should not apply effects to source outside zone', () => {
      const mockGainNode = {
        gain: { setValueAtTime: vi.fn() },
      };
      const mockCtx = { currentTime: 0 } as unknown as AudioContext;

      manager.setAudioContext(mockCtx);
      manager.addAudioZone(
        createZone({
          position: { x: 0, y: 0, z: 0 },
          radius: 5,
        })
      );

      const source = createSource({
        position: { x: 100, y: 100, z: 100 },
        gainNode: mockGainNode as unknown as GainNode,
      });

      manager.applyZoneEffects(source);

      expect(mockGainNode.gain.setValueAtTime).not.toHaveBeenCalled();
    });
  });

  // ── Cleanup ──────────────────────────────────────────────────────────
  describe('destroy', () => {
    it('should remove all zones', () => {
      manager.addAudioZone(createZone({ id: 'z1' }));
      manager.addAudioZone(createZone({ id: 'z2' }));

      manager.destroy();

      expect(manager.getActiveZones()).toHaveLength(0);
    });
  });
});
