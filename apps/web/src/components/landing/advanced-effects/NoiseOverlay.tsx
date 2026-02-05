/**
 * NoiseOverlay Component
 * Canvas-based animated noise texture overlay
 */

import { useEffect, useRef } from 'react';
import { NOISE_FRAME_RATE, NOISE_DEFAULT_OPACITY } from './constants';
import type { NoiseOverlayProps } from './types';

export function NoiseOverlay({
  opacity = NOISE_DEFAULT_OPACITY,
  className = '',
}: NoiseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    let animationId: number;
    let lastTime = 0;

    const render = (time: number) => {
      if (time - lastTime > 1000 / NOISE_FRAME_RATE) {
        lastTime = time;
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const value = Math.random() * 255;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
          data[i + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-50 ${className}`}
      style={{ opacity, mixBlendMode: 'overlay' }}
    />
  );
}
