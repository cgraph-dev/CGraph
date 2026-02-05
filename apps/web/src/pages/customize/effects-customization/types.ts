/**
 * Type definitions for effects customization
 * @module pages/customize/effects-customization
 */

export type EffectCategory = 'particles' | 'backgrounds' | 'animations';

export interface ParticleEffect {
  id: string;
  name: string;
  description: string;
  type: string;
  density: 'low' | 'medium' | 'high';
  performance: 'light' | 'medium' | 'heavy';
  unlocked: boolean;
  unlockRequirement?: string;
  isPremium?: boolean;
}

export interface BackgroundEffect {
  id: string;
  name: string;
  description: string;
  preview: string;
  animated: boolean;
  performance: 'light' | 'medium' | 'heavy';
  unlocked: boolean;
  unlockRequirement?: string;
}

export interface AnimationSet {
  id: string;
  name: string;
  description: string;
  speed: 'instant' | 'fast' | 'normal' | 'smooth' | 'slow';
  easing: string;
  unlocked: boolean;
  unlockRequirement?: string;
}

// Particle data types for preview component
export interface BaseParticle {
  id: number;
  delay: number;
  duration: number;
}

export interface SnowParticle extends BaseParticle {
  startX: number;
  endX: number;
}

export interface StarsParticle extends BaseParticle {
  top: number;
  left: number;
}

export interface BubblesParticle extends BaseParticle {
  size: number;
  left: number;
}

export interface SparklesParticle extends BaseParticle {
  top: number;
  left: number;
  fontSize: number;
}

export interface ConfettiParticle extends BaseParticle {
  left: number;
  color: string;
}

export interface FirefliesParticle extends BaseParticle {
  top: number;
  left: number;
}
