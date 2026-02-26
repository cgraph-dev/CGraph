/**
 * Spatial Audio Engine - Core
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

import type {
  Position3D,
  Orientation3D,
  AudioSource,
  AudioZone,
  VoiceActivityState,
  SpatialAudioConfig,
  AudioAnalysisResult,
} from '../spatialAudio.types';
import { DEFAULT_SPATIAL_CONFIG } from '../spatialAudio.constants';
import { VADProcessor } from '../voiceActivityDetection';
import { AudioZoneManager } from '../audioZoneManager';
import { AudioSourceManager } from './source-manager';
import { ListenerManager } from './listener-manager';

import { createLogger } from '@/lib/logger';

const logger = createLogger('SpatialAudio');

// =============================================================================
// SPATIAL AUDIO ENGINE
// =============================================================================

/**
 * Spatial Audio Engine class.
 */
export class SpatialAudioEngine {
  private audioContext: AudioContext | null = null;
  private config: SpatialAudioConfig;

  // Delegates
  private vadProcessor: VADProcessor;
  private zoneManager: AudioZoneManager;
  private sourceManager: AudioSourceManager;
  private listenerManager: ListenerManager;

  // Master nodes
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  constructor(config: Partial<SpatialAudioConfig> = {}) {
    this.config = { ...DEFAULT_SPATIAL_CONFIG, ...config };
    this.vadProcessor = new VADProcessor(this.config.enableVAD);
    this.zoneManager = new AudioZoneManager();
    this.sourceManager = new AudioSourceManager(
      () => this.audioContext,
      () => this.masterGain,
      this.vadProcessor,
      this.config
    );
    this.listenerManager = new ListenerManager(() => this.audioContext);
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initializes ialize.
   * @returns The result.
   */
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
      await this.listenerManager.initializeHRTF();
    }

    // Start analysis loop (delegated to VADProcessor)
    this.vadProcessor.startVAD();

    logger.debug(' Engine initialized');
  }

  // ===========================================================================
  // LISTENER MANAGEMENT (delegated to ListenerManager)
  // ===========================================================================

  /**
   * Updates listener position.
   *
   * @param position - The position.
   * @returns The result.
   */
  setListenerPosition(position: Position3D): void {
    this.listenerManager.setListenerPosition(position);
  }

  /**
   * Updates listener orientation.
   *
   * @param orientation - The orientation.
   * @returns The result.
   */
  setListenerOrientation(orientation: Orientation3D): void {
    this.listenerManager.setListenerOrientation(orientation);
  }

  // ===========================================================================
  // AUDIO SOURCE MANAGEMENT (delegated to AudioSourceManager)
  // ===========================================================================

  /**
   * add Audio Source for the audio module.
   *
   * @param id - Unique identifier.
   * @param stream - The stream.
   * @param position - The position.
   * @param options - Configuration options.
   */
  async addAudioSource(
    id: string,
    stream: MediaStream,
    position: Position3D,
    options: Partial<AudioSource> = {}
  ): Promise<AudioSource> {
    if (!this.audioContext) {
      await this.initialize();
    }
    return this.sourceManager.addAudioSource(id, stream, position, options);
  }

  /**
   * Removes audio source.
   *
   * @param id - Unique identifier.
   * @returns The result.
   */
  removeAudioSource(id: string): void {
    this.sourceManager.removeAudioSource(id);
  }

  /**
   * Updates source position.
   *
   * @param id - Unique identifier.
   * @param position - The position.
   * @returns The result.
   */
  updateSourcePosition(id: string, position: Position3D): void {
    this.sourceManager.updateSourcePosition(id, position, (source) => {
      this.zoneManager.applyZoneEffects(source);
    });
  }

  /**
   * Updates source volume.
   *
   * @param id - Unique identifier.
   * @param volume - The volume.
   * @returns The result.
   */
  setSourceVolume(id: string, volume: number): void {
    this.sourceManager.setSourceVolume(id, volume);
  }

  /**
   * Updates source muted.
   *
   * @param id - Unique identifier.
   * @param muted - The muted.
   * @returns The result.
   */
  setSourceMuted(id: string, muted: boolean): void {
    this.sourceManager.setSourceMuted(id, muted);
  }

  // ===========================================================================
  // AUDIO ZONES (delegated to AudioZoneManager)
  // ===========================================================================

  /**
   * add Zone for the audio module.
   *
   * @param zone - The zone.
   * @returns The result.
   */
  addZone(zone: AudioZone): void {
    this.zoneManager.addAudioZone(zone);
  }

  /**
   * Removes zone.
   *
   * @param id - Unique identifier.
   * @returns The result.
   */
  removeZone(id: string): void {
    this.zoneManager.removeAudioZone(id);
  }

  // ===========================================================================
  // VOICE ACTIVITY DETECTION (delegated to VADProcessor)
  // ===========================================================================

  /**
   * analyze Source for the audio module.
   *
   * @param id - Unique identifier.
   * @returns The result.
   */
  analyzeSource(id: string): AudioAnalysisResult | null {
    return this.vadProcessor.analyzeSource(id);
  }

  /**
   * Retrieves voice activity state.
   *
   * @param id - Unique identifier.
   * @returns The voice activity state.
   */
  getVoiceActivityState(id: string): VoiceActivityState | null {
    return this.vadProcessor.getVoiceActivityState(id);
  }

  // ===========================================================================
  // NOISE CANCELLATION
  // ===========================================================================

  /**
   * enable Noise Cancellation for the audio module.
   *
   * @param stream - The stream.
   * @returns The result.
   */
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

  /**
   * Updates master volume.
   *
   * @param volume - The volume.
   * @returns The result.
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain && this.audioContext) {
      const safeVolume = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setValueAtTime(safeVolume, this.audioContext.currentTime);
    }
  }

  /**
   * Retrieves master analysis.
   * @returns The master analysis.
   */
  getMasterAnalysis(): AudioAnalysisResult | null {
    return this.sourceManager.getMasterAnalysis(this.masterAnalyser);
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * destroy for the audio module.
   * @returns The result.
   */
  destroy(): void {
    this.vadProcessor.destroy();
    this.zoneManager.destroy();

    // Disconnect all sources
    this.sourceManager.removeAllSources();

    // Close audio context
    this.audioContext?.close();
    this.audioContext = null;

    logger.debug(' Engine destroyed');
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Retrieves sources.
   * @returns The sources.
   */
  getSources(): Map<string, AudioSource> {
    return this.sourceManager.getSources();
  }

  /**
   * Retrieves zones.
   * @returns The zones.
   */
  getZones(): Map<string, AudioZone> {
    return this.zoneManager.getZones();
  }

  /**
   * Retrieves config.
   * @returns The config.
   */
  getConfig(): SpatialAudioConfig {
    return { ...this.config };
  }

  /**
   * Updates config.
   *
   * @param config - Configuration object.
   * @returns The result.
   */
  updateConfig(config: Partial<SpatialAudioConfig>): void {
    this.config = { ...this.config, ...config };
    this.vadProcessor.setVADEnabled(this.config.enableVAD);
    this.sourceManager.updateConfig(this.config);
  }
}
