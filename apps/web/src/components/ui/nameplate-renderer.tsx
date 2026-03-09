/**
 * NameplateRenderer — reusable nameplate display component.
 *
 * Renders a nameplate bar with animated text effects, gradient background,
 * emblem icon, and particle overlays. Used across all UI surfaces:
 * - Friend list entries
 * - Group/channel member lists
 * - Forum member cards
 * - Online user panels
 * - Profile cards
 * - Chat message headers
 *
 * @module components/ui/nameplate-renderer
 */

import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import type {
  NameplateEntry,
  NameplateTextEffect,
  NameplateBorderStyle,
  NameplateParticleType,
} from '@cgraph/animation-constants';

// ─── Size Presets ────────────────────────────────────────────────────────────

type NameplateSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CONFIG: Record<NameplateSize, { height: string; fontSize: string; px: string; emblemSize: string; rounded: string }> = {
  xs: { height: 'h-6',  fontSize: 'text-[10px]', px: 'px-2',   emblemSize: 'text-[10px]', rounded: 'rounded' },
  sm: { height: 'h-8',  fontSize: 'text-xs',     px: 'px-2.5', emblemSize: 'text-xs',     rounded: 'rounded-md' },
  md: { height: 'h-10', fontSize: 'text-sm',     px: 'px-3',   emblemSize: 'text-sm',     rounded: 'rounded-lg' },
  lg: { height: 'h-12', fontSize: 'text-base',   px: 'px-4',   emblemSize: 'text-base',   rounded: 'rounded-lg' },
};

// ─── Text Effect CSS ─────────────────────────────────────────────────────────

function getTextEffectStyles(
  effect: NameplateTextEffect,
  primaryColor: string,
  secondaryColor: string | null,
): React.CSSProperties {
  switch (effect) {
    case 'glow':
      return {
        textShadow: `0 0 8px ${primaryColor}80, 0 0 20px ${primaryColor}40`,
      };
    case 'metallic':
      return {
        background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondaryColor ?? primaryColor} 50%, ${primaryColor} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
      };
    case 'holographic':
      return {
        background: `linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'nameplate-holo 3s linear infinite',
      };
    case 'fire':
      return {
        background: `linear-gradient(180deg, #ffd700 0%, #ff4500 50%, #8b0000 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 10px rgba(255,69,0,0.5)',
      };
    case 'ice':
      return {
        background: `linear-gradient(180deg, #e0f2fe 0%, #67e8f9 50%, #06b6d4 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 8px rgba(103,232,249,0.4)',
      };
    case 'neon':
      return {
        color: primaryColor,
        textShadow: `0 0 5px ${primaryColor}, 0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}80, 0 0 40px ${primaryColor}40`,
      };
    case 'glitch':
      return {
        color: primaryColor,
        textShadow: `2px 0 ${secondaryColor ?? '#ff0000'}, -2px 0 #00ff00`,
        animation: 'nameplate-glitch 2s infinite',
      };
    case 'rainbow':
      return {
        background: 'linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #8b00ff)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'nameplate-rainbow 4s linear infinite',
      };
    case 'shadow':
      return {
        textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
      };
    case 'emboss':
      return {
        textShadow: '1px 1px 0 rgba(255,255,255,0.2), -1px -1px 0 rgba(0,0,0,0.4)',
      };
    default:
      return {};
  }
}

// ─── Border Style CSS ────────────────────────────────────────────────────────

function getBorderStyles(
  style: NameplateBorderStyle,
  color: string | null,
): React.CSSProperties {
  if (!color || style === 'none') return {};

  switch (style) {
    case 'solid':
      return { border: `1px solid ${color}` };
    case 'gradient':
      return {
        border: '1px solid transparent',
        backgroundClip: 'padding-box',
        boxShadow: `inset 0 0 0 1px ${color}60`,
      };
    case 'animated':
      return {
        border: `1px solid ${color}60`,
        boxShadow: `0 0 8px ${color}30, inset 0 0 4px ${color}10`,
      };
    case 'double':
      return {
        border: `2px double ${color}80`,
      };
    case 'glow':
      return {
        border: `1px solid ${color}40`,
        boxShadow: `0 0 12px ${color}40, 0 0 4px ${color}20`,
      };
    default:
      return {};
  }
}

