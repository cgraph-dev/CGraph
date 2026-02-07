/**
 * Audio Zone Manager
 *
 * Manages audio zones with different reverb, occlusion, and gain
 * characteristics for spatial audio environments.
 *
 * @version 3.0.0
 * @since v0.7.35
 */

import type { AudioZone, AudioSource, Position3D, ReverbConfig } from './spatialAudio.types';
import { REVERB_CONFIGS } from './spatialAudio.constants';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AudioZoneManager');

/**
 * Standalone manager for audio zones with reverb, occlusion,
 * and gain modification capabilities.
 */
export class AudioZoneManager {
  private zones: Map<string, AudioZone> = new Map();
  private convolverNodes: Map<string, ConvolverNode> = new Map();
  private audioContext: AudioContext | null = null;

  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
  }

  // ===========================================================================
  // ZONE CRUD
  // ===========================================================================

  addAudioZone(zone: AudioZone): void {
    this.zones.set(zone.id, zone);

    // Create reverb convolver for this zone if reverb is enabled
    if (zone.reverb.enabled && this.audioContext) {
      const convolver = this.createReverbConvolver(zone.reverb);
      this.convolverNodes.set(zone.id, convolver);
    }

    logger.debug(`Added zone: ${zone.name}`);
  }

  removeAudioZone(id: string): void {
    this.convolverNodes.get(id)?.disconnect();
    this.convolverNodes.delete(id);
    this.zones.delete(id);
  }

  updateAudioZone(id: string, updates: Partial<AudioZone>): void {
    const zone = this.zones.get(id);
    if (!zone) return;

    const updated = { ...zone, ...updates, id }; // id cannot be changed
    this.zones.set(id, updated);

    // Re-create convolver if reverb config changed
    if (updates.reverb && this.audioContext) {
      this.convolverNodes.get(id)?.disconnect();
      if (updated.reverb.enabled) {
        const convolver = this.createReverbConvolver(updated.reverb);
        this.convolverNodes.set(id, convolver);
      } else {
        this.convolverNodes.delete(id);
      }
    }
  }

  getActiveZones(): AudioZone[] {
    return Array.from(this.zones.values());
  }

  getZones(): Map<string, AudioZone> {
    return new Map(this.zones);
  }

  // ===========================================================================
  // ZONE TRANSITIONS & EFFECTS
  // ===========================================================================

  checkZoneTransitions(position: Position3D): AudioZone[] {
    const activeZones: AudioZone[] = [];
    for (const [, zone] of this.zones) {
      const distance = this.calculateDistance(position, zone.position);
      if (distance <= zone.radius) {
        activeZones.push(zone);
      }
    }
    return activeZones;
  }

  applyZoneEffects(source: AudioSource): void {
    // Find which zones the source is in
    for (const [, zone] of this.zones) {
      const distance = this.calculateDistance(source.position, zone.position);

      if (distance <= zone.radius) {
        // Source is in this zone, apply effects
        if (source.gainNode && this.audioContext) {
          const adjustedVolume = source.volume * zone.gainModifier * (1 - zone.occlusion);
          source.gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);
        }

        // Apply reverb if enabled
        const convolver = this.convolverNodes.get(zone.id);
        if (convolver && source.pannerNode) {
          // Route through convolver based on wet/dry mix
          // (simplified - full implementation would use a mixer)
        }
      }
    }
  }

  // ===========================================================================
  // INTERNALS
  // ===========================================================================

  private createReverbConvolver(config: ReverbConfig): ConvolverNode {
    const ctx = this.audioContext!;
    const convolver = ctx.createConvolver();

    // Generate impulse response
    const reverbParams = REVERB_CONFIGS[config.type] || REVERB_CONFIGS.room;
    if (!reverbParams) {
      return convolver;
    }

    const duration = config.decay;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;

    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with noise
        const decay = Math.pow(1 - i / length, reverbParams.decay);
        const noise = (Math.random() * 2 - 1) * reverbParams.density;
        channelData[i] = noise * decay * reverbParams.diffusion;
      }
    }

    convolver.buffer = impulse;
    return convolver;
  }

  private calculateDistance(a: Position3D, b: Position3D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  destroy(): void {
    for (const [id] of this.zones) {
      this.removeAudioZone(id);
    }
    this.audioContext = null;
  }
}
