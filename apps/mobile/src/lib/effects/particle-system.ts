/**
 * ParticleSystem - Advanced Particle Effects Engine for React Native
 *
 * Features:
 * - 8 particle types: sparkles, dots, stars, confetti, snow, rain, bubbles, fireflies
 * - Physics simulation: gravity, velocity, acceleration, drag
 * - Multiple emitter shapes: point, line, circle, rectangle
 * - Particle behaviors: float, fall, explode, orbit, attract, repel
 * - Performance auto-throttling based on device capability
 * - Color system with theme awareness
 */

import { Dimensions } from 'react-native';
import BlurEngine from './blur-engine';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ParticleType =
  | 'sparkles'
  | 'dots'
  | 'stars'
  | 'confetti'
  | 'snow'
  | 'rain'
  | 'bubbles'
  | 'fireflies';

export type EmitterShape = 'point' | 'line' | 'circle' | 'rectangle' | 'edge';

export type ParticleBehavior =
  | 'float'
  | 'fall'
  | 'rise'
  | 'explode'
  | 'implode'
  | 'orbit'
  | 'attract'
  | 'repel'
  | 'wander'
  | 'wave';

export interface Vector2D {
  x: number;
  y: number;
}

export interface ParticlePhysics {
  gravity: number; // Downward force (pixels/frame²)
  drag: number; // Air resistance (0-1)
  bounce: number; // Bounce coefficient (0-1)
  turbulence: number; // Random motion factor (0-1)
  wind: Vector2D; // Wind direction and strength
}

/** Input type for partial physics configuration */
export type ParticlePhysicsInput = Partial<ParticlePhysics>;

export interface ParticleConfig {
  type: ParticleType;
  count: number; // Number of particles (10-500)
  size: {
    min: number;
    max: number;
  };
  speed: {
    min: number;
    max: number;
  };
  lifetime: {
    min: number; // Milliseconds
    max: number;
  };
  opacity: {
    start: number;
    end: number;
  };
  colors: string[]; // Array of colors to choose from
  rotation: {
    enabled: boolean;
    speed: number; // Degrees per frame
  };
  scale: {
    start: number;
    end: number;
  };
  glow: {
    enabled: boolean;
    color: string;
    blur: number;
  };
}

export interface EmitterConfig {
  shape: EmitterShape;
  position: Vector2D; // Center position (0-1 normalized)
  size: Vector2D; // Width/height for rect, radius for circle
  direction: {
    min: number; // Degrees (0 = right, 90 = down)
    max: number;
  };
  rate: number; // Particles per second
  burst: boolean; // Emit all at once
  continuous: boolean; // Keep emitting
}

/** Input type for partial emitter configuration */
export type EmitterConfigInput = Partial<Omit<EmitterConfig, 'shape' | 'position' | 'size'>> &
  Pick<EmitterConfig, 'shape' | 'position' | 'size'>;

export interface Particle {
  id: number;
  type: ParticleType;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  size: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  opacity: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
  age: number;
  glow: boolean;
  glowColor: string;
  glowBlur: number;
}

export interface ParticleSystemConfig {
  particles: ParticleConfig | (Partial<ParticleConfig> & { type: ParticleType; count?: number });
  emitter?: EmitterConfigInput;
  physics?: ParticlePhysicsInput;
  behavior?: ParticleBehavior;
  bounds?: {
    width?: number;
    height?: number;
    contain?: boolean; // Keep particles within bounds
    wrap?: boolean; // Wrap around edges
  };
}

