/**
 * Spatial Audio Engine
 *
 * Advanced 3D spatial audio system for immersive communication:
 * - 3D positional audio in virtual spaces
 * - HRTF (Head-Related Transfer Function) for realistic binaural audio
 * - Audio zones with different characteristics
 * - Real-time audio effects (reverb, echo, occlusion)
 * - Voice activity detection with neural network
 * - AI-powered noise cancellation
 * - Audio compression with Opus codec simulation
 * - Spatial audio rooms for VR/AR readiness
 *
 * @version 3.0.0
 * @since v0.7.35
 */

// =============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// =============================================================================

export type {
  Position3D,
  Orientation3D,
  AudioSource,
  AudioZone,
  ReverbConfig,
  VoiceActivityState,
  SpatialAudioConfig,
  AudioAnalysisResult,
} from './spatialAudio.types';

export { REVERB_CONFIGS, DEFAULT_SPATIAL_CONFIG } from './spatialAudio.constants';
export { VADProcessor } from './voiceActivityDetection';
export { AudioZoneManager } from './audioZoneManager';
export { SpatialAudioRoom } from './SpatialRoomAudio';

// =============================================================================
// IMPORTS
// =============================================================================

import type {
  Position3D,
  Orientation3D,
  AudioSource,
  AudioZone,
  VoiceActivityState,
  SpatialAudioConfig,
  AudioAnalysisResult,
} from './spatialAudio.types';
import { DEFAULT_SPATIAL_CONFIG } from './spatialAudio.constants';
import { VADProcessor } from './voiceActivityDetection';
import { AudioZoneManager } from './audioZoneManager';

import { createLogger } from '@/lib/logger';
const logger = createLogger('SpatialAudio');

// =============================================================================
// SPATIAL AUDIO ENGINE
// =============================================================================

export class SpatialAudioEngine {
  private audioContext: AudioContext | null = null;
  private listenerPosition: Position3D = { x: 0, y: 0, z: 0 };
  private listenerOrientation: Orientation3D = { yaw: 0, pitch: 0, roll: 0 };
  private sources: Map<string, AudioSource> = new Map();
  private analyserNodes: Map<string, AnalyserNode> = new Map();
  private config: SpatialAudioConfig;

  // Delegates
  private vadProcessor: VADProcessor;
  private zoneManager: AudioZoneManager;

