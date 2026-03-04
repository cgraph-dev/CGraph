/**
 * ParticleField — canvas-based ambient star/particle field for the main app background.
 * Replicates the visual from the auth/landing pages.
 * @module components/ui/particle-field
 */
'use client';
import { useEffect, useRef, memo } from 'react';
import { useReducedMotion } from 'motion/react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  pulseSpeed: number;
  pulseOffset: number;
}

const COLORS = [
  'rgba(139,92,246,', // purple
  'rgba(6,182,212,', // cyan
  'rgba(255,255,255,', // white
  'rgba(16,185,129,', // teal
];

interface ParticleFieldProps {
  /** Number of particles to render (default 80) */
  count?: number;
  className?: string;
}

export const ParticleField = memo(function ParticleField({
  count = 80,
  className = '',
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? 'rgba(255,255,255,',
      pulseSpeed: Math.random() * 0.02 + 0.005,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 1;

      for (const p of particles) {
        const pulse = Math.sin(t * p.pulseSpeed + p.pulseOffset) * 0.3 + 0.7;
        const opacity = p.opacity * pulse;

        // Draw glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, `${p.color}${opacity})`);
        gradient.addColorStop(1, `${p.color}0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw core dot
        ctx.fillStyle = `${p.color}${Math.min(1, opacity * 1.5)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Move
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [count, prefersReduced]);

  if (prefersReduced) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
});
ParticleField.displayName = 'ParticleField';