/** Internal resolved config type with all required fields */
interface ResolvedConfig {
  particles: ParticleConfig;
  emitter: EmitterConfig;
  physics: ParticlePhysics;
  behavior: ParticleBehavior;
  bounds: {
    width: number;
    height: number;
    contain: boolean;
    wrap: boolean;
  };
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_PHYSICS: ParticlePhysics = {
  gravity: 0.1,
  drag: 0.02,
  bounce: 0.6,
  turbulence: 0.1,
  wind: { x: 0, y: 0 },
};

const DEFAULT_EMITTER: EmitterConfig = {
  shape: 'rectangle',
  position: { x: 0.5, y: 0 },
  size: { x: 1, y: 0 },
  direction: { min: 80, max: 100 },
  rate: 10,
  burst: false,
  continuous: true,
};

// ============================================================================
// Particle Type Presets
// ============================================================================

const PARTICLE_PRESETS: Record<ParticleType, Partial<ParticleConfig>> = {
  sparkles: {
    size: { min: 2, max: 6 },
    speed: { min: 0.5, max: 2 },
    lifetime: { min: 500, max: 1500 },
    opacity: { start: 1, end: 0 },
    rotation: { enabled: true, speed: 5 },
    scale: { start: 1, end: 0.3 },
    glow: { enabled: true, color: '#ffffff', blur: 4 },
    colors: ['#FFD700', '#FFA500', '#FFFFFF', '#FFE4B5'],
  },
  dots: {
    size: { min: 3, max: 8 },
    speed: { min: 0.3, max: 1.5 },
    lifetime: { min: 2000, max: 5000 },
    opacity: { start: 0.8, end: 0.2 },
    rotation: { enabled: false, speed: 0 },
    scale: { start: 1, end: 1 },
    glow: { enabled: false, color: '#ffffff', blur: 0 },
    colors: ['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b'],
  },
  stars: {
    size: { min: 4, max: 12 },
    speed: { min: 0.2, max: 1 },
    lifetime: { min: 3000, max: 8000 },
    opacity: { start: 0, end: 1 },
    rotation: { enabled: true, speed: 2 },
    scale: { start: 0.5, end: 1 },
    glow: { enabled: true, color: '#ffffff', blur: 6 },
    colors: ['#FFFFFF', '#E8E8E8', '#FFE4B5', '#87CEEB'],
  },
  confetti: {
    size: { min: 6, max: 14 },
    speed: { min: 2, max: 5 },
    lifetime: { min: 2000, max: 4000 },
    opacity: { start: 1, end: 0.5 },
    rotation: { enabled: true, speed: 15 },
    scale: { start: 1, end: 0.8 },
    glow: { enabled: false, color: '#ffffff', blur: 0 },
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
  },
  snow: {
    size: { min: 3, max: 10 },
    speed: { min: 0.5, max: 2 },
    lifetime: { min: 5000, max: 10000 },
    opacity: { start: 0.9, end: 0.3 },
    rotation: { enabled: true, speed: 1 },
    scale: { start: 1, end: 0.7 },
    glow: { enabled: true, color: '#ffffff', blur: 3 },
    colors: ['#FFFFFF', '#F0F8FF', '#E6E6FA', '#F5F5F5'],
  },
  rain: {
    size: { min: 2, max: 4 },
    speed: { min: 8, max: 15 },
    lifetime: { min: 500, max: 1500 },
    opacity: { start: 0.6, end: 0.1 },
    rotation: { enabled: false, speed: 0 },
    scale: { start: 1, end: 1 },
    glow: { enabled: false, color: '#ffffff', blur: 0 },
    colors: ['#87CEEB', '#ADD8E6', '#B0E0E6', '#87CEFA'],
  },
  bubbles: {
    size: { min: 8, max: 24 },
    speed: { min: 0.5, max: 2 },
    lifetime: { min: 3000, max: 6000 },
    opacity: { start: 0.4, end: 0.1 },
    rotation: { enabled: false, speed: 0 },
    scale: { start: 0.5, end: 1.5 },
    glow: { enabled: true, color: '#87CEEB', blur: 4 },
    colors: ['rgba(135, 206, 235, 0.5)', 'rgba(173, 216, 230, 0.5)', 'rgba(255, 255, 255, 0.3)'],
  },
  fireflies: {
    size: { min: 3, max: 8 },
    speed: { min: 0.3, max: 1.5 },
    lifetime: { min: 2000, max: 5000 },
    opacity: { start: 0, end: 0 }, // Uses pulsing instead
    rotation: { enabled: false, speed: 0 },
    scale: { start: 1, end: 1 },
    glow: { enabled: true, color: '#FFFF00', blur: 10 },
    colors: ['#FFFF00', '#FFD700', '#90EE90', '#ADFF2F'],
  },
};

// ============================================================================
// Behavior Physics Modifiers
// ============================================================================

const BEHAVIOR_MODIFIERS: Record<ParticleBehavior, Partial<ParticlePhysics>> = {
  float: { gravity: -0.02, drag: 0.05, turbulence: 0.2 },
  fall: { gravity: 0.15, drag: 0.01, turbulence: 0.05 },
  rise: { gravity: -0.1, drag: 0.02, turbulence: 0.1 },
  explode: { gravity: 0.05, drag: 0.03, turbulence: 0 },
  implode: { gravity: -0.05, drag: 0.02, turbulence: 0 },
  orbit: { gravity: 0, drag: 0, turbulence: 0 },
  attract: { gravity: 0, drag: 0.01, turbulence: 0.05 },
  repel: { gravity: 0, drag: 0.02, turbulence: 0.1 },
  wander: { gravity: 0, drag: 0.01, turbulence: 0.4 },
  wave: { gravity: 0, drag: 0.02, turbulence: 0 },
};

// ============================================================================
// Particle System Engine
// ============================================================================

/**
 *
 */
export class ParticleEngine {
  private particles: Particle[] = [];
  private nextId: number = 0;
  private config: ResolvedConfig;
  private emitAccumulator: number = 0;
  private frameCount: number = 0;
  private maxParticles: number;

