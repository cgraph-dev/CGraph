/**
 * DNAHelix Component
 * DNA double helix animation
 */

import { useRef, useEffect } from 'react';
import {
  DEFAULT_EMERALD,
  DEFAULT_PURPLE,
  DNA_DEFAULT_SPEED,
  DNA_NODE_COUNT,
  DNA_AMPLITUDE_RATIO,
} from './constants';
import type { DNAHelixProps } from './types';

export function DNAHelix({
  color1 = DEFAULT_EMERALD,
  color2 = DEFAULT_PURPLE,
  className = '',
  speed = DNA_DEFAULT_SPEED,
}: DNAHelixProps) {
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

      const centerX = canvas.width / 2;
      const amplitude = canvas.width * DNA_AMPLITUDE_RATIO;
      const spacing = canvas.height / DNA_NODE_COUNT;

      for (let i = 0; i < DNA_NODE_COUNT; i++) {
        const y = i * spacing;
        const phase = i * 0.2 + time * 0.02 * speed;

        // First strand
        const x1 = centerX + Math.sin(phase) * amplitude;
        const z1 = Math.cos(phase);

        // Second strand (opposite phase)
        const x2 = centerX + Math.sin(phase + Math.PI) * amplitude;
        const z2 = Math.cos(phase + Math.PI);

        // Draw connecting line
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.abs(z1) * 0.1})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();

        // Draw nodes
        const size1 = 4 + z1 * 3;
        const size2 = 4 + z2 * 3;

        ctx.fillStyle = color1;
        ctx.globalAlpha = 0.5 + z1 * 0.5;
        ctx.beginPath();
        ctx.arc(x1, y, Math.max(size1, 1), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color2;
        ctx.globalAlpha = 0.5 + z2 * 0.5;
        ctx.beginPath();
        ctx.arc(x2, y, Math.max(size2, 1), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      time++;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [color1, color2, speed]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} />;
}
