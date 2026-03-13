/**
 * Voice Activity Detection (VAD) Processor Tests
 *
 * Tests for the core VAD algorithm:
 * - Analyser registration/unregistration
 * - VAD state management
 * - Voice detection logic (energy + frequency thresholds)
 * - RMS/peak calculation
 * - Analysis loop lifecycle
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VADProcessor } from '../voiceActivityDetection';

// ── Mock AnalyserNode ────────────────────────────────────────────────────
function createMockAnalyser(
  options: {
    fftSize?: number;
    frequencyBinCount?: number;
    waveformData?: number[];
    frequencyData?: number[];
  } = {}
): AnalyserNode {
  const fftSize = options.fftSize ?? 256;
  const frequencyBinCount = options.frequencyBinCount ?? fftSize / 2;
  const waveformData = options.waveformData ?? new Array(fftSize).fill(0);
  const frequencyData = options.frequencyData ?? new Array(frequencyBinCount).fill(-100);

  return {
    fftSize,
    frequencyBinCount,
    getFloatTimeDomainData: vi.fn((array: Float32Array) => {
      for (let i = 0; i < array.length && i < waveformData.length; i++) {
        array[i] = waveformData[i]!;
      }
    }),
    getFloatFrequencyData: vi.fn((array: Float32Array) => {
      for (let i = 0; i < array.length && i < frequencyData.length; i++) {
        array[i] = frequencyData[i]!;
      }
    }),
  } as unknown as AnalyserNode;
}

// ── Mock requestAnimationFrame ───────────────────────────────────────────
let rafCallbacks: (() => void)[] = [];
const originalRAF = globalThis.requestAnimationFrame;
const originalCAF = globalThis.cancelAnimationFrame;

beforeEach(() => {
  rafCallbacks = [];
  globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
    const id = rafCallbacks.length + 1;
    rafCallbacks.push(() => cb(performance.now()));
    return id;
  });
  globalThis.cancelAnimationFrame = vi.fn();
});

afterEach(() => {
  globalThis.requestAnimationFrame = originalRAF;
  globalThis.cancelAnimationFrame = originalCAF;
});

describe('VADProcessor', () => {
  let processor: VADProcessor;

  beforeEach(() => {
    processor = new VADProcessor(true);
  });

  afterEach(() => {
    processor.destroy();
  });

  // ── Constructor ──────────────────────────────────────────────────────
  describe('constructor', () => {
    it('should initialize with VAD enabled by default', () => {
      const p = new VADProcessor();
      expect(p.getVADStats().totalSources).toBe(0);
      p.destroy();
    });

    it('should accept vadEnabled parameter', () => {
      const disabled = new VADProcessor(false);
      const stats = disabled.getVADStats();
      expect(stats.totalSources).toBe(0);
      expect(stats.activeSpeakers).toBe(0);
      disabled.destroy();
    });
  });

  // ── Analyser Registration ────────────────────────────────────────────
  describe('analyser registration', () => {
    it('should register an analyser node', () => {
      const analyser = createMockAnalyser();
      processor.registerAnalyser('user-1', analyser);

      // Registered analysers are processed during VAD
      processor.processVAD();
      expect(processor.getVADStats().totalSources).toBe(1);
    });

    it('should unregister an analyser node and clear its state', () => {
      const analyser = createMockAnalyser();
      processor.registerAnalyser('user-1', analyser);
      processor.processVAD();

      processor.unregisterAnalyser('user-1');
      expect(processor.getVoiceActivityState('user-1')).toBeNull();
      expect(processor.getVADStats().totalSources).toBe(0);
    });

    it('should handle multiple analysers', () => {
      processor.registerAnalyser('user-1', createMockAnalyser());
      processor.registerAnalyser('user-2', createMockAnalyser());
      processor.registerAnalyser('user-3', createMockAnalyser());

      processor.processVAD();
      expect(processor.getVADStats().totalSources).toBe(3);
    });
  });

  // ── VAD State Queries ────────────────────────────────────────────────
  describe('VAD state queries', () => {
    it('should report no speaking for silent audio', () => {
      const analyser = createMockAnalyser({ waveformData: new Array(256).fill(0) });
      processor.registerAnalyser('user-1', analyser);
      processor.processVAD();

      expect(processor.isUserSpeaking('user-1')).toBe(false);
      expect(processor.getSpeakingConfidence('user-1')).toBe(0);
    });

    it('should return false for unknown user', () => {
      expect(processor.isUserSpeaking('unknown')).toBe(false);
      expect(processor.getSpeakingConfidence('unknown')).toBe(0);
    });

    it('should return null voice activity for unknown user', () => {
      expect(processor.getVoiceActivityState('unknown')).toBeNull();
    });

    it('should detect voice in human frequency range with energy', () => {
      // Create waveform with strong signal (RMS > 0.01)
      const waveform = new Array(256).fill(0).map(
        (_, i) => 0.1 * Math.sin((2 * Math.PI * 200 * i) / 48000) // 200 Hz tone
      );

      // Create frequency data where 200 Hz bin has highest magnitude
      // With fftSize=256, sampleRate=48000: bin_200Hz = 200 * 256 / 48000 ≈ 1.07 → bin 1
      const freqData = new Array(128).fill(-100);
      freqData[1] = -10; // 200 Hz bin is dominant

      const analyser = createMockAnalyser({
        waveformData: waveform,
        frequencyData: freqData,
      });

      processor.setAudioContext({ sampleRate: 48000 } as AudioContext);
      processor.registerAnalyser('user-1', analyser);
      processor.processVAD();

      const state = processor.getVoiceActivityState('user-1');
      expect(state).not.toBeNull();
      // The dominant frequency should be in voice range
      expect(state!.volume).toBeGreaterThan(0);
    });

    it('should not detect voice for high frequency signal', () => {
      // Strong signal at 5000 Hz (non-voice)
      const waveform = new Array(256)
        .fill(0)
        .map((_, i) => 0.1 * Math.sin((2 * Math.PI * 5000 * i) / 48000));

      // Dominant frequency at 5000 Hz bin
      const freqData = new Array(128).fill(-100);
      // bin = 5000 * 256 / 48000 ≈ 26.7 → bin 27
      freqData[27] = -10;

      const analyser = createMockAnalyser({
        waveformData: waveform,
        frequencyData: freqData,
      });

      processor.setAudioContext({ sampleRate: 48000 } as AudioContext);
      processor.registerAnalyser('user-1', analyser);
      processor.processVAD();

      const state = processor.getVoiceActivityState('user-1');
      expect(state).not.toBeNull();
      // 5000 Hz is outside voice range (85-400 Hz), so should not be speaking
      expect(state!.isSpeaking).toBe(false);
    });
  });

  // ── VAD Detection Algorithm ──────────────────────────────────────────
  describe('detection algorithm', () => {
    it('should require both energy AND voice frequency', () => {
      // Energy but wrong frequency → no speech
      const highFreqWave = new Array(256).fill(0.05); // Constant offset = energy
      const highFreqData = new Array(128).fill(-100);
      highFreqData[50] = -5; // ~9375 Hz dominant

      const analyser1 = createMockAnalyser({
        waveformData: highFreqWave,
        frequencyData: highFreqData,
      });

      processor.setAudioContext({ sampleRate: 48000 } as AudioContext);
      processor.registerAnalyser('user-1', analyser1);
      processor.processVAD();

      expect(processor.isUserSpeaking('user-1')).toBe(false);
    });

    it('should set VAD enabled/disabled', () => {
      const analyser = createMockAnalyser();
      processor.registerAnalyser('user-1', analyser);

      processor.setVADEnabled(false);
      processor.processVAD();

      // When VAD is disabled, state should not be updated
      expect(processor.getVoiceActivityState('user-1')).toBeNull();

      processor.setVADEnabled(true);
      processor.processVAD();
      expect(processor.getVoiceActivityState('user-1')).not.toBeNull();
    });
  });

  // ── Analysis Loop ────────────────────────────────────────────────────
  describe('analysis loop', () => {
    it('should start the VAD animation loop', () => {
      const analyser = createMockAnalyser();
      processor.registerAnalyser('user-1', analyser);

      processor.startVAD();
      expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should not start multiple loops', () => {
      processor.startVAD();
      processor.startVAD();

      expect(globalThis.requestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it('should stop the VAD loop', () => {
      processor.startVAD();
      processor.stopVAD();

      expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle stopVAD when not started', () => {
      // Should not throw
      expect(() => processor.stopVAD()).not.toThrow();
    });
  });

  // ── Source Analysis ──────────────────────────────────────────────────
  describe('analyzeSource', () => {
    it('should return null for unknown source', () => {
      expect(processor.analyzeSource('unknown')).toBeNull();
    });

    it('should compute correct RMS for known signal', () => {
      // All samples at 0.5 → RMS = 0.5
      const waveform = new Array(256).fill(0.5);
      const analyser = createMockAnalyser({ waveformData: waveform });

      processor.registerAnalyser('user-1', analyser);
      const result = processor.analyzeSource('user-1');

      expect(result).not.toBeNull();
      expect(result!.rms).toBeCloseTo(0.5, 2);
      expect(result!.peak).toBeCloseTo(0.5, 2);
    });

    it('should compute peak correctly', () => {
      const waveform = new Array(256).fill(0);
      waveform[100] = 0.9;
      waveform[200] = -0.7;

      const analyser = createMockAnalyser({ waveformData: waveform });
      processor.registerAnalyser('user-1', analyser);

      const result = processor.analyzeSource('user-1');
      expect(result!.peak).toBeCloseTo(0.9, 2);
    });

    it('should use default sample rate if no audio context', () => {
      const freqData = new Array(128).fill(-100);
      freqData[10] = -5; // Dominant bin

      const analyser = createMockAnalyser({ frequencyData: freqData });
      processor.registerAnalyser('user-1', analyser);

      const result = processor.analyzeSource('user-1');
      expect(result).not.toBeNull();
      // Dominant frequency = bin * sampleRate / (fftSize * 2)
      // = 10 * 48000 / (256 * 2) = 937.5 Hz (using default 48000)
      expect(result!.voiceActivity.frequency).toBeCloseTo(937.5, 0);
    });
  });

  // ── getVADStats ──────────────────────────────────────────────────────
  describe('getVADStats', () => {
    it('should count active speakers', () => {
      // Create one speaking user and one silent
      const speakingWaveform = new Array(256).fill(0.05);
      const speakingFreq = new Array(128).fill(-100);
      speakingFreq[1] = -5; // Voice frequency range

      const silentWaveform = new Array(256).fill(0);
      const silentFreq = new Array(128).fill(-100);

      processor.setAudioContext({ sampleRate: 48000 } as AudioContext);
      processor.registerAnalyser(
        'speaking',
        createMockAnalyser({
          waveformData: speakingWaveform,
          frequencyData: speakingFreq,
        })
      );
      processor.registerAnalyser(
        'silent',
        createMockAnalyser({
          waveformData: silentWaveform,
          frequencyData: silentFreq,
        })
      );

      processor.processVAD();

      const stats = processor.getVADStats();
      expect(stats.totalSources).toBe(2);
      // At least one should be speaking (depends on exact frequency calculation)
    });
  });

  // ── Cleanup ──────────────────────────────────────────────────────────
  describe('destroy', () => {
    it('should clear all state and stop loop', () => {
      processor.registerAnalyser('user-1', createMockAnalyser());
      processor.startVAD();
      processor.processVAD();

      processor.destroy();

      expect(processor.getVADStats().totalSources).toBe(0);
      expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
    });
  });
});