  constructor(config: ParticleSystemConfig) {
    const capabilities = BlurEngine.getCapabilities();

    // Determine max particles based on device tier
    this.maxParticles =
      capabilities.deviceTier === 'high' ? 500 : capabilities.deviceTier === 'mid' ? 200 : 100;

    const { width, height } = Dimensions.get('window');

    this.config = {
       
      particles: {
        type: config.particles?.type || 'dots',
        count: config.particles?.count || 50,
        ...PARTICLE_PRESETS[config.particles?.type || 'dots'],
        ...(config.particles?.colors && { colors: config.particles.colors }),
      } as ParticleConfig,

       
      emitter: { ...DEFAULT_EMITTER, ...config.emitter } as EmitterConfig,

       
      physics: { ...DEFAULT_PHYSICS, ...config.physics } as ParticlePhysics,
      behavior: config.behavior || 'float',
      bounds: {
        width,
        height,
        contain: true,
        wrap: false,
        ...config.bounds,
      },
    };

    // Apply behavior modifiers to physics
    const behaviorMod = BEHAVIOR_MODIFIERS[this.config.behavior];
    this.config.physics = { ...this.config.physics, ...behaviorMod };

    // Apply particle type preset
    const typePreset = PARTICLE_PRESETS[this.config.particles.type];
    this.config.particles = { ...this.config.particles, ...typePreset };
  }

  // ============================================================================
  // Particle Creation
  // ============================================================================

  private createParticle(): Particle {
    const { particles, bounds } = this.config;
    const position = this.getEmitterPosition();
    const direction = this.getRandomDirection();
    const speed = this.randomRange(particles.speed.min, particles.speed.max);

    const velocity: Vector2D = {
      x: Math.cos(direction) * speed,
      y: Math.sin(direction) * speed,
    };

    const lifetime = this.randomRange(particles.lifetime.min, particles.lifetime.max);

    return {
      id: this.nextId++,
      type: particles.type,
      position: { x: position.x * bounds.width, y: position.y * bounds.height },
      velocity,
      acceleration: { x: 0, y: 0 },
      size: this.randomRange(particles.size.min, particles.size.max),
      rotation: Math.random() * 360,
      rotationSpeed: particles.rotation.enabled
        ? particles.rotation.speed * (Math.random() - 0.5) * 2
        : 0,
      scale: particles.scale.start,
      opacity: particles.opacity.start,
      color: this.randomChoice(particles.colors),
      lifetime,
      maxLifetime: lifetime,
      age: 0,
      glow: particles.glow.enabled,
      glowColor: particles.glow.color,
      glowBlur: particles.glow.blur,
    };
  }

