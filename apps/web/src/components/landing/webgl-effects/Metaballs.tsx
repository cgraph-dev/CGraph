/**
 * Metaballs Component
 * Canvas-based metaball animation with blur effect
 */

import { useRef, useEffect } from 'react';
import {
  DEFAULT_COLORS,
  METABALLS_DEFAULT_COUNT,
  METABALLS_DEFAULT_SPEED,
  METABALLS_MIN_RADIUS,
  METABALLS_RADIUS_RANGE,
  METABALLS_BLUR,
} from './constants';
import type { MetaballsProps, Ball } from './types';

export function Metaballs({
  count = METABALLS_DEFAULT_COUNT,
  colors = DEFAULT_COLORS,
  className = '',
  speed = METABALLS_DEFAULT_SPEED,
}: MetaballsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    // Initialize balls
    const balls: Ball[] = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2 * speed,
      vy: (Math.random() - 0.5) * 2 * speed,
      radius: Math.random() * METABALLS_RADIUS_RANGE + METABALLS_MIN_RADIUS,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Resize handler with debouncing
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const debouncedResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 100);
    };

    resize();
    window.addEventListener('resize', debouncedResize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw balls
      balls.forEach((ball) => {
        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce off edges
        if (ball.x < 0 || ball.x > canvas.width) ball.vx *= -1;
        if (ball.y < 0 || ball.y > canvas.height) ball.vy *= -1;

        // Draw metaball
        const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
        gradient.addColorStop(0, ball.color + '80');
        gradient.addColorStop(0.5, ball.color + '40');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationId);
    };
  }, [count, colors, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ filter: `blur(${METABALLS_BLUR}px)` }}
    />
  );
}
