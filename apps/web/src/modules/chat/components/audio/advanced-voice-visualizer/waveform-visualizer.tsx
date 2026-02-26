/**
 * WaveformVisualizer Component
 *
 * Renders audio waveform using canvas.
 */

import { useRef, useEffect } from 'react';
import { THEMES } from './themes';
import type { VisualizerProps } from './types';

/**
 * unknown for the chat module.
 */
/**
 * Waveform Visualizer component.
 */
export function WaveformVisualizer({ analyser, theme, width, height }: VisualizerProps) {
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
