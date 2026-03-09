/**
 * ParticleEngine — unified particle rendering component.
 *
 * Consolidates 4 particle sources into a single canvas renderer
 * with a priority stack: border > nameplate > profile bg > ambient.
 * Only one source is active at a time based on context.
 *
 * @module components/particles
 * @description Renders particle effects on a fullscreen canvas with priority-based source selection.
 */

import { useRef, useEffect, useCallback, memo } from 'react';
import { useCustomizationStore } from '@/modules/settings/store/customization';

// =============================================================================
// TYPES
// =============================================================================

/** Particle source type in priority order (highest first) */
type ParticleSource = 'border' | 'nameplate' | 'profile-bg' | 'ambient';

/** Priority rank — lower number = higher priority */
const SOURCE_PRIORITY: Record<ParticleSource, number> = {
  border: 0,
  nameplate: 1,
  'profile-bg': 2,
  ambient: 3,
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

interface ParticleEngineProps {
  /** Which particle sources are currently active */
  activeSources?: ParticleSource[];
  /** Max particles to render (performance cap) */
  maxParticles?: number;
  /** Optional className for the canvas container */
  className?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const PARTICLE_COLORS: Record<ParticleSource, string[]> = {
  border: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
  nameplate: ['#f59e0b', '#fbbf24', '#fcd34d'],
  'profile-bg': ['#10b981', '#34d399', '#6ee7b7'],
  ambient: ['#6366f1', '#818cf8', '#a5b4fc'],
};

/**
 * Resolve the highest priority active source.
 * @description Returns the source with the lowest priority number from active sources.
 */
function resolveActiveSource(sources: ParticleSource[]): ParticleSource | null {
  if (sources.length === 0) return null;
  return sources.reduce((best, src) =>
    SOURCE_PRIORITY[src] < SOURCE_PRIORITY[best] ? src : best
  );
}

/**
 * Create a new particle at a random position.
 * @description Spawns a particle with random velocity and lifetime.
 */
function spawnParticle(width: number, height: number, colors: string[]): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -Math.random() * 0.8 - 0.2,
    size: Math.random() * 3 + 1,
    opacity: Math.random() * 0.6 + 0.2,
    life: 0,
    maxLife: Math.random() * 200 + 100,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Unified particle engine using canvas rendering.
 * @description Renders particles from the highest-priority active source on a canvas element.
 */
export const ParticleEngine = memo(function ParticleEngine({
  activeSources = ['ambient'],
  maxParticles = 60,
  className = '',
}: ParticleEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const particlesEnabled = useCustomizationStore((s) => s.particlesEnabled);

  const activeSource = resolveActiveSource(activeSources);
  const colors = activeSource ? PARTICLE_COLORS[activeSource] : PARTICLE_COLORS.ambient;

  const animate = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;

      // Spawn particles up to max
      while (particles.length < maxParticles) {
        particles.push(spawnParticle(width, height, colors));
      }

      // Update and draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        // Fade out near end of life
        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio > 0.7 ? p.opacity * (1 - (lifeRatio - 0.7) / 0.3) : p.opacity;

        // Remove dead particles
        if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > width + 10) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(() => animate(ctx, width, height));
    },
    [maxParticles, colors]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !particlesEnabled || !activeSource) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    particlesRef.current = [];
    rafRef.current = requestAnimationFrame(() =>
      animate(ctx, canvas.offsetWidth, canvas.offsetHeight)
    );

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      particlesRef.current = [];
    };
  }, [particlesEnabled, activeSource, animate]);

  if (!particlesEnabled || !activeSource) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
});

export default ParticleEngine;
