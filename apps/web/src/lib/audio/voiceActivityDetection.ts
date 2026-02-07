/**
 * Voice Activity Detection (VAD) Processor
 *
 * Handles voice activity detection, audio analysis, and
 * the real-time analysis loop for audio sources.
 *
 * @version 3.0.0
 * @since v0.7.35
 */

import type { VoiceActivityState, AudioAnalysisResult } from './spatialAudio.types';

/**
 * Standalone VAD processor that manages voice activity detection
 * and audio analysis for multiple sources.
 */
export class VADProcessor {
  private vadState: Map<string, VoiceActivityState> = new Map();
  private analyserNodes: Map<string, AnalyserNode> = new Map();
  private animationFrameId: number | null = null;
  private vadEnabled: boolean;
  private audioContext: AudioContext | null = null;

  constructor(vadEnabled: boolean = true) {
    this.vadEnabled = vadEnabled;
  }

  // ===========================================================================
  // ANALYSER NODE MANAGEMENT
  // ===========================================================================

  registerAnalyser(id: string, analyser: AnalyserNode): void {
    this.analyserNodes.set(id, analyser);
  }

  unregisterAnalyser(id: string): void {
    this.analyserNodes.delete(id);
    this.vadState.delete(id);
  }

  // ===========================================================================
  // VAD STATE
  // ===========================================================================

  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
  }

  setVADEnabled(enabled: boolean): void {
    this.vadEnabled = enabled;
  }

  isUserSpeaking(id: string): boolean {
    const state = this.vadState.get(id);
    return state?.isSpeaking ?? false;
  }

  getSpeakingConfidence(id: string): number {
    const state = this.vadState.get(id);
    return state?.confidence ?? 0;
  }

  getVADStats(): { totalSources: number; activeSpeakers: number } {
    let activeSpeakers = 0;
    for (const [, state] of this.vadState) {
      if (state.isSpeaking) activeSpeakers++;
    }
    return { totalSources: this.vadState.size, activeSpeakers };
  }

  getVoiceActivityState(id: string): VoiceActivityState | null {
    return this.vadState.get(id) || null;
  }

  // ===========================================================================
  // ANALYSIS LOOP
  // ===========================================================================

  startVAD(): void {
    if (this.animationFrameId) return;

    const analyze = () => {
      this.processVAD();
      this.animationFrameId = requestAnimationFrame(analyze);
    };

    analyze();
  }

  stopVAD(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  processVAD(): void {
    for (const [id] of this.analyserNodes) {
      const analysis = this.analyzeSource(id);
      if (analysis && this.vadEnabled) {
        this.vadState.set(id, analysis.voiceActivity);
      }
    }
  }

  // ===========================================================================
  // SOURCE ANALYSIS
  // ===========================================================================

  analyzeSource(id: string): AudioAnalysisResult | null {
    const analyser = this.analyserNodes.get(id);
    if (!analyser) return null;

    const frequencyData = new Float32Array(analyser.frequencyBinCount);
    const waveformData = new Float32Array(analyser.fftSize);

    analyser.getFloatFrequencyData(frequencyData);
    analyser.getFloatTimeDomainData(waveformData);

    // Calculate RMS
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

    // Calculate dominant frequency
    let maxMagnitude = -Infinity;
    let dominantBin = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const freq = frequencyData[i];
      if (freq !== undefined && freq > maxMagnitude) {
        maxMagnitude = freq;
        dominantBin = i;
      }
    }
    const sampleRate = this.audioContext?.sampleRate || 48000;
    const dominantFrequency = (dominantBin * sampleRate) / (analyser.fftSize * 2);

    // Voice activity detection
    const voiceActivity = this.detectVoiceActivity(rms, dominantFrequency);

    return {
      rms,
      peak,
      frequency: frequencyData,
      waveform: waveformData,
      voiceActivity,
    };
  }

  private detectVoiceActivity(rms: number, frequency: number): VoiceActivityState {
    // Simple VAD based on energy and frequency
    // Human voice range: ~85-300 Hz (fundamental)
    const isVoiceFrequency = frequency >= 85 && frequency <= 400;
    const hasEnergy = rms > 0.01;

    const isSpeaking = hasEnergy && isVoiceFrequency;
    const confidence = isSpeaking ? Math.min(1, rms * 10) : 0;

    return {
      isSpeaking,
      confidence,
      volume: rms,
      frequency,
    };
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  destroy(): void {
    this.stopVAD();
    this.vadState.clear();
    this.analyserNodes.clear();
    this.audioContext = null;
  }
}
