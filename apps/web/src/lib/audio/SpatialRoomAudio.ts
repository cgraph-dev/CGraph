/**
 * Spatial Audio Room
 *
 * High-level abstraction for VR/AR chat environments,
 * managing users in a spatial audio room.
 *
 * @version 3.0.0
 * @since v0.7.35
 */

import type {
  Position3D,
  Orientation3D,
  AudioZone,
  VoiceActivityState,
  SpatialAudioConfig,
} from './spatialAudio.types';
// Import directly from engine-core to avoid circular dep through barrel
import { SpatialAudioEngine } from './spatial-audio/engine-core';

/**
 * Spatial audio room for VR/AR chat environments
 */
export class SpatialAudioRoom {
  private engine: SpatialAudioEngine;
  private roomId: string;
  private users: Map<string, { sourceId: string; position: Position3D }> = new Map();

  constructor(roomId: string, config?: Partial<SpatialAudioConfig>) {
    this.roomId = roomId;
    this.engine = new SpatialAudioEngine(config);
  }

  async initialize(): Promise<void> {
    await this.engine.initialize();
  }

  async addUser(userId: string, stream: MediaStream, position: Position3D): Promise<void> {
    const sourceId = `${this.roomId}-${userId}`;
    await this.engine.addAudioSource(sourceId, stream, position, { userId });
    this.users.set(userId, { sourceId, position });
  }

  removeUser(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      this.engine.removeAudioSource(user.sourceId);
      this.users.delete(userId);
    }
  }

  updateUserPosition(userId: string, position: Position3D): void {
    const user = this.users.get(userId);
    if (user) {
      user.position = position;
      this.engine.updateSourcePosition(user.sourceId, position);
    }
  }

  setListenerUser(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      this.engine.setListenerPosition(user.position);
    }
  }

  setListenerPosition(position: Position3D, orientation?: Orientation3D): void {
    this.engine.setListenerPosition(position);
    if (orientation) {
      this.engine.setListenerOrientation(orientation);
    }
  }

  addZone(zone: AudioZone): void {
    this.engine.addZone(zone);
  }

  getUserVoiceActivity(userId: string): VoiceActivityState | null {
    const user = this.users.get(userId);
    return user ? this.engine.getVoiceActivityState(user.sourceId) : null;
  }

  destroy(): void {
    this.engine.destroy();
    this.users.clear();
  }
}
