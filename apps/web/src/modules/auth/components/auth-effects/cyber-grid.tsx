import { memo, useRef, useEffect } from 'react';
import {
  prefersReducedMotion,
  DEFAULT_COLOR,
  DEFAULT_CELL_SIZE,
  DEFAULT_PULSE_SPEED,
} from './constants';
import type { CyberGridProps } from './types';

/**
 * CyberGrid Component
 *
 * GPU-accelerated canvas grid with pulsing nodes
 */
export const CyberGrid = memo(function CyberGrid({
  color = DEFAULT_COLOR,
  lineWidth = 0.5,
  cellSize = DEFAULT_CELL_SIZE,
  pulseSpeed = DEFAULT_PULSE_SPEED,
}: CyberGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const pulse = Math.sin((elapsed / pulseSpeed) * Math.PI * 2) * 0.3 + 0.7;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 0.15 * pulse;

      // Draw vertical lines
      for (let x = 0; x <= window.innerWidth; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, window.innerHeight);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = 0; y <= window.innerHeight; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(window.innerWidth, y);
        ctx.stroke();
      }

      // Draw glowing nodes at intersections (sparse)
      ctx.globalAlpha = 0.4 * pulse;
      for (let x = cellSize; x < window.innerWidth; x += cellSize * 3) {
        for (let y = cellSize; y < window.innerHeight; y += cellSize * 3) {
          const nodePulse = Math.sin((elapsed / 1500 + x + y) * 0.01) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, 2 * nodePulse + 1, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [color, lineWidth, cellSize, pulseSpeed]);

  if (prefersReducedMotion()) {
    return (
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(${color}20 1px, transparent 1px),
                           linear-gradient(90deg, ${color}20 1px, transparent 1px)`,
          backgroundSize: `${cellSize}px ${cellSize}px`,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ willChange: 'transform' }}
    />
  );
});

export default CyberGrid;
