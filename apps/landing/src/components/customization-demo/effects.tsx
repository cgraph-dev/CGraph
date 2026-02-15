/**
 * Landing Effects - Self-contained effect components
 *
 * Inlined from the web app's effects module for standalone landing usage.
 * Components: AnimatedBorder, TiltCard, GlowText
 *
 * @module components/customization-demo/effects
 */

import type { ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ── Constants ───────────────────────────────────────────────────────────

const DEFAULT_COLORS = ['#10b981', '#06b6d4', '#8b5cf6'];
const DEFAULT_BORDER_RADIUS = '1rem';
const DEFAULT_MAX_TILT = 15;
const DEFAULT_PERSPECTIVE = 1000;
const TILT_SPRING_CONFIG = { stiffness: 300, damping: 30 };

// ── AnimatedBorder ──────────────────────────────────────────────────────

interface AnimatedBorderProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  borderRadius?: string;
  glowOnHover?: boolean;
}

export function AnimatedBorder({
  children,
  className = '',
  colors = DEFAULT_COLORS,
  borderRadius = DEFAULT_BORDER_RADIUS,
  glowOnHover = true,
}: AnimatedBorderProps) {
  const gradient = `linear-gradient(90deg, ${colors.join(', ')}, ${colors[0]})`;

  return (
    <div className={`group relative ${className}`}>
      {glowOnHover && (
        <div
          className="absolute -inset-[1px] opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100"
          style={{ borderRadius, background: gradient }}
        />
      )}
      <div
        className="absolute -inset-[2px] opacity-30"
        style={{
          borderRadius,
          background: gradient,
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 4s linear infinite',
        }}
      />
      <div className="relative bg-gray-900/90 p-1 backdrop-blur-xl" style={{ borderRadius }}>
        <div className="relative" style={{ borderRadius: `calc(${borderRadius} - 1px)` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── FlowingBorder ───────────────────────────────────────────────────────

/**
 * FlowingBorder — lightweight overlay that renders the animated
 * emerald→purple gradient ring from the navbar on any element.
 *
 * Requires the parent to be `position: relative` (or use the
 * `panel-border-glow` CSS class on the parent).
 *
 * @param borderRadius  CSS border-radius (default `'1rem'`)
 * @param variant       `'panel'` (visible at rest, bright on hover) or
 *                      `'button'` (hidden at rest, visible on group-hover)
 */
interface FlowingBorderProps {
  borderRadius?: string;
  variant?: 'panel' | 'button';
}

export function FlowingBorder({ borderRadius = '1rem', variant = 'panel' }: FlowingBorderProps) {
  const className = variant === 'button' ? 'btn-border-glow__border' : 'panel-border-glow__border';

  return <span className={className} style={{ borderRadius }} />;
}

// ── TiltCard ────────────────────────────────────────────────────────────

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  glare?: boolean;
}

export function TiltCard({
  children,
  className = '',
  maxTilt = DEFAULT_MAX_TILT,
  perspective = DEFAULT_PERSPECTIVE,
  glare = true,
}: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), TILT_SPRING_CONFIG);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), TILT_SPRING_CONFIG);

  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ perspective, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div className="relative" style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        {children}
        {glare && (
          <motion.div
            className="rounded-inherit pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              borderRadius: 'inherit',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// ── GlowText ────────────────────────────────────────────────────────────

interface GlowTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
}

export function GlowText({ children, className = '', colors = DEFAULT_COLORS }: GlowTextProps) {
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`;

  return (
    <span className={`relative ${className}`}>
      <span
        className="absolute inset-0 bg-clip-text text-transparent opacity-50 blur-xl"
        style={{ backgroundImage: gradient }}
      >
        {children}
      </span>
      <span
        className="relative bg-clip-text text-transparent"
        style={{ backgroundImage: gradient }}
      >
        {children}
      </span>
    </span>
  );
}
