/**
 * Footer background effects — canvas-based cyber grid + particle field.
 *
 * Mirrors the auth page's interactive background (CyberGrid, ParticleField)
 * but scoped to the footer container instead of fullscreen.
 */

import { memo, useRef, useEffect, useCallback } from 'react';

/* -------------------------------------------------------------------------- */
/*  Shared helpers                                                            */
/* -------------------------------------------------------------------------- */

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* -------------------------------------------------------------------------- */
/*  FooterCyberGrid — perspective grid with pulsing intersection nodes        */
/* -------------------------------------------------------------------------- */

export const FooterCyberGrid = memo(function FooterCyberGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CELL = 55;
    const COLOR = '#8b5cf6';
    const COLOR_ALT = '#10b981';

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const t0 = Date.now();

    const draw = () => {
      const elapsed = Date.now() - t0;
      const pulse = Math.sin((elapsed / 4000) * Math.PI * 2) * 0.3 + 0.7;

      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.05 * pulse;
      ctx.strokeStyle = COLOR;

      for (let x = 0; x <= w; x += CELL) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += CELL) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Pulsing nodes at sparse intersections
      for (let x = CELL; x < w; x += CELL * 3) {
        for (let y = CELL; y < h; y += CELL * 3) {
          const nPulse = Math.sin((elapsed / 1500 + x + y) * 0.01) * 0.5 + 0.5;
          ctx.globalAlpha = 0.18 * nPulse * pulse;
          ctx.beginPath();
          ctx.arc(x, y, 2 * nPulse + 1, 0, Math.PI * 2);
          ctx.fillStyle = (x + y) % (CELL * 6) < CELL * 3 ? COLOR : COLOR_ALT;
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (prefersReducedMotion()) {
    return (
      <div
        className="gl-footer-unified__canvas-fallback"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.25) 1px, transparent 1px)',
          backgroundSize: '55px 55px',
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', willChange: 'transform' }}
    />
  );
});

/* -------------------------------------------------------------------------- */
/*  FooterParticleField — interconnected floating particles with mouse react  */
/* -------------------------------------------------------------------------- */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

const COLORS = ['#8b5cf6', '#a78bfa', '#10b981', '#34d399'];
const PARTICLE_COUNT = 40;
const CONNECTION_DIST = 110;
const SPEED = 0.3;

export const FooterParticleField = memo(function FooterParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const boundsRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleMouse = useCallback((e: MouseEvent) => {
    const b = boundsRef.current;
    mouseRef.current = { x: e.clientX - b.x, y: e.clientY - b.y };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED,
          size: Math.random() * 2 + 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
          alpha: Math.random() * 0.25 + 0.15,
        });
      }
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      boundsRef.current = { x: rect.left, y: rect.top, w, h };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouse);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update & draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Connections between particles
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]!;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.08;
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, a.color);
            grad.addColorStop(1, b.color);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = grad;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Connect to mouse
        const mdx = a.x - mouse.x;
        const mdy = a.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < CONNECTION_DIST * 1.5) {
          const opacity = (1 - mDist / (CONNECTION_DIST * 1.5)) * 0.15;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = a.color;
          ctx.globalAlpha = opacity;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [handleMouse]);

  if (prefersReducedMotion()) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', willChange: 'transform' }}
    />
  );
});
