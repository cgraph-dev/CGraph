/**
 * Advanced Voice Visualizer
 *
 * Cutting-edge audio visualization using Web Audio API, Canvas, and WebGL.
 * Features waveform, frequency spectrum, circular visualizer, and particle effects.
 *
 * @version 1.0.0
 * @since v0.7.33
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { createLogger } from '@/lib/logger';
import { THEMES } from './themes';
import { WaveformVisualizer } from './waveform-visualizer';
import { SpectrumVisualizer } from './spectrum-visualizer';
import { CircularVisualizer } from './circular-visualizer';
import { ParticleVisualizer } from './particle-visualizer';
import type { AdvancedVoiceVisualizerProps } from './types';
import { tweens } from '@/lib/animation-presets';

const logger = createLogger('AdvancedVoiceVisualizer');

// Safari compatibility - webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/**
 * Advanced Voice Visualizer component.
 */
export default function AdvancedVoiceVisualizer({
  audioUrl,
  audioStream,
  variant = 'spectrum',
  theme = 'matrix-green',
  height = 200,
  width = 600,
  className = '',
  isPlaying = false,
  onPlaybackEnd,
}: AdvancedVoiceVisualizerProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize audio context
  useEffect(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0.8;

    setAudioContext(ctx);
    setAnalyser(analyserNode);

    return () => {
      ctx.close();
    };
  }, []);

  // Connect audio source
  useEffect(() => {
    if (!audioContext || !analyser) return;

    if (audioStream) {
      // Connect microphone stream
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    } else if (audioUrl && audioRef.current) {
      // Connect audio element
      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }
  }, [audioContext, analyser, audioStream, audioUrl]);

  // Play/pause control
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => logger.error('Playback failed', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioUrl]);

  if (!analyser) return null;

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm ${className}`}
      style={{ width, height }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={tweens.standard}
    >
      {/* Hidden audio element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} onEnded={onPlaybackEnd} crossOrigin="anonymous" />
      )}

      {/* Visualizers */}
      {(variant === 'waveform' || variant === 'all') && (
        <WaveformVisualizer analyser={analyser} theme={theme} width={width} height={height} />
      )}

      {(variant === 'spectrum' || variant === 'all') && (
        <SpectrumVisualizer analyser={analyser} theme={theme} width={width} height={height} />
      )}

      {(variant === 'circular' || variant === 'all') && (
        <CircularVisualizer analyser={analyser} theme={theme} width={width} height={height} />
      )}

      {(variant === 'particles' || variant === 'all') && (
        <ParticleVisualizer analyser={analyser} theme={theme} width={width} height={height} />
      )}

      {/* Glow overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: `inset 0 0 60px ${THEMES[theme].glow}`,
          opacity: 0.3,
        }}
      />
    </motion.div>
  );
}
