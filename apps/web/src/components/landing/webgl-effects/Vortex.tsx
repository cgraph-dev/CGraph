/**
 * Vortex Component
 * Spiral vortex particle animation
 */

import { useRef, useEffect } from 'react';
import { opacityToHex } from './utils';
import {
  DEFAULT_EMERALD,
  VORTEX_DEFAULT_PARTICLE_COUNT,
  VORTEX_DEFAULT_SPEED,
  VORTEX_DISTANCE_MULTIPLIER,
} from './constants';
import type { VortexProps, VortexParticle } from './types';

export function Vortex({
  color = DEFAULT_EMERALD,
  particleCount = VORTEX_DEFAULT_PARTICLE_COUNT,
  className = '',
  speed = VORTEX_DEFAULT_SPEED,
}: VortexProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDistance = Math.min(canvas.width, canvas.height) * VORTEX_DISTANCE_MULTIPLIER;

    // Initialize particles
    const particles: VortexParticle[] = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * maxDistance;
      return {
        angle,
        distance,
        speed: (Math.random() * 0.02 + 0.01) * speed,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.5,
      };
    });

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.angle += particle.speed;
        particle.distance -= 0.1 * speed;

        if (particle.distance < 10) {
          particle.distance = maxDistance;
        }

        const x = centerX + Math.cos(particle.angle) * particle.distance;
        const y = centerY + Math.sin(particle.angle) * particle.distance;

        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = color + opacityToHex(particle.opacity);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [color, particleCount, speed]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} />;
}