// ─── Particle Overlay ────────────────────────────────────────────────────────

function ParticleOverlay({ type }: { type: NameplateParticleType }) {
  if (type === 'none') return null;

  // CSS-only particle indicators (real Lottie particles would replace these)
  const particleConfig: Record<string, { emoji: string; count: number }> = {
    sparkles: { emoji: '✦', count: 3 },
    flames: { emoji: '🔥', count: 2 },
    snowflakes: { emoji: '❄', count: 3 },
    petals: { emoji: '🌸', count: 2 },
    lightning: { emoji: '⚡', count: 2 },
    bubbles: { emoji: '○', count: 3 },
    stars: { emoji: '✧', count: 3 },
    embers: { emoji: '•', count: 4 },
    mist: { emoji: '', count: 0 },
  };

  const config = particleConfig[type];
  if (!config || config.count === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: config.count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-[8px] opacity-60"
          style={{
            left: `${20 + i * 25}%`,
            top: '20%',
          }}
          animate={{
            y: [-2, 2, -2],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        >
          {config.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export interface NameplateRendererProps {
  /** The nameplate entry to render */
  nameplate: NameplateEntry;
  /** The username to display */
  username: string;
  /** Size preset */
  size?: NameplateSize;
  /** Whether to show particle animations */
  showParticles?: boolean;
  /** Whether to show the emblem */
  showEmblem?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Override width (default: auto) */
  width?: string;
}

/**
 * Renders a nameplate bar with all visual effects.
 * Memoized to prevent unnecessary re-renders in lists.
 */
export const NameplateRenderer = memo(function NameplateRenderer({
  nameplate,
  username,
  size = 'md',
  showParticles = true,
  showEmblem = true,
  className = '',
  width,
}: NameplateRendererProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const barBackground = useMemo(() => {
    if (nameplate.barGradient) {
      return `linear-gradient(135deg, ${nameplate.barGradient[0]} 0%, ${nameplate.barGradient[1]} 100%)`;
    }
    return 'transparent';
  }, [nameplate.barGradient]);

  const textStyles = useMemo(
    () => getTextEffectStyles(nameplate.textEffect, nameplate.textColor, nameplate.textColorSecondary),
    [nameplate.textEffect, nameplate.textColor, nameplate.textColorSecondary],
  );

  const borderStyles = useMemo(
    () => getBorderStyles(nameplate.borderStyle, nameplate.borderColor),
    [nameplate.borderStyle, nameplate.borderColor],
  );

  // "None" selected — render plain text only
  if (nameplate.id === 'plate_none') {
    return (
      <span
        className={`inline-flex items-center font-semibold ${sizeConfig.fontSize} ${className}`}
        style={{ color: nameplate.textColor }}
      >
        {username}
      </span>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 font-bold ${sizeConfig.height} ${sizeConfig.px} ${sizeConfig.rounded} ${className}`}
      style={{
        background: barBackground,
        ...borderStyles,
        width: width ?? undefined,
      }}
    >
      {/* Particle overlay */}
      {showParticles && <ParticleOverlay type={nameplate.particleType} />}

      {/* Emblem */}
      {showEmblem && nameplate.emblem && (
        <span className={`relative z-10 ${sizeConfig.emblemSize}`}>{nameplate.emblem}</span>
      )}

      {/* Username text with effects */}
      <span
        className={`relative z-10 ${sizeConfig.fontSize} font-bold whitespace-nowrap`}
        style={{
          color: nameplate.textColor,
          ...textStyles,
        }}
      >
        {username}
      </span>
    </div>
  );
});

export default NameplateRenderer;