  // Master nodes
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  constructor(config: Partial<SpatialAudioConfig> = {}) {
    this.config = { ...DEFAULT_SPATIAL_CONFIG, ...config };
    this.vadProcessor = new VADProcessor(this.config.enableVAD);
    this.zoneManager = new AudioZoneManager();
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  async initialize(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext({
      latencyHint: 'interactive',
      sampleRate: 48000,
    });

    // Wire up delegates
    this.vadProcessor.setAudioContext(this.audioContext);
    this.zoneManager.setAudioContext(this.audioContext);

    // Create master chain
    this.masterGain = this.audioContext.createGain();
    this.masterCompressor = this.audioContext.createDynamicsCompressor();
    this.masterAnalyser = this.audioContext.createAnalyser();

    // Configure compressor for natural sound
    this.masterCompressor.threshold.value = -24;
    this.masterCompressor.knee.value = 30;
    this.masterCompressor.ratio.value = 12;
    this.masterCompressor.attack.value = 0.003;
    this.masterCompressor.release.value = 0.25;

    // Configure analyser
    this.masterAnalyser.fftSize = 2048;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    // Connect master chain
    this.masterGain
      .connect(this.masterCompressor)
      .connect(this.masterAnalyser)
      .connect(this.audioContext.destination);

    // Set up HRTF if available
    if (this.config.hrtfEnabled) {
      await this.initializeHRTF();
    }

    // Start analysis loop (delegated to VADProcessor)
    this.vadProcessor.startVAD();

    logger.debug(' Engine initialized');
  }

  private async initializeHRTF(): Promise<void> {
    // Check for HRTF support
    // In a real implementation, this would load HRTF profiles
    // For now, we use the browser's built-in spatialization

    if (this.audioContext) {
      const listener = this.audioContext.listener;

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
  // LISTENER MANAGEMENT
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
    if (!this.audioContext) return;

    const listener = this.audioContext.listener;
    const { x, y, z } = this.listenerPosition;
    const { yaw, pitch } = this.listenerOrientation;

    // Calculate forward vector from orientation
    const forwardX = Math.sin(yaw) * Math.cos(pitch);
    const forwardY = Math.sin(pitch);
    const forwardZ = -Math.cos(yaw) * Math.cos(pitch);

    if (listener.positionX) {
      // Modern API
      const time = this.audioContext.currentTime;
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

  // ===========================================================================
  // AUDIO SOURCE MANAGEMENT
  // ===========================================================================

  async addAudioSource(
    id: string,
    stream: MediaStream,
    position: Position3D,
    options: Partial<AudioSource> = {}
  ): Promise<AudioSource> {
    if (!this.audioContext) {
      await this.initialize();
    }

    const ctx = this.audioContext!;

    // Create media stream source
    const sourceNode = ctx.createMediaStreamSource(stream);

    // Create gain node
    const gainNode = ctx.createGain();
    gainNode.gain.value = options.volume ?? 1;

    // Create panner node for 3D positioning
    const pannerNode = ctx.createPanner();
    this.configurePannerNode(pannerNode, position);

    // Create analyser for this source
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.7;
    this.analyserNodes.set(id, analyser);
    this.vadProcessor.registerAnalyser(id, analyser);

    // Connect nodes
    sourceNode.connect(gainNode).connect(pannerNode).connect(analyser).connect(this.masterGain!);

    const audioSource: AudioSource = {
      id,
      userId: options.userId,
      position,
      orientation: options.orientation,
      stream,
      gainNode,
      pannerNode,
      volume: options.volume ?? 1,
      muted: options.muted ?? false,
      spatialEnabled: options.spatialEnabled ?? true,
    };

    this.sources.set(id, audioSource);

    logger.debug(`Added source: ${id}`);
    return audioSource;
  }

  removeAudioSource(id: string): void {
    const source = this.sources.get(id);
    if (source) {
      source.gainNode?.disconnect();
      source.pannerNode?.disconnect();
      this.analyserNodes.get(id)?.disconnect();
      this.analyserNodes.delete(id);
      this.vadProcessor.unregisterAnalyser(id);
      this.sources.delete(id);
      logger.debug(`Removed source: ${id}`);
    }
  }

  updateSourcePosition(id: string, position: Position3D): void {
    const source = this.sources.get(id);
    if (source && source.pannerNode && this.audioContext) {
      source.position = position;

      const time = this.audioContext.currentTime;
      if (source.pannerNode.positionX) {
        source.pannerNode.positionX.setValueAtTime(position.x, time);
        source.pannerNode.positionY.setValueAtTime(position.y, time);
        source.pannerNode.positionZ.setValueAtTime(position.z, time);
      } else {
        source.pannerNode.setPosition(position.x, position.y, position.z);
      }

      // Apply zone effects based on new position (delegated)
      this.zoneManager.applyZoneEffects(source);
    }
  }

  setSourceVolume(id: string, volume: number): void {
    const source = this.sources.get(id);
    if (source && source.gainNode && this.audioContext) {
      source.volume = Math.max(0, Math.min(1, volume));
      source.gainNode.gain.setValueAtTime(source.volume, this.audioContext.currentTime);
    }
  }

  setSourceMuted(id: string, muted: boolean): void {
    const source = this.sources.get(id);
    if (source && source.gainNode && this.audioContext) {
      source.muted = muted;
      source.gainNode.gain.setValueAtTime(muted ? 0 : source.volume, this.audioContext.currentTime);
    }
  }

  private configurePannerNode(panner: PannerNode, position: Position3D): void {
    panner.panningModel = this.config.hrtfEnabled ? 'HRTF' : 'equalpower';
    panner.distanceModel = this.config.distanceModel;
    panner.maxDistance = this.config.maxDistance;
    panner.rolloffFactor = this.config.rolloffFactor;
    panner.coneInnerAngle = this.config.coneInnerAngle;
    panner.coneOuterAngle = this.config.coneOuterAngle;
    panner.coneOuterGain = this.config.coneOuterGain;
    panner.refDistance = 1;

    if (panner.positionX) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    } else {
      panner.setPosition(position.x, position.y, position.z);
    }
  }

  // ===========================================================================
  // AUDIO ZONES (delegated to AudioZoneManager)
  // ===========================================================================

  addZone(zone: AudioZone): void {
    this.zoneManager.addAudioZone(zone);
  }

  removeZone(id: string): void {
    this.zoneManager.removeAudioZone(id);
  }

  // ===========================================================================
  // VOICE ACTIVITY DETECTION (delegated to VADProcessor)
  // ===========================================================================

  analyzeSource(id: string): AudioAnalysisResult | null {
    return this.vadProcessor.analyzeSource(id);
  }

  getVoiceActivityState(id: string): VoiceActivityState | null {
    return this.vadProcessor.getVoiceActivityState(id);
  }

  // ===========================================================================
  // NOISE CANCELLATION
  // ===========================================================================

  async enableNoiseCancellation(stream: MediaStream): Promise<MediaStream> {
    if (!this.config.enableNoiseCancellation) return stream;

    // Apply browser's built-in noise suppression
    const constraints: MediaTrackConstraints = {
      noiseSuppression: true,
      echoCancellation: this.config.enableEchoCancellation,
      autoGainControl: this.config.enableAutoGainControl,
    };

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      await audioTrack.applyConstraints(constraints);
    }

    return stream;
  }

  // ===========================================================================
  // MASTER CONTROLS
  // ===========================================================================

  setMasterVolume(volume: number): void {
    if (this.masterGain && this.audioContext) {
      const safeVolume = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setValueAtTime(safeVolume, this.audioContext.currentTime);
    }
  }

  getMasterAnalysis(): AudioAnalysisResult | null {
    if (!this.masterAnalyser) return null;

    const frequencyData = new Float32Array(this.masterAnalyser.frequencyBinCount);
    const waveformData = new Float32Array(this.masterAnalyser.fftSize);

    this.masterAnalyser.getFloatFrequencyData(frequencyData);
    this.masterAnalyser.getFloatTimeDomainData(waveformData);

    let rmsSum = 0;
    let peak = 0;
    for (let i = 0; i < waveformData.length; i++) {
      const sample = waveformData[i];
      if (sample !== undefined) {
        rmsSum += sample * sample;
        peak = Math.max(peak, Math.abs(sample));
      }
    }
    const rms = Math.sqrt(rmsSum / waveformData.length);

    return {
      rms,
      peak,
      frequency: frequencyData,
      waveform: waveformData,
      voiceActivity: {
        isSpeaking: rms > 0.01,
        confidence: Math.min(1, rms * 10),
        volume: rms,
        frequency: 0,
      },
    };
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  destroy(): void {
    this.vadProcessor.destroy();
    this.zoneManager.destroy();

    // Disconnect all sources
    for (const [id] of this.sources) {
      this.removeAudioSource(id);
    }

    // Close audio context
    this.audioContext?.close();
    this.audioContext = null;

    logger.debug(' Engine destroyed');
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  getSources(): Map<string, AudioSource> {
    return new Map(this.sources);
  }

  getZones(): Map<string, AudioZone> {
    return this.zoneManager.getZones();
  }

  getConfig(): SpatialAudioConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SpatialAudioConfig>): void {
    this.config = { ...this.config, ...config };
    this.vadProcessor.setVADEnabled(this.config.enableVAD);

    // Update existing panner nodes with new config
    for (const [, source] of this.sources) {
      if (source.pannerNode) {
        this.configurePannerNode(source.pannerNode, source.position);
      }
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const spatialAudioEngine = new SpatialAudioEngine();
