import { memo, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ParticleType, ParticleConfig } from '@/types/avatar-borders';

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

// ==================== TYPE DEFINITIONS ====================

export interface BorderParticleSystemProps {
  /** Container size in pixels */
  size: number;
  /** Particle configuration */
  config: ParticleConfig;
  /** Whether particles are active */
  active?: boolean;
  /** Custom colors */
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /** Particle density multiplier (0.5 - 2) */
  density?: number;
  /** Animation speed multiplier */
  speed?: number;
  /** Use canvas rendering (better for many particles) */
  useCanvas?: boolean;
  /** Reduced motion mode */
  reducedMotion?: boolean;
  /** Custom class name */
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  color: string;
}

// ==================== PARTICLE PRESETS ====================

const PARTICLE_PRESETS: Record<ParticleType, {
  gravity: number;
  drag: number;
  minSize: number;
  maxSize: number;
  minLife: number;
  maxLife: number;
  spread: number;
  initialVelocity: { x: number; y: number };
}> = {
  spark: {
    gravity: 0,
    drag: 0.98,
    minSize: 2,
    maxSize: 4,
    minLife: 0.5,
    maxLife: 1,
    spread: 1,
    initialVelocity: { x: 0, y: 0 },
  },
  flame: {
    gravity: -0.1,
    drag: 0.95,
    minSize: 4,
    maxSize: 8,
    minLife: 0.8,
    maxLife: 1.5,
    spread: 0.3,
    initialVelocity: { x: 0, y: -2 },
  },
  snowflake: {
    gravity: 0.02,
    drag: 0.99,
    minSize: 4,
    maxSize: 8,
    minLife: 3,
    maxLife: 5,
    spread: 0.5,
    initialVelocity: { x: 0, y: 0.5 },
  },
  bubble: {
    gravity: -0.03,
    drag: 0.99,
    minSize: 6,
    maxSize: 12,
    minLife: 2,
    maxLife: 4,
    spread: 0.2,
    initialVelocity: { x: 0, y: -1 },
  },
  sakura: {
    gravity: 0.015,
    drag: 0.995,
    minSize: 6,
    maxSize: 10,
    minLife: 4,
    maxLife: 6,
    spread: 0.8,
    initialVelocity: { x: 0.5, y: 0.3 },
  },
  star: {
    gravity: 0,
    drag: 0.99,
    minSize: 4,
    maxSize: 8,
    minLife: 1,
    maxLife: 2,
    spread: 0.5,
    initialVelocity: { x: 0, y: 0 },
  },
  heart: {
    gravity: -0.02,
    drag: 0.98,
    minSize: 6,
    maxSize: 10,
    minLife: 2,
    maxLife: 3,
    spread: 0.4,
    initialVelocity: { x: 0, y: -1 },
  },
  coin: {
    gravity: 0,
    drag: 0.99,
    minSize: 6,
    maxSize: 10,
    minLife: 2,
    maxLife: 3,
    spread: 0.3,
    initialVelocity: { x: 0, y: 0 },
  },
  leaf: {
    gravity: 0.01,
    drag: 0.995,
    minSize: 5,
    maxSize: 10,
    minLife: 3,
    maxLife: 5,
    spread: 0.6,
    initialVelocity: { x: 0.3, y: 0.2 },
  },
  electric: {
    gravity: 0,
    drag: 0.9,
    minSize: 2,
    maxSize: 12,
    minLife: 0.1,
    maxLife: 0.3,
    spread: 0.8,
    initialVelocity: { x: 0, y: 0 },
  },
  rune: {
    gravity: 0,
    drag: 0.99,
    minSize: 8,
    maxSize: 12,
    minLife: 2,
    maxLife: 4,
    spread: 0.2,
    initialVelocity: { x: 0, y: 0 },
  },
  crystal: {
    gravity: 0,
    drag: 0.98,
    minSize: 4,
    maxSize: 10,
    minLife: 1.5,
    maxLife: 3,
    spread: 0.3,
    initialVelocity: { x: 0, y: 0 },
  },
  gear: {
    gravity: 0,
    drag: 0.995,
    minSize: 8,
    maxSize: 14,
    minLife: 3,
    maxLife: 5,
    spread: 0.2,
    initialVelocity: { x: 0, y: 0 },
  },
  pixel: {
    gravity: 0,
    drag: 0.98,
    minSize: 3,
    maxSize: 5,
    minLife: 0.5,
    maxLife: 1,
    spread: 0.5,
    initialVelocity: { x: 0, y: 0 },
  },
  glitch: {
    gravity: 0,
    drag: 0.9,
    minSize: 8,
    maxSize: 20,
    minLife: 0.1,
    maxLife: 0.2,
    spread: 1,
    initialVelocity: { x: 0, y: 0 },
  },
  void: {
    gravity: 0,
    drag: 0.99,
    minSize: 3,
    maxSize: 8,
    minLife: 1,
    maxLife: 2,
    spread: 0.6,
    initialVelocity: { x: 0, y: 0 },
  },
  // Additional particle types to complete ParticleType coverage
  circle: {
    gravity: 0,
    drag: 0.98,
    minSize: 4,
    maxSize: 10,
    minLife: 1,
    maxLife: 2,
    spread: 0.5,
    initialVelocity: { x: 0, y: 0 },
  },
  square: {
    gravity: 0,
    drag: 0.97,
    minSize: 4,
    maxSize: 8,
    minLife: 1,
    maxLife: 2,
    spread: 0.4,
    initialVelocity: { x: 0, y: 0 },
  },
  sparkle: {
    gravity: 0,
    drag: 0.98,
    minSize: 3,
    maxSize: 6,
    minLife: 0.5,
    maxLife: 1.5,
    spread: 0.6,
    initialVelocity: { x: 0, y: 0 },
  },
  petal: {
    gravity: 0.01,
    drag: 0.995,
    minSize: 5,
    maxSize: 10,
    minLife: 3,
    maxLife: 5,
    spread: 0.7,
    initialVelocity: { x: 0.4, y: 0.2 },
  },
  lightning: {
    gravity: 0,
    drag: 0.85,
    minSize: 2,
    maxSize: 15,
    minLife: 0.05,
    maxLife: 0.15,
    spread: 1,
    initialVelocity: { x: 0, y: 0 },
  },
  triangle: {
    gravity: 0,
    drag: 0.98,
    minSize: 5,
    maxSize: 10,
    minLife: 1.5,
    maxLife: 2.5,
    spread: 0.4,
    initialVelocity: { x: 0, y: 0 },
  },
  hexagon: {
    gravity: 0,
    drag: 0.98,
    minSize: 6,
    maxSize: 12,
    minLife: 2,
    maxLife: 3,
    spread: 0.3,
    initialVelocity: { x: 0, y: 0 },
  },
  custom: {
    gravity: 0,
    drag: 0.98,
    minSize: 4,
    maxSize: 10,
    minLife: 1,
    maxLife: 2,
    spread: 0.5,
    initialVelocity: { x: 0, y: 0 },
  },
};

