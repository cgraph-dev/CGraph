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
import { motion } from 'framer-motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AdvancedVoiceVisualizer');

// Safari compatibility - webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface AdvancedVoiceVisualizerProps {
  audioUrl?: string;
  audioStream?: MediaStream;
  variant?: 'waveform' | 'spectrum' | 'circular' | 'particles' | 'all';
  theme?: 'matrix-green' | 'cyber-blue' | 'neon-pink' | 'amber';
  height?: number;
  width?: number;
  className?: string;
  isPlaying?: boolean;
  onPlaybackEnd?: () => void;
}

// =============================================================================
// THEME CONFIGURATIONS
// =============================================================================

const THEMES = {
  'matrix-green': {
    primary: '#00ff41',
    secondary: '#39ff14',
    gradient: ['#00ff41', '#003b00'],
    glow: 'rgba(0, 255, 65, 0.5)',
  },
  'cyber-blue': {
    primary: '#00d4ff',
    secondary: '#00ffff',
    gradient: ['#00d4ff', '#001a33'],
    glow: 'rgba(0, 212, 255, 0.5)',
  },
  'neon-pink': {
    primary: '#ff0080',
    secondary: '#ff66b2',
    gradient: ['#ff0080', '#4d0026'],
    glow: 'rgba(255, 0, 128, 0.5)',
  },
  amber: {
    primary: '#fbbf24',
    secondary: '#fde68a',
    gradient: ['#fbbf24', '#451a03'],
    glow: 'rgba(251, 191, 36, 0.5)',
  },
};

// =============================================================================
// WAVEFORM VISUALIZER
// =============================================================================

function WaveformVisualizer({
  analyser,
  theme,
  width,
  height,
}: {
  analyser: AnalyserNode;
  theme: keyof typeof THEMES;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, THEMES[theme].gradient[0] ?? '#00ff41');
      gradient.addColorStop(1, THEMES[theme].gradient[1] ?? '#003b00');

      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 15;
      ctx.shadowColor = THEMES[theme].glow;

      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] ?? 128) / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, theme, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0" />;
}

// =============================================================================
// FREQUENCY SPECTRUM VISUALIZER
// =============================================================================

function SpectrumVisualizer({
  analyser,
  theme,
  width,
  height,
}: {
  analyser: AnalyserNode;
  theme: keyof typeof THEMES;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barCount = 64; // Reduce for better performance
    const barWidth = width / barCount;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        const barHeight = ((dataArray[i] ?? 0) / 255) * height;
        const x = i * barWidth;

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(x, height, x, height - barHeight);
        gradient.addColorStop(0, THEMES[theme].gradient[1] ?? '#003b00');
        gradient.addColorStop(0.5, THEMES[theme].primary);
        gradient.addColorStop(1, THEMES[theme].secondary);

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = THEMES[theme].glow;

        // Rounded rectangle
        const radius = 4;
        ctx.beginPath();
        ctx.roundRect(x + 2, height - barHeight, barWidth - 4, barHeight, [radius, radius, 0, 0]);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, theme, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0" />;
}

// =============================================================================
// CIRCULAR VISUALIZER
// =============================================================================

function CircularVisualizer({
  analyser,
  theme,
  width,
  height,
}: {
  analyser: AnalyserNode;
  theme: keyof typeof THEMES;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    const barCount = 128;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2;
        const barHeight = ((dataArray[i] ?? 0) / 255) * (radius * 0.8);

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        // Create gradient
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, THEMES[theme].primary);
        gradient.addColorStop(1, THEMES[theme].secondary);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = (width / barCount) * 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = THEMES[theme].glow;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw center glow
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius * 0.5
      );
      glowGradient.addColorStop(0, THEMES[theme].glow);
      glowGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, theme, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0" />;
}

// =============================================================================
// PARTICLE VISUALIZER
// =============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

function ParticleVisualizer({
  analyser,
  theme,
  width,
  height,
}: {
  analyser: AnalyserNode;
  theme: keyof typeof THEMES;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const createParticle = (x: number, y: number, energy: number): Particle => ({
      x,
      y,
      vx: (Math.random() - 0.5) * energy * 2,
      vy: (Math.random() - 0.5) * energy * 2,
      life: 1,
      size: 2 + energy * 3,
    });

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Generate particles based on frequency data
      const avg = dataArray.reduce((a, b) => a + b) / bufferLength;
      if (avg > 50 && Math.random() > 0.7) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particlesRef.current.push(createParticle(x, y, avg / 255));
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.01;

        if (particle.life <= 0) return false;

        ctx.fillStyle = `rgba(${parseInt(THEMES[theme].primary.slice(1, 3), 16)}, ${parseInt(
          THEMES[theme].primary.slice(3, 5),
          16
        )}, ${parseInt(THEMES[theme].primary.slice(5, 7), 16)}, ${particle.life})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = THEMES[theme].glow;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, theme, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0" />;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

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
      transition={{ duration: 0.3 }}
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