  private getEmitterPosition(): Vector2D {
    const { emitter } = this.config;

    switch (emitter.shape) {
      case 'point':
        return { ...emitter.position };

      case 'line': {
        const lineT = Math.random();
        return {
          x: emitter.position.x - emitter.size.x / 2 + lineT * emitter.size.x,
          y: emitter.position.y,
        };
      }

      case 'circle': {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * emitter.size.x;
        return {
          x: emitter.position.x + Math.cos(angle) * radius,
          y: emitter.position.y + Math.sin(angle) * radius,
        };
      }

      case 'rectangle':
        return {
          x: emitter.position.x - emitter.size.x / 2 + Math.random() * emitter.size.x,
          y: emitter.position.y - emitter.size.y / 2 + Math.random() * emitter.size.y,
        };

      case 'edge': {
        // Emit from screen edges
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
          case 0:
            return { x: Math.random(), y: 0 }; // Top
          case 1:
            return { x: 1, y: Math.random() }; // Right
          case 2:
            return { x: Math.random(), y: 1 }; // Bottom
          default:
            return { x: 0, y: Math.random() }; // Left
        }
      }

      default:
        return { ...emitter.position };
    }
  }

  private getRandomDirection(): number {
    const { emitter } = this.config;
    const min = emitter.direction.min * (Math.PI / 180);
    const max = emitter.direction.max * (Math.PI / 180);
    return this.randomRange(min, max);
  }

  // ============================================================================
  // Particle Updates
  // ============================================================================

  /**
   *
   */
  public update(deltaTime: number = 16): Particle[] {
    this.frameCount++;

    // Emit new particles
    this.emitParticles(deltaTime);

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update age
      particle.age += deltaTime;

      // Remove dead particles
      if (particle.age >= particle.lifetime) {
        this.particles.splice(i, 1);
        continue;
      }

      // Apply physics
      this.applyPhysics(particle);

      // Apply behavior-specific updates
      this.applyBehavior(particle);

      // Update visual properties
      this.updateVisuals(particle);

      // Handle bounds
      this.handleBounds(particle);
    }

