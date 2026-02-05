/**
 * GeometricPattern Component
 * Canvas-based geometric patterns (hexagons, triangles, squares, circles)
 */

import { useRef, useEffect } from 'react';
import { DEFAULT_EMERALD, PATTERN_DEFAULT_SIZE, PATTERN_DEFAULT_OPACITY } from './constants';
import type { GeometricPatternProps } from './types';

export function GeometricPattern({
  pattern = 'hexagons',
  color = DEFAULT_EMERALD,
  size = PATTERN_DEFAULT_SIZE,
  className = '',
  animated = true,
}: GeometricPatternProps) {
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

    const drawHexagon = (x: number, y: number, r: number, offset: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + offset;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const drawTriangle = (x: number, y: number, r: number, offset: number) => {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = ((Math.PI * 2) / 3) * i + offset - Math.PI / 2;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = color + PATTERN_DEFAULT_OPACITY;
      ctx.lineWidth = 1;

      const offset = animated ? time * 0.001 : 0;

      if (pattern === 'hexagons') {
        const h = size * Math.sqrt(3);
        for (let row = -1; row < canvas.height / h + 1; row++) {
          for (let col = -1; col < canvas.width / (size * 1.5) + 1; col++) {
            const x = col * size * 1.5;
            const y = row * h + (col % 2) * (h / 2);
            drawHexagon(x, y, size, offset);
          }
        }
      } else if (pattern === 'triangles') {
        const h = (size * Math.sqrt(3)) / 2;
        for (let row = 0; row < canvas.height / h + 1; row++) {
          for (let col = 0; col < canvas.width / size + 1; col++) {
            const x = col * size + (row % 2) * (size / 2);
            const y = row * h;
            drawTriangle(x, y, size / 2, (row + col) % 2 ? Math.PI : 0 + offset);
          }
        }
      } else if (pattern === 'squares') {
        for (let row = 0; row < canvas.height / size + 1; row++) {
          for (let col = 0; col < canvas.width / size + 1; col++) {
            const x = col * size;
            const y = row * size;
            ctx.strokeRect(x, y, size, size);
          }
        }
      } else if (pattern === 'circles') {
        for (let row = 0; row < canvas.height / size + 1; row++) {
          for (let col = 0; col < canvas.width / size + 1; col++) {
            const x = col * size + size / 2;
            const y = row * size + size / 2;
            const pulseRadius = (size / 2) * (1 + Math.sin(time * 0.002 + row + col) * 0.1);
            ctx.beginPath();
            ctx.arc(x, y, animated ? pulseRadius : size / 2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      time++;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [pattern, color, size, animated]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} />;
}
