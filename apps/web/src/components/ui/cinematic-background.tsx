/**
 * CinematicBackground — interactive canvas particle field with connection lines
 * and mouse repulsion physics. Replaces the simpler ParticleField for the main app.
 *
 * Uses backgroundPresets from @cgraph/animation-constants.
 *
 * @module components/ui/cinematic-background
 */
'use client';
import { useEffect, useRef, memo } from 'react';
import { useReducedMotion } from 'motion/react';
import { backgroundPresets } from '@cgraph/animation-constants';

type Intensity = 'full' | 'medium' | 'subtle' | 'off';

interface CinematicBackgroundProps {
  intensity?: Intensity;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

const DPR_CAP = 2;

export const CinematicBackground = memo(function CinematicBackground({
  intensity = 'medium',
  className = '',
}: CinematicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || intensity === 'off') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const preset =
      intensity === 'full'
        ? backgroundPresets.particleField.full
        : intensity === 'subtle'
          ? backgroundPresets.particleField.subtle
          : backgroundPresets.particleField.medium;

    const { count, connectionDistance, speed, mouseRepulsion } = preset;
    const colors = backgroundPresets.colors.particles;

    let W = 0;
    let H = 0;
    const particles: Particle[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          size: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)]!,
          alpha: Math.random() * 0.5 + 0.3,
        });
      }
    }

    function handleMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animRef.current);
      } else {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    resize();
    initParticles();
    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });
    window.addEventListener('mousemove', handleMouse);
    document.addEventListener('visibilitychange', handleVisibility);

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      const mouse = mouseRef.current;

      // Update positions + mouse repulsion
      for (const p of particles) {
        // Mouse repulsion
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < mouseRepulsion && mDist > 0) {
          const force = (1 - mDist / mouseRepulsion) * 0.5;
          p.vx += (mdx / mDist) * force;
          p.vy += (mdy / mDist) * force;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Clamp velocity
        const maxV = speed * 2;
        p.vx = Math.max(-maxV, Math.min(maxV, p.vx));
        p.vy = Math.max(-maxV, Math.min(maxV, p.vy));

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }

      // Draw connections
      ctx!.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]!;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.15;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            const grad = ctx!.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, a.color);
            grad.addColorStop(1, b.color);
            ctx!.strokeStyle = grad;
            ctx!.globalAlpha = opacity;
            ctx!.lineWidth = 1;
            ctx!.stroke();
          }
        }

        // Mouse-to-particle connections
        const mdx2 = a.x - mouse.x;
        const mdy2 = a.y - mouse.y;
        const mDist2 = Math.sqrt(mdx2 * mdx2 + mdy2 * mdy2);
        if (mDist2 < connectionDistance * 1.5) {
          const opacity = (1 - mDist2 / (connectionDistance * 1.5)) * 0.25;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(mouse.x, mouse.y);
          ctx!.strokeStyle = a.color;
          ctx!.globalAlpha = opacity;
          ctx!.lineWidth = 1.5;
          ctx!.stroke();
        }
      }

      // Draw particles
      for (const p of particles) {
        // Glow
        const grd = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        grd.addColorStop(0, p.color + '60');
        grd.addColorStop(1, p.color + '00');
        ctx!.globalAlpha = p.alpha;
        ctx!.fillStyle = grd;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx!.fill();

        // Core dot
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = Math.min(1, p.alpha * 1.5);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intensity, prefersReduced]);

  if (prefersReduced || intensity === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
});

CinematicBackground.displayName = 'CinematicBackground';
