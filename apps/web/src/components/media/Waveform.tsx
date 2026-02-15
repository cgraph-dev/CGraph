import { useRef, useEffect, memo } from 'react';

interface WaveformProps {
  /** Audio waveform data (normalized 0-1 values) */
  data: number[];
  /** Current playback progress (0-1) */
  progress?: number;
  /** Whether audio is currently playing */
  isPlaying?: boolean;
  /** Color for played portion */
  playedColor?: string;
  /** Color for unplayed portion */
  unplayedColor?: string;
  /** Height of the waveform in pixels */
  height?: number;
  /** Width of individual bars in pixels */
  barWidth?: number;
  /** Gap between bars in pixels */
  barGap?: number;
  /** Border radius for bars */
  barRadius?: number;
  /** Click handler for seeking */
  onSeek?: (progress: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Waveform visualization component for audio messages.
 *
 * Renders a canvas-based waveform that shows playback progress
 * and supports click-to-seek functionality.
 * Includes animated bars during playback.
 */
export const Waveform = memo(function Waveform({
  data,
  progress = 0,
  isPlaying = false,
  playedColor = '#3b82f6',
  unplayedColor = '#d1d5db',
  height = 40,
  barWidth = 3,
  barGap = 2,
  barRadius = 2,
  onSeek,
  className = '',
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Draw waveform on canvas with optional animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const totalBarWidth = barWidth + barGap;
    const barCount = data.length;
    const canvasWidth = barCount * totalBarWidth;

    // Set canvas dimensions once
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const draw = (timestamp?: number) => {
      // Clear canvas
      ctx.clearRect(0, 0, canvasWidth, height);

      // Calculate which bar marks the progress boundary
      const progressBarIndex = Math.floor(progress * barCount);

      // Animation time for wave effect
      const time = timestamp ? timestamp / 1000 : 0;
      timeRef.current = time;

      // Draw bars
      data.forEach((value, index) => {
        let normalizedValue = Math.max(0.05, Math.min(1, value));

        // Apply wave animation when playing
        if (isPlaying) {
          // Create a wave effect that ripples through bars near the playhead
          const distanceFromPlayhead = Math.abs(index - progressBarIndex);
          const waveInfluence = Math.max(0, 1 - distanceFromPlayhead / 8);

          // Multiple sine waves for organic feel
          const wave1 = Math.sin(time * 6 + index * 0.4) * 0.15;
          const wave2 = Math.sin(time * 8 + index * 0.6) * 0.1;
          const wave3 = Math.cos(time * 4 + index * 0.3) * 0.08;

          // Bars near playhead animate more
          const playheadBoost = waveInfluence * (wave1 + wave2);
          // All played bars have subtle animation
          const playedAnimation = index <= progressBarIndex ? wave2 + wave3 : 0;

          normalizedValue = Math.max(
            0.1,
            Math.min(1, normalizedValue + playheadBoost + playedAnimation)
          );
        }

        const barHeight = normalizedValue * height;
        const x = index * totalBarWidth;
        const y = (height - barHeight) / 2;

        // Choose color based on progress
        ctx.fillStyle = index <= progressBarIndex ? playedColor : unplayedColor;

        // Draw rounded rectangle
        roundedRect(ctx, x, y, barWidth, barHeight, barRadius);
      });

      // Continue animation loop if playing
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    // Initial draw
    draw();

    // Start animation loop if playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }

    // Cleanup animation on unmount or when deps change
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [data, progress, isPlaying, playedColor, unplayedColor, height, barWidth, barGap, barRadius]);

  // Handle click for seeking
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(newProgress);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`inline-block cursor-pointer ${className}`}
      role="slider"
      aria-label="Audio waveform"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
    >
      <canvas ref={canvasRef} />
    </div>
  );
});

/**
 * Draw a rounded rectangle on canvas.
 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Generate placeholder waveform data.
 * Useful for loading states or when real data isn't available.
 */
export function generatePlaceholderWaveform(barCount: number = 50): number[] {
  const data: number[] = [];
  for (let i = 0; i < barCount; i++) {
    // Create a somewhat natural-looking pattern
    const base = 0.3;
    const variance = 0.5 * Math.sin(i * 0.3) + 0.2 * Math.cos(i * 0.7);
    data.push(Math.max(0.1, Math.min(1, base + variance + Math.random() * 0.2)));
  }
  return data;
}
