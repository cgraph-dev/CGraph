/**
 * ParticleView - React Native Particle Rendering Component
 *
 * Renders particles from ParticleEngine using React Native Animated API
 * with Reanimated for smooth 60fps performance.
 *
 * Features:
 * - Efficient batch rendering
 * - Shape rendering per particle type
 * - Glow effects support
 * - Performance auto-throttling
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Dimensions } from 'react-native';
import { runOnJS, useFrameCallback } from 'react-native-reanimated';
import Svg, { Circle, Rect, Polygon, G } from 'react-native-svg';

import {
  ParticleEngine,
  Particle,
  ParticleType,
  ParticleBehavior,
  _ParticleConfig,
  _EmitterConfig,
} from './particle-system';
import BlurEngine from './blur-engine';

// ============================================================================
// Types
// ============================================================================

export interface ParticleViewProps {
  type?: ParticleType;
  behavior?: ParticleBehavior;
  count?: number;
  colors?: string[];
  continuous?: boolean;
  burst?: boolean;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onParticleCount?: (count: number) => void;
  emitterPosition?: { x: number; y: number };
  emitterShape?: 'point' | 'line' | 'circle' | 'rectangle' | 'edge';
  gravity?: number;
  wind?: { x: number; y: number };
}

// ============================================================================
// Particle Shape Components
// ============================================================================

interface ParticleShapeProps {
  particle: Particle;
}

function SparkleShape({ particle }: ParticleShapeProps) {
  const points = [];
  const innerRadius = particle.size * 0.4 * particle.scale;
  const outerRadius = particle.size * particle.scale;
  const cx = particle.position.x;
  const cy = particle.position.y;

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + (particle.rotation * Math.PI) / 180;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }

  return (
    <G opacity={particle.opacity}>
      {particle.glow && (
        <Circle
          cx={cx}
          cy={cy}
          r={outerRadius + particle.glowBlur}
          fill={particle.glowColor}
          opacity={0.3}
        />
      )}
      <Polygon points={points.join(' ')} fill={particle.color} />
    </G>
  );
}

function DotShape({ particle }: ParticleShapeProps) {
  const radius = (particle.size / 2) * particle.scale;

  return (
    <G opacity={particle.opacity}>
      {particle.glow && (
        <Circle
          cx={particle.position.x}
          cy={particle.position.y}
          r={radius + particle.glowBlur}
          fill={particle.glowColor}
          opacity={0.3}
        />
      )}
      <Circle cx={particle.position.x} cy={particle.position.y} r={radius} fill={particle.color} />
    </G>
  );
}

function StarShape({ particle }: ParticleShapeProps) {
  const points = [];
  const innerRadius = particle.size * 0.4 * particle.scale;
  const outerRadius = particle.size * particle.scale;
  const cx = particle.position.x;
  const cy = particle.position.y;

  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2 + (particle.rotation * Math.PI) / 180;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }

  return (
    <G opacity={particle.opacity}>
      {particle.glow && (
        <Circle
          cx={cx}
          cy={cy}
          r={outerRadius + particle.glowBlur}
          fill={particle.glowColor}
          opacity={0.4}
        />
      )}
      <Polygon points={points.join(' ')} fill={particle.color} />
    </G>
  );
}

function ConfettiShape({ particle }: ParticleShapeProps) {
  const width = particle.size * particle.scale;
  const height = particle.size * 0.4 * particle.scale;

  return (
    <G opacity={particle.opacity}>
      <Rect
        x={particle.position.x - width / 2}
        y={particle.position.y - height / 2}
        width={width}
        height={height}
        fill={particle.color}
        rotation={particle.rotation}
        origin={`${particle.position.x}, ${particle.position.y}`}
      />
    </G>
  );
}

function SnowflakeShape({ particle }: ParticleShapeProps) {
  const size = particle.size * particle.scale;
  const cx = particle.position.x;
  const cy = particle.position.y;

  return (
    <G opacity={particle.opacity}>
      {particle.glow && (
        <Circle
          cx={cx}
          cy={cy}
          r={size + particle.glowBlur}
          fill={particle.glowColor}
          opacity={0.2}
        />
      )}
      <Circle cx={cx} cy={cy} r={size / 2} fill={particle.color} />
    </G>
  );
}

function RainShape({ particle }: ParticleShapeProps) {
  const length = particle.size * 3 * particle.scale;
  const width = particle.size * 0.3 * particle.scale;

  return (
    <G opacity={particle.opacity}>
      <Rect
        x={particle.position.x - width / 2}
        y={particle.position.y - length / 2}
        width={width}
        height={length}
        fill={particle.color}
        rx={width / 2}
      />
    </G>
  );
}

function BubbleShape({ particle }: ParticleShapeProps) {
  const radius = (particle.size / 2) * particle.scale;
  const cx = particle.position.x;
  const cy = particle.position.y;
  const highlightRadius = radius * 0.3;
  const highlightOffset = radius * 0.3;

  return (
    <G opacity={particle.opacity}>
      {particle.glow && (
        <Circle
          cx={cx}
          cy={cy}
          r={radius + particle.glowBlur}
          fill={particle.glowColor}
          opacity={0.2}
        />
      )}
      {/* Bubble body */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={particle.color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={1}
      />
      {/* Highlight */}
      <Circle
        cx={cx - highlightOffset}
        cy={cy - highlightOffset}
        r={highlightRadius}
        fill="rgba(255, 255, 255, 0.5)"
      />
    </G>
  );
}

