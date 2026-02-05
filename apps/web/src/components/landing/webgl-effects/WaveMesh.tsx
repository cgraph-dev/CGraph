/**
 * WaveMesh Component
 * Animated wave mesh grid
 */

import { useRef, useEffect } from 'react';
import {
  DEFAULT_EMERALD,
  WAVE_DEFAULT_ROWS,
  WAVE_DEFAULT_COLS,
  WAVE_DEFAULT_AMPLITUDE,
  WAVE_DEFAULT_SPEED,
} from './constants';
import type { WaveMeshProps } from './types';

export function WaveMesh({
  color = DEFAULT_EMERALD,
  rows = WAVE_DEFAULT_ROWS,
  cols = WAVE_DEFAULT_COLS,
  className = '',
  amplitude = WAVE_DEFAULT_AMPLITUDE,
  speed = WAVE_DEFAULT_SPEED,
}: WaveMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 1;

      // Draw horizontal lines
      for (let row = 0; row <= rows; row++) {
        ctx.beginPath();
        for (let col = 0; col <= cols; col++) {
          const x = col * cellWidth;
          const wave = Math.sin(col * 0.3 + time * 0.02 * speed) * amplitude;
          const y = row * cellHeight + wave;

          if (col === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw vertical lines
      for (let col = 0; col <= cols; col++) {
        ctx.beginPath();
        for (let row = 0; row <= rows; row++) {
          const wave = Math.sin(col * 0.3 + time * 0.02 * speed) * amplitude;
          const x = col * cellWidth;
          const y = row * cellHeight + wave;

          if (row === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      time++;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [color, rows, cols, amplitude, speed]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} />;
}
