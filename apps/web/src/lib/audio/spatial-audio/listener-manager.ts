/**
 * Spatial Audio - Listener Manager
 *
 * Manages the AudioListener position/orientation and HRTF initialization.
 *
 * @version 3.0.0
 * @since v0.7.35
 */

import type { Position3D, Orientation3D } from '../spatialAudio.types';

// =============================================================================
// LISTENER MANAGER
// =============================================================================

export class ListenerManager {
  private listenerPosition: Position3D = { x: 0, y: 0, z: 0 };
  private listenerOrientation: Orientation3D = { yaw: 0, pitch: 0, roll: 0 };

  constructor(private getAudioContext: () => AudioContext | null) {}

  // ===========================================================================
  // HRTF
  // ===========================================================================

  async initializeHRTF(): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx) {
      const listener = ctx.listener;

      // Modern AudioListener API
      if (listener.positionX) {
        listener.positionX.value = 0;
        listener.positionY.value = 0;
        listener.positionZ.value = 0;
        listener.forwardX.value = 0;
        listener.forwardY.value = 0;
        listener.forwardZ.value = -1;
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
      }
    }
  }

  // ===========================================================================
  // LISTENER POSITION / ORIENTATION
  // ===========================================================================

  setListenerPosition(position: Position3D): void {
    this.listenerPosition = position;
    this.updateListener();
  }

  setListenerOrientation(orientation: Orientation3D): void {
    this.listenerOrientation = orientation;
    this.updateListener();
  }

  private updateListener(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const listener = ctx.listener;
    const { x, y, z } = this.listenerPosition;
    const { yaw, pitch } = this.listenerOrientation;

    // Calculate forward vector from orientation
    const forwardX = Math.sin(yaw) * Math.cos(pitch);
    const forwardY = Math.sin(pitch);
    const forwardZ = -Math.cos(yaw) * Math.cos(pitch);

    if (listener.positionX) {
      // Modern API
      const time = ctx.currentTime;
      listener.positionX.setValueAtTime(x, time);
      listener.positionY.setValueAtTime(y, time);
      listener.positionZ.setValueAtTime(z, time);
      listener.forwardX.setValueAtTime(forwardX, time);
      listener.forwardY.setValueAtTime(forwardY, time);
      listener.forwardZ.setValueAtTime(forwardZ, time);
    } else {
      // Legacy API
      listener.setPosition(x, y, z);
      listener.setOrientation(forwardX, forwardY, forwardZ, 0, 1, 0);
    }
  }
}
