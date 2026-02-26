/**
 * CircularVisualizer Component
 *
 * Renders circular audio visualization using canvas.
 */

import { useRef, useEffect } from 'react';
import { THEMES } from './themes';
import type { VisualizerProps } from './types';

/**
 * unknown for the chat module.
 */
/**
 * Circular Visualizer component.
 */
export function CircularVisualizer({ analyser, theme, width, height }: VisualizerProps) {
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