function FireflyShape({ particle }: ParticleShapeProps) {
  const radius = (particle.size / 2) * particle.scale;
  const cx = particle.position.x;
  const cy = particle.position.y;

  return (
    <G opacity={particle.opacity}>
      {/* Outer glow */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius + particle.glowBlur * 2}
        fill={particle.glowColor}
        opacity={0.2}
      />
      {/* Inner glow */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius + particle.glowBlur}
        fill={particle.glowColor}
        opacity={0.4}
      />
      {/* Core */}
      <Circle cx={cx} cy={cy} r={radius} fill={particle.color} />
    </G>
  );
}

// ============================================================================
// Shape Renderer
// ============================================================================

function renderParticle(particle: Particle) {
  switch (particle.type) {
    case 'sparkles':
      return <SparkleShape key={particle.id} particle={particle} />;
    case 'dots':
      return <DotShape key={particle.id} particle={particle} />;
    case 'stars':
      return <StarShape key={particle.id} particle={particle} />;
    case 'confetti':
      return <ConfettiShape key={particle.id} particle={particle} />;
    case 'snow':
      return <SnowflakeShape key={particle.id} particle={particle} />;
    case 'rain':
      return <RainShape key={particle.id} particle={particle} />;
    case 'bubbles':
      return <BubbleShape key={particle.id} particle={particle} />;
    case 'fireflies':
      return <FireflyShape key={particle.id} particle={particle} />;
    default:
      return <DotShape key={particle.id} particle={particle} />;
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Particle View component.
 *
 */
export default function ParticleView({
  type = 'dots',
  behavior = 'float',
  count = 50,
  colors,
  continuous = true,
  burst = false,
  enabled = true,
  style,
  onParticleCount,
  emitterPosition,
  emitterShape = 'rectangle',
  gravity,
  wind,
}: ParticleViewProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const engineRef = useRef<ParticleEngine | null>(null);
  const { width, height } = Dimensions.get('window');

  // Device tier for performance optimization
  const capabilities = useMemo(() => BlurEngine.getCapabilities(), []);
  const maxParticles =
    capabilities.deviceTier === 'high'
      ? count
      : capabilities.deviceTier === 'mid'
        ? Math.min(count, 100)
        : Math.min(count, 50);

  // Initialize engine
  useEffect(() => {
    engineRef.current = new ParticleEngine({
      particles: {
        type,
        count: maxParticles,
        colors: colors || undefined,
      },
      behavior,
      emitter: {
        shape: emitterShape,
        position: emitterPosition || { x: 0.5, y: 0.5 },
        size: { x: 1, y: 1 },
        burst,
        continuous,
        rate: 10,
      },
      physics: {
        gravity: gravity ?? undefined,
        wind: wind ?? undefined,
      },
      bounds: {
        width,
        height,
        contain: true,
        wrap: behavior === 'float' || behavior === 'wander',
      },
    });

    if (colors) {
      engineRef.current.setColors(colors);
    }

    return () => {
      engineRef.current?.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, behavior, maxParticles, burst, continuous, emitterShape, width, height]);

  // Update engine properties
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setType(type);
      engineRef.current.setBehavior(behavior);
      if (colors) engineRef.current.setColors(colors);
      if (gravity !== undefined) engineRef.current.setGravity(gravity);
      if (wind) engineRef.current.setWind(wind.x, wind.y);
      if (emitterPosition) {
        engineRef.current.setEmitterPosition(emitterPosition.x, emitterPosition.y);
      }
    }
  }, [type, behavior, colors, gravity, wind, emitterPosition]);

  // Animation frame callback
  const updateParticles = useCallback(() => {
    if (engineRef.current && enabled) {
      const updatedParticles = engineRef.current.update(16);
      setParticles([...updatedParticles]);
      onParticleCount?.(updatedParticles.length);
    }
  }, [enabled, onParticleCount]);

  // Use Reanimated frame callback for smooth updates
  useFrameCallback((_frameInfo) => {
    'worklet';
    runOnJS(updateParticles)();
  }, enabled);

  // Burst trigger
  const triggerBurst = useCallback((burstCount?: number) => {
    engineRef.current?.burst(burstCount);
  }, []);

  // Initial burst if burst mode
  useEffect(() => {
    if (burst && enabled) {
      triggerBurst(maxParticles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst, enabled, maxParticles]);

  if (!enabled) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {particles.map(renderParticle)}
      </Svg>
    </View>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * Sparkles View component.
 *
 */
export function SparklesView(props: Omit<ParticleViewProps, 'type'>) {
  return <ParticleView {...props} type="sparkles" behavior="float" />;
}

/**
 * Confetti View component.
 *
 */
export function ConfettiView(props: Omit<ParticleViewProps, 'type' | 'burst'>) {
  return <ParticleView {...props} type="confetti" behavior="fall" burst continuous={false} />;
}

/**
 * Snow View component.
 *
 */
export function SnowView(props: Omit<ParticleViewProps, 'type'>) {
  return (
    <ParticleView
      {...props}
      type="snow"
      behavior="fall"
      emitterShape="line"
      emitterPosition={{ x: 0.5, y: 0 }}
    />
  );
}

/**
 * Rain View component.
 *
 */
export function RainView(props: Omit<ParticleViewProps, 'type'>) {
  return (
    <ParticleView
      {...props}
      type="rain"
      behavior="fall"
      emitterShape="line"
      emitterPosition={{ x: 0.5, y: 0 }}
    />
  );
}

/**
 * Fireflies View component.
 *
 */
export function FirefliesView(props: Omit<ParticleViewProps, 'type'>) {
  return <ParticleView {...props} type="fireflies" behavior="wander" />;
}

/**
 * Bubbles View component.
 *
 */
export function BubblesView(props: Omit<ParticleViewProps, 'type'>) {
  return (
    <ParticleView
      {...props}
      type="bubbles"
      behavior="rise"
      emitterShape="line"
      emitterPosition={{ x: 0.5, y: 1 }}
    />
  );
}

/**
 * Stars View component.
 *
 */
export function StarsView(props: Omit<ParticleViewProps, 'type'>) {
  return <ParticleView {...props} type="stars" behavior="float" />;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