// ==================== UTILITY FUNCTIONS ====================

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const getColorVariant = (baseColor: string, variation: number): string => {
  // Simple color variation by adjusting opacity
  const alpha = Math.max(0.3, Math.min(1, 1 + variation));
  if (baseColor.startsWith('#')) {
    return `${baseColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  }
  return baseColor;
};

// ==================== DOM PARTICLE COMPONENT ====================

interface DOMParticleProps {
  particle: Particle;
  type: ParticleType;
}

const DOMParticle = memo(function DOMParticle({ particle, type }: DOMParticleProps) {
  const getParticleStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      left: particle.x,
      top: particle.y,
      opacity: particle.opacity,
      transform: `rotate(${particle.rotation}deg)`,
      pointerEvents: 'none',
    };

    switch (type) {
      case 'spark':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: particle.color,
          borderRadius: '50%',
          boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
        };
      case 'flame':
        return {
          ...base,
          width: particle.size,
          height: particle.size * 1.5,
          background: `linear-gradient(to top, ${particle.color}, orange, transparent)`,
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          filter: 'blur(1px)',
        };
      case 'snowflake':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 4px rgba(255,255,255,0.8)',
        };
      case 'bubble':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: 'transparent',
          border: `1px solid ${particle.color}`,
          borderRadius: '50%',
        };
      case 'sakura':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: '#FFB7C5',
          borderRadius: '50% 0 50% 0',
        };
      case 'star':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: particle.color,
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        };
      case 'heart':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: '#FF6B9D',
          clipPath: 'polygon(50% 100%, 0% 35%, 25% 0%, 50% 15%, 75% 0%, 100% 35%)',
        };
      case 'electric':
        return {
          ...base,
          width: 2,
          height: particle.size,
          background: `linear-gradient(to bottom, transparent, ${particle.color}, transparent)`,
        };
      case 'pixel':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: particle.color,
          imageRendering: 'pixelated',
        };
      case 'glitch':
        return {
          ...base,
          width: particle.size * 3,
          height: 2,
          background: particle.color,
          mixBlendMode: 'screen',
        };
      default:
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: particle.color,
          borderRadius: '50%',
        };
    }
  };

  return <div style={getParticleStyle()} />;
});

// ==================== MAIN COMPONENT ====================

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
  const createParticle = useCallback((id: number): Particle => {
    const angle = random(0, Math.PI * 2);
    const distance = radius + random(5, 15);
    const x = radius + Math.cos(angle) * distance;
    const y = radius + Math.sin(angle) * distance;

    const colorChoice = random(0, 1);
    const color = colorChoice < 0.4 ? colors.primary : colorChoice < 0.7 ? colors.secondary : colors.accent;

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
  }, [radius, colors, preset, config.type]);

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
      const color = colorChoice === 0 ? colors.primary : colorChoice === 1 ? colors.secondary : colors.accent;

      return (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
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
      className={cn('absolute inset-0 pointer-events-none overflow-visible', className)}
      style={{ width: size, height: size }}
    >
      {useCanvas ? (
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="absolute inset-0"
        />
      ) : (
        domParticles
      )}
    </div>
  );
});

// ==================== ANIMATION HELPERS ====================

function getAnimationForType(
  type: ParticleType,
  index: number,
  total: number,
  _colors: { primary: string; secondary: string; accent: string },
  speed: number
) {
  const delay = (index / total) * 2;
  const duration = 2 / speed;

  switch (type) {
    case 'flame':
      return {
        y: [0, -15, 0],
        opacity: [1, 0.5, 1],
        scale: [1, 1.2, 1],
        transition: { duration: 0.8 / speed, repeat: Infinity, delay: delay * 0.3 },
      };
    case 'snowflake':
      return {
        y: [0, 20],
        x: [0, Math.sin(index) * 5],
        opacity: [1, 0],
        transition: { duration: 3 / speed, repeat: Infinity, delay: delay * 0.5 },
      };
    case 'bubble':
      return {
        y: [0, -20],
        opacity: [0.8, 0],
        scale: [0.5, 1.2],
        transition: { duration: 2 / speed, repeat: Infinity, delay: delay * 0.3 },
      };
    case 'sakura':
      return {
        y: [0, 30],
        x: [0, Math.sin(index * 2) * 15],
        rotate: [0, 360],
        opacity: [1, 0],
        transition: { duration: 3 / speed, repeat: Infinity, delay: delay * 0.4 },
      };
    case 'electric':
      return {
        opacity: [0, 1, 0],
        scaleY: [0.5, 1.5, 0.5],
        transition: { duration: 0.2 / speed, repeat: Infinity, delay: index * 0.05 },
      };
    case 'star':
      return {
        scale: [0.8, 1.2, 0.8],
        opacity: [0.6, 1, 0.6],
        rotate: [0, 180, 360],
        transition: { duration: duration, repeat: Infinity, delay },
      };
    case 'heart':
      return {
        y: [0, -15],
        scale: [0.8, 1.1, 0.8],
        opacity: [1, 0],
        transition: { duration: duration, repeat: Infinity, delay },
      };
    case 'pixel':
      return {
        opacity: [0.5, 1, 0.5],
        transition: { duration: 0.3 / speed, repeat: Infinity, delay: index * 0.02 },
      };
    case 'glitch':
      return {
        x: [0, random(-10, 10), 0],
        opacity: [0, 1, 0],
        transition: { duration: 0.1 / speed, repeat: Infinity, delay: random(0, 0.5) },
      };
    default:
      return {
        rotate: [0, 360],
        transition: { duration: 4 / speed, repeat: Infinity, ease: 'linear' as const, delay },
      };
  }
}

// ==================== PRESET WRAPPERS ====================

// Default config values for preset wrappers
const createPresetConfig = (type: ParticleType, count: number): ParticleConfig => ({
  type,
  count,
  size: PARTICLE_PRESETS[type]?.maxSize || 8,
  color: '#ffffff',
  opacity: 1,
  speed: 1,
  direction: 'random',
  pattern: 'orbit',
});

export const FlameParticles = memo(function FlameParticles(props: Omit<BorderParticleSystemProps, 'config'>) {
  return <BorderParticleSystem {...props} config={createPresetConfig('flame', 12)} />;
});

export const SparkParticles = memo(function SparkParticles(props: Omit<BorderParticleSystemProps, 'config'>) {
  return <BorderParticleSystem {...props} config={createPresetConfig('spark', 16)} />;
});

export const SnowflakeParticles = memo(function SnowflakeParticles(props: Omit<BorderParticleSystemProps, 'config'>) {
  return <BorderParticleSystem {...props} config={createPresetConfig('snowflake', 20)} />;
});

export const SakuraParticles = memo(function SakuraParticles(props: Omit<BorderParticleSystemProps, 'config'>) {
  return <BorderParticleSystem {...props} config={createPresetConfig('sakura', 15)} />;
});

export const ElectricParticles = memo(function ElectricParticles(props: Omit<BorderParticleSystemProps, 'config'>) {
  return <BorderParticleSystem {...props} config={createPresetConfig('electric', 8)} />;
});

export default BorderParticleSystem;
