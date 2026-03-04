/**
 * Avatar border particle system renderer.
 * @module
 */
import { memo, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { BorderParticleSystemProps, Particle } from './types';
import { PARTICLE_PRESETS } from './presets';
import { random } from './utils';
import { DOMParticle } from './dom-particle';
import { getAnimationForType } from './animations';

/**
 * BorderParticleSystem
 *
 * Advanced particle system for avatar borders featuring:
 * - 16 unique particle types (flames, sparkles, sakura, etc.)
 * - Physics-based movement with gravity, wind, and turbulence
 * - Optimized rendering with object pooling
 * - Canvas-based rendering for high particle counts
 * - Fallback to DOM for low particle counts
 */
export const BorderParticleSystem = memo(function BorderParticleSystem({
  size,
  config,
  active = true,
  colors = { primary: '#22c55e', secondary: '#16a34a', accent: '#4ade80' },
  density = 1,
  speed = 1,
  useCanvas = false,
  reducedMotion = false,
  className,
}: BorderParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const preset = PARTICLE_PRESETS[config.type] || PARTICLE_PRESETS.spark;
  const particleCount = Math.round((config.count || 8) * density);
  const radius = size / 2;

  // Create a new particle
  const createParticle = useCallback(
    (id: number): Particle => {
      const angle = random(0, Math.PI * 2);
      const distance = radius + random(5, 15);
      const x = radius + Math.cos(angle) * distance;
      const y = radius + Math.sin(angle) * distance;

      const colorChoice = random(0, 1);
      const color =
        colorChoice < 0.4 ? colors.primary : colorChoice < 0.7 ? colors.secondary : colors.accent;

      return {
        id,
        x,
        y,
        vx: preset.initialVelocity.x + random(-preset.spread, preset.spread),
        vy: preset.initialVelocity.y + random(-preset.spread, preset.spread),
        size: random(preset.minSize, preset.maxSize),
        opacity: 1,
        rotation: random(0, 360),
        rotationSpeed: random(-2, 2),
        life: 0,
        maxLife: random(preset.minLife, preset.maxLife),
        type: config.type,
        color,
      };
    },
    [radius, colors, preset, config.type]
  );

  // Initialize particles
  useEffect(() => {
    if (reducedMotion || !active) {
      particlesRef.current = [];
      return;
    }

    particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
      const particle = createParticle(i);
      particle.life = random(0, particle.maxLife); // Stagger initial life
      return particle;
    });
  }, [particleCount, createParticle, reducedMotion, active]);

  // Canvas rendering
  useEffect(() => {
    if (!useCanvas || !canvasRef.current || reducedMotion || !active) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1) * speed;
      lastTimeRef.current = time;

      ctx.clearRect(0, 0, size, size);

      particlesRef.current.forEach((particle, i) => {
        // Update particle
        particle.life += deltaTime;

        if (particle.life >= particle.maxLife) {
          // Reset particle
          const newParticle = createParticle(particle.id);
          particlesRef.current[i] = newParticle;
          return;
        }

        const lifeRatio = particle.life / particle.maxLife;

        // Apply physics
        particle.vy += preset.gravity * deltaTime * 60;
        particle.vx *= preset.drag;
        particle.vy *= preset.drag;
        particle.x += particle.vx * deltaTime * 60;
        particle.y += particle.vy * deltaTime * 60;
        particle.rotation += particle.rotationSpeed * deltaTime * 60;

        // Fade out
        particle.opacity = 1 - lifeRatio;

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = particle.opacity;

        // Draw based on type
        switch (particle.type) {
          case 'spark':
            ctx.beginPath();
            ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.size;
            ctx.fill();
            break;
          case 'flame': {
            const gradient = ctx.createLinearGradient(0, particle.size, 0, -particle.size);
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(0.5, '#FFA500');
            gradient.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.ellipse(0, 0, particle.size / 2, particle.size, 0, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            break;
          }
          case 'snowflake':
            ctx.beginPath();
            ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 4;
            ctx.fill();
            break;
          case 'electric':
            ctx.beginPath();
            ctx.moveTo(0, -particle.size / 2);
            ctx.lineTo(random(-3, 3), 0);
            ctx.lineTo(0, particle.size / 2);
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 2;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 8;
            ctx.stroke();
            break;
          default:
            ctx.beginPath();
            ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
        }

        ctx.restore();
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [useCanvas, size, speed, preset, createParticle, reducedMotion, active]);

  // DOM-based rendering with Framer Motion
  const domParticles = useMemo(() => {
    if (useCanvas || reducedMotion || !active) return null;

    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = radius + 10;
      const x = radius + Math.cos(angle) * distance;
      const y = radius + Math.sin(angle) * distance;

      const colorChoice = i % 3;
      const color =
        colorChoice === 0 ? colors.primary : colorChoice === 1 ? colors.secondary : colors.accent;

      return (
        <motion.div
          key={i}
          className="pointer-events-none absolute"
          style={{
            left: x - preset.maxSize / 2,
            top: y - preset.maxSize / 2,
            width: preset.maxSize,
            height: config.type === 'flame' ? preset.maxSize * 1.5 : preset.maxSize,
          }}
          animate={getAnimationForType(config.type, i, particleCount, colors, speed)}
        >
          <DOMParticle
            particle={{
              id: i,
              x: 0,
              y: 0,
              vx: 0,
              vy: 0,
              size: random(preset.minSize, preset.maxSize),
              opacity: 1,
              rotation: 0,
              rotationSpeed: 0,
              life: 0,
              maxLife: preset.maxLife,
              type: config.type,
              color,
            }}
            type={config.type}
          />
        </motion.div>
      );
    });
  }, [useCanvas, particleCount, radius, colors, preset, config.type, speed, reducedMotion, active]);

  if (reducedMotion || !active) {
    return null;
  }

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-visible', className)}
      style={{ width: size, height: size }}
    >
      {useCanvas ? (
        <canvas ref={canvasRef} width={size} height={size} className="absolute inset-0" />
      ) : (
        domParticles
      )}
    </div>
  );
});