    return this.particles;
  }

  private emitParticles(deltaTime: number): void {
    const { emitter, particles } = this.config;

    if (emitter.burst) {
      // Burst mode: emit all particles at once
      if (this.particles.length === 0) {
        const count = Math.min(particles.count, this.maxParticles);
        for (let i = 0; i < count; i++) {
          this.particles.push(this.createParticle());
        }
      }
    } else if (emitter.continuous) {
      // Continuous mode: emit based on rate
      this.emitAccumulator += (emitter.rate * deltaTime) / 1000;

      while (this.emitAccumulator >= 1 && this.particles.length < this.maxParticles) {
        this.particles.push(this.createParticle());
        this.emitAccumulator -= 1;
      }
    }
  }

  private applyPhysics(particle: Particle): void {
    const { physics } = this.config;

    // Apply gravity
    particle.velocity.y += physics.gravity;

    // Apply wind
    particle.velocity.x += physics.wind.x;
    particle.velocity.y += physics.wind.y;

    // Apply turbulence
    if (physics.turbulence > 0) {
      particle.velocity.x += (Math.random() - 0.5) * physics.turbulence;
      particle.velocity.y += (Math.random() - 0.5) * physics.turbulence;
    }

    // Apply drag
    particle.velocity.x *= 1 - physics.drag;
    particle.velocity.y *= 1 - physics.drag;

    // Apply acceleration
    particle.velocity.x += particle.acceleration.x;
    particle.velocity.y += particle.acceleration.y;

    // Update position
    particle.position.x += particle.velocity.x;
    particle.position.y += particle.velocity.y;

    // Update rotation
    particle.rotation += particle.rotationSpeed;
  }

  private applyBehavior(particle: Particle): void {
    const { bounds } = this.config;
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;

    switch (this.config.behavior) {
      case 'orbit': {
        const orbitSpeed = 0.02;
        const dx = particle.position.x - centerX;
        const dy = particle.position.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) + orbitSpeed;
        particle.position.x = centerX + Math.cos(angle) * distance;
        particle.position.y = centerY + Math.sin(angle) * distance;
        break;
      }

      case 'attract': {
        const attractDx = centerX - particle.position.x;
        const attractDy = centerY - particle.position.y;
        const attractDist = Math.sqrt(attractDx * attractDx + attractDy * attractDy);
        if (attractDist > 1) {
          particle.velocity.x += (attractDx / attractDist) * 0.1;
          particle.velocity.y += (attractDy / attractDist) * 0.1;
        }
        break;
      }

      case 'repel': {
        const repelDx = particle.position.x - centerX;
        const repelDy = particle.position.y - centerY;
        const repelDist = Math.sqrt(repelDx * repelDx + repelDy * repelDy);
        if (repelDist > 1 && repelDist < 200) {
          particle.velocity.x += (repelDx / repelDist) * 0.2;
          particle.velocity.y += (repelDy / repelDist) * 0.2;
        }
        break;
      }

      case 'wave':
        particle.position.y += Math.sin(this.frameCount * 0.05 + particle.id) * 0.5;
        break;

      case 'wander':
        particle.velocity.x += (Math.random() - 0.5) * 0.2;
        particle.velocity.y += (Math.random() - 0.5) * 0.2;
        break;

      default:
        // Other behaviors use physics defaults
        break;
    }
  }

  private updateVisuals(particle: Particle): void {
    const { particles } = this.config;
    const lifeProgress = particle.age / particle.maxLifetime;

    // Interpolate opacity
    particle.opacity = this.lerp(particles.opacity.start, particles.opacity.end, lifeProgress);

    // Interpolate scale
    particle.scale = this.lerp(particles.scale.start, particles.scale.end, lifeProgress);

    // Fireflies special case: pulsing opacity
    if (particle.type === 'fireflies') {
      particle.opacity = 0.3 + Math.sin(particle.age * 0.01) * 0.7;
    }
  }

  private handleBounds(particle: Particle): void {
    const { bounds, physics } = this.config;

    if (bounds.wrap) {
      // Wrap around edges
      if (particle.position.x < 0) particle.position.x = bounds.width;
      if (particle.position.x > bounds.width) particle.position.x = 0;
      if (particle.position.y < 0) particle.position.y = bounds.height;
      if (particle.position.y > bounds.height) particle.position.y = 0;
    } else if (bounds.contain) {
      // Bounce off edges
      if (particle.position.x < 0 || particle.position.x > bounds.width) {
        particle.velocity.x *= -physics.bounce;
        particle.position.x = Math.max(0, Math.min(bounds.width, particle.position.x));
      }
      if (particle.position.y < 0 || particle.position.y > bounds.height) {
        particle.velocity.y *= -physics.bounce;
        particle.position.y = Math.max(0, Math.min(bounds.height, particle.position.y));
      }
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   *
   */
  public burst(count?: number): void {
    const particleCount = count || this.config.particles.count;
    const toAdd = Math.min(particleCount, this.maxParticles - this.particles.length);

    for (let i = 0; i < toAdd; i++) {
      this.particles.push(this.createParticle());
    }
  }

  /**
   *
   */
  public clear(): void {
    this.particles = [];
  }

  /**
   *
   */
  public setType(type: ParticleType): void {
    this.config.particles.type = type;
    const preset = PARTICLE_PRESETS[type];
    this.config.particles = { ...this.config.particles, ...preset };
  }

  /**
   *
   */
  public setBehavior(behavior: ParticleBehavior): void {
    this.config.behavior = behavior;
    const modifier = BEHAVIOR_MODIFIERS[behavior];
    this.config.physics = { ...this.config.physics, ...modifier };
  }

  /**
   *
   */
  public setColors(colors: string[]): void {
    this.config.particles.colors = colors;
  }

  /**
   *
   */
  public setGravity(gravity: number): void {
    this.config.physics.gravity = gravity;
  }

  /**
   *
   */
  public setWind(x: number, y: number): void {
    this.config.physics.wind = { x, y };
  }

  /**
   *
   */
  public setEmitterPosition(x: number, y: number): void {
    this.config.emitter.position = { x, y };
  }

  /**
   *
   */
  public getParticles(): Particle[] {
    return this.particles;
  }

  /**
   *
   */
  public getCount(): number {
    return this.particles.length;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates sparkles.
 *
 */
export function createSparkles(count: number = 30): ParticleEngine {
  return new ParticleEngine({
     
    particles: { type: 'sparkles', count } as ParticleConfig,
    behavior: 'float',
    emitter: { shape: 'rectangle', position: { x: 0.5, y: 0.5 }, size: { x: 1, y: 1 } },
  });
}

/**
 * Creates confetti.
 *
 */
export function createConfetti(count: number = 100): ParticleEngine {
  return new ParticleEngine({
     
    particles: { type: 'confetti', count } as ParticleConfig,
    behavior: 'fall',
    emitter: { shape: 'line', position: { x: 0.5, y: 0 }, size: { x: 1, y: 0 }, burst: true },
  });
}

/**
 * Creates snow.
 *
 */
export function createSnow(count: number = 50): ParticleEngine {
  return new ParticleEngine({
     
    particles: { type: 'snow', count } as ParticleConfig,
    behavior: 'fall',
    emitter: {
      shape: 'line',
      position: { x: 0.5, y: -0.1 },
      size: { x: 1.2, y: 0 },
      continuous: true,
      rate: 5,
    },
    physics: { gravity: 0.03, turbulence: 0.15, wind: { x: 0.1, y: 0 } },
  });
}

/**
 * Creates rain.
 *
 */
export function createRain(count: number = 80): ParticleEngine {
  return new ParticleEngine({
     
    particles: { type: 'rain', count } as ParticleConfig,
    behavior: 'fall',
    emitter: {
      shape: 'line',
      position: { x: 0.5, y: -0.05 },
      size: { x: 1.2, y: 0 },
      continuous: true,
      rate: 20,
    },
    physics: { gravity: 0.5, wind: { x: 0.2, y: 0 } },
  });
}

/**
 * Creates fireflies.
 *
 */
export function createFireflies(count: number = 20): ParticleEngine {
  return new ParticleEngine({
     
    particles: { type: 'fireflies', count } as ParticleConfig,
    behavior: 'wander',
    emitter: { shape: 'rectangle', position: { x: 0.5, y: 0.5 }, size: { x: 1, y: 1 } },
    bounds: { contain: true, wrap: false },
  });
}

/**
 * Creates bubbles.
 *
 */
export function createBubbles(count: number = 25): ParticleEngine {
  return new ParticleEngine({
     
    particles: { type: 'bubbles', count } as ParticleConfig,
    behavior: 'rise',
    emitter: {
      shape: 'line',
      position: { x: 0.5, y: 1.1 },
      size: { x: 0.8, y: 0 },
      continuous: true,
      rate: 3,
    },
    physics: { gravity: -0.05, turbulence: 0.1 },
  });
}

/**
 * Creates stars.
 *
 */
export function createStars(count: number = 40): ParticleEngine {
  return new ParticleEngine({
     
    particles: { type: 'stars', count } as ParticleConfig,
    behavior: 'float',
    emitter: {
      shape: 'rectangle',
      position: { x: 0.5, y: 0.5 },
      size: { x: 1, y: 1 },
      burst: true,
    },
    physics: { gravity: 0, turbulence: 0.02 },
  });
}

// ============================================================================
// Default Export
// ============================================================================

const ParticleSystem = {
  ParticleEngine,
  createSparkles,
  createConfetti,
  createSnow,
  createRain,
  createFireflies,
  createBubbles,
  createStars,
  PRESETS: PARTICLE_PRESETS,
  BEHAVIORS: BEHAVIOR_MODIFIERS,
};

export default ParticleSystem;
