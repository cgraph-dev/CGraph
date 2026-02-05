/**
 * CursorTrail Component - Interactive cursor trail effect
 *
 * Features:
 * - Smooth trailing particles that follow cursor movement
 * - Gradient color effect with emerald/purple/cyan variants
 * - Fade-out and shrink animation for natural trail effect
 * - Performance optimized with RAF and CSS transforms
 * - Respects reduced motion preferences
 * - Portal rendering to avoid z-index issues
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { memo, useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface CursorTrailProps {
  /** Number of trail particles */
  particleCount?: number;
  /** Trail particle colors */
  colors?: readonly string[];
  /** Particle size in pixels */
  size?: number;
  /** Trail length (higher = longer trail) */
  trailLength?: number;
  /** Enable glow effect */
  glow?: boolean;
  /** Whether the effect is active */
  enabled?: boolean;
}

interface TrailParticle {
  x: number;
  y: number;
  age: number;
  color: string;
  id: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_COLORS = ['#10b981', '#8b5cf6', '#06b6d4'] as const;
const MAX_PARTICLES = 50;
const PARTICLE_LIFETIME = 1000; // ms

// ============================================================================
// CURSOR TRAIL COMPONENT
// ============================================================================

export const CursorTrail = memo(function CursorTrail({
  particleCount = 20,
  colors = DEFAULT_COLORS,
  size = 8,
  trailLength = 0.85,
  glow = true,
  enabled = true,
}: CursorTrailProps) {
  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<TrailParticle[]>([]);
  const [mounted, setMounted] = useState(false);

  const mousePos = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const particleIdRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Skip if disabled or reduced motion preferred
  const isActive = enabled && !prefersReducedMotion && mounted;

  // Track mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isActive) return;

    const safeColors = colors.length > 0 ? colors : DEFAULT_COLORS;
    const clampedCount = Math.min(particleCount, MAX_PARTICLES);

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;

      // Throttle updates to ~60fps
      if (deltaTime > 16) {
        lastTimeRef.current = timestamp;

        const { x, y } = mousePos.current;
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        setParticles((prev) => {
          // Age existing particles
          let updated = prev
            .map((p) => ({ ...p, age: p.age + deltaTime }))
            .filter((p) => p.age < PARTICLE_LIFETIME);

          // Add new particle if cursor moved
          if (distance > 3 && updated.length < clampedCount) {
            const colorIndex = particleIdRef.current % safeColors.length;
            updated.push({
              x,
              y,
              age: 0,
              color: safeColors[colorIndex]!,
              id: particleIdRef.current++,
            });
            lastPos.current = { x, y };
          }

          return updated;
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isActive, colors, particleCount]);

  // Mouse event listener
  useEffect(() => {
    if (!isActive) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive, handleMouseMove]);

  // Don't render anything if not active
  if (!isActive || particles.length === 0) return null;

  const trail = (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
      {particles.map((particle) => {
        const progress = particle.age / PARTICLE_LIFETIME;
        const scale = 1 - progress * (1 - trailLength);
        const opacity = 1 - progress;

        return (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              width: size,
              height: size,
              backgroundColor: particle.color,
              opacity: opacity * 0.8,
              transform: `translate(-50%, -50%) scale(${scale})`,
              boxShadow: glow
                ? `0 0 ${size}px ${particle.color}, 0 0 ${size * 2}px ${particle.color}40`
                : undefined,
              transition: 'opacity 0.1s ease-out',
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </div>
  );

  // Render via portal to avoid z-index issues
  return mounted ? createPortal(trail, document.body) : null;
});

// ============================================================================
// HOOK FOR CONDITIONAL USAGE
// ============================================================================

/**
 * Hook to conditionally enable cursor trail based on user preferences
 */
export function useCursorTrailEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Only enable on desktop devices with no reduced motion preference
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setEnabled(isDesktop && !prefersReducedMotion);
  }, [prefersReducedMotion]);

  return enabled;
}

export default CursorTrail;
