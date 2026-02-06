/**
 * SpectrumVisualizer Component
 *
 * Renders frequency spectrum bar visualization using canvas.
 */

import { useRef, useEffect } from 'react';
import { THEMES } from './themes';
import type { VisualizerProps } from './types';

export function SpectrumVisualizer({ analyser, theme, width, height }: VisualizerProps) {
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
