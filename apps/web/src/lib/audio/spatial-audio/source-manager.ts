/**
 * Spatial Audio - Source Manager
 *
 * Manages audio sources: adding, removing, positioning, volume, and muting.
 *
 * @version 3.0.0
 * @since v0.7.35
 */

import type {
  Position3D,
  AudioSource,
  AudioAnalysisResult,
  SpatialAudioConfig,
} from '../spatialAudio.types';
import { VADProcessor } from '../voiceActivityDetection';

import { createLogger } from '@/lib/logger';

const logger = createLogger('SpatialAudio:SourceManager');

// =============================================================================
// AUDIO SOURCE MANAGEMENT
// =============================================================================

export class AudioSourceManager {
  private sources: Map<string, AudioSource> = new Map();
  private analyserNodes: Map<string, AnalyserNode> = new Map();

  constructor(
    private getAudioContext: () => AudioContext | null,
    private getMasterGain: () => GainNode | null,
    private vadProcessor: VADProcessor,
    private config: SpatialAudioConfig
  ) {}

  // ===========================================================================
  // ADD / REMOVE SOURCES
  // ===========================================================================

  async addAudioSource(
    id: string,
    stream: MediaStream,
    position: Position3D,
    options: Partial<AudioSource> = {}
  ): Promise<AudioSource> {
    const ctx = this.getAudioContext();
    if (!ctx) {
      throw new Error('AudioContext not initialized');
    }

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
    const masterGain = this.getMasterGain();
    if (masterGain) {
      sourceNode.connect(gainNode).connect(pannerNode).connect(analyser).connect(masterGain);
    }

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

  // ===========================================================================
  // POSITION / VOLUME / MUTE
  // ===========================================================================

  updateSourcePosition(
    id: string,
    position: Position3D,
    applyZoneEffects: (source: AudioSource) => void
  ): void {
    const source = this.sources.get(id);
    const ctx = this.getAudioContext();
    if (source && source.pannerNode && ctx) {
      source.position = position;

      const time = ctx.currentTime;
      if (source.pannerNode.positionX) {
        source.pannerNode.positionX.setValueAtTime(position.x, time);
        source.pannerNode.positionY.setValueAtTime(position.y, time);
        source.pannerNode.positionZ.setValueAtTime(position.z, time);
      } else {
        source.pannerNode.setPosition(position.x, position.y, position.z);
      }

      // Apply zone effects based on new position (delegated)
      applyZoneEffects(source);
    }
  }

  setSourceVolume(id: string, volume: number): void {
    const source = this.sources.get(id);
    const ctx = this.getAudioContext();
    if (source && source.gainNode && ctx) {
      source.volume = Math.max(0, Math.min(1, volume));
      source.gainNode.gain.setValueAtTime(source.volume, ctx.currentTime);
    }
  }

  setSourceMuted(id: string, muted: boolean): void {
    const source = this.sources.get(id);
    const ctx = this.getAudioContext();
    if (source && source.gainNode && ctx) {
      source.muted = muted;
      source.gainNode.gain.setValueAtTime(muted ? 0 : source.volume, ctx.currentTime);
    }
  }

  // ===========================================================================
  // PANNER CONFIGURATION
  // ===========================================================================

  configurePannerNode(panner: PannerNode, position: Position3D): void {
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
  // MASTER ANALYSIS
  // ===========================================================================

  getMasterAnalysis(masterAnalyser: AnalyserNode | null): AudioAnalysisResult | null {
    if (!masterAnalyser) return null;

    const frequencyData = new Float32Array(masterAnalyser.frequencyBinCount);
    const waveformData = new Float32Array(masterAnalyser.fftSize);

    masterAnalyser.getFloatFrequencyData(frequencyData);
    masterAnalyser.getFloatTimeDomainData(waveformData);

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
  // ACCESSORS
  // ===========================================================================

  getSources(): Map<string, AudioSource> {
    return new Map(this.sources);
  }

  updateConfig(config: SpatialAudioConfig): void {
    this.config = config;
    // Update existing panner nodes with new config
    for (const [, source] of this.sources) {
      if (source.pannerNode) {
        this.configurePannerNode(source.pannerNode, source.position);
      }
    }
  }

  removeAllSources(): void {
    for (const [id] of this.sources) {
      this.removeAudioSource(id);
    }
  }
}
