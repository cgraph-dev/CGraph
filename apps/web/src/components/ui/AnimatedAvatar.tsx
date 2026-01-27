import { motion, AnimatePresence, type Transition, type TargetAndTransition } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';

type AnimationReturn = {
  animate?: TargetAndTransition;
  transition?: Transition;
};

/**
 * Enhanced Animated Avatar Component v2.0
 *
 * Premium avatar borders with 25+ animation styles.
 * Designed for monetization with free and premium tiers.
 */

// Border style categories for organization
export type BorderCategory = 'free' | 'premium' | 'legendary' | 'limited';

export type BorderStyleType =
  // Free styles
  | 'none'
  | 'solid'
  | 'gradient'
  | 'pulse'
  // Premium styles
  | 'rainbow'
  | 'spin'
  | 'glow'
  | 'neon'
  | 'fire'
  | 'electric'
  | 'aurora'
  | 'plasma'
  | 'cosmic'
  | 'matrix'
  | 'holographic'
  | 'diamond'
  | 'emerald'
  | 'ruby'
  | 'sapphire'
  | 'amethyst'
  // Legendary styles
  | 'supernova'
  | 'black_hole'
  | 'quantum'
  | 'void'
  | 'celestial'
  // Limited edition
  | 'anniversary'
  | 'founders'
  | 'champion';

export interface AvatarStyle {
  borderStyle: BorderStyleType;
  borderWidth: number;
  borderColor: string;
  secondaryColor: string;
  glowIntensity: number;
  animationSpeed: 'none' | 'slow' | 'normal' | 'fast' | 'ultra';
  shape: 'circle' | 'rounded-square' | 'hexagon' | 'octagon' | 'shield' | 'diamond';
  particleEffect: 'none' | 'sparkles' | 'bubbles' | 'flames' | 'snow' | 'hearts' | 'stars';
  pulseOnHover: boolean;
  showLevel: boolean;
  levelBadgeStyle: 'default' | 'minimal' | 'ornate' | 'cyber';
}

export interface BorderStyleInfo {
  id: BorderStyleType;
  name: string;
  category: BorderCategory;
  description: string;
  coinPrice: number;
  preview: string;
}

// Border style metadata for shop/settings
export const BORDER_STYLES: BorderStyleInfo[] = [
  // Free
  {
    id: 'none',
    name: 'None',
    category: 'free',
    description: 'No border',
    coinPrice: 0,
    preview: '',
  },
  {
    id: 'solid',
    name: 'Solid',
    category: 'free',
    description: 'Simple solid border',
    coinPrice: 0,
    preview: 'border-2 border-current',
  },
  {
    id: 'gradient',
    name: 'Gradient',
    category: 'free',
    description: 'Smooth gradient border',
    coinPrice: 0,
    preview: 'bg-gradient-to-r from-primary-500 to-purple-500',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    category: 'free',
    description: 'Gentle pulsing animation',
    coinPrice: 0,
    preview: 'animate-pulse',
  },

  // Premium
  {
    id: 'rainbow',
    name: 'Rainbow',
    category: 'premium',
    description: 'Cycling rainbow colors',
    coinPrice: 500,
    preview: '',
  },
  {
    id: 'spin',
    name: 'Spinning',
    category: 'premium',
    description: 'Rotating gradient border',
    coinPrice: 600,
    preview: '',
  },
  {
    id: 'glow',
    name: 'Soft Glow',
    category: 'premium',
    description: 'Ethereal glowing effect',
    coinPrice: 700,
    preview: '',
  },
  {
    id: 'neon',
    name: 'Neon Sign',
    category: 'premium',
    description: 'Retro neon light effect',
    coinPrice: 800,
    preview: '',
  },
  {
    id: 'fire',
    name: 'Inferno',
    category: 'premium',
    description: 'Blazing fire effect',
    coinPrice: 900,
    preview: '',
  },
  {
    id: 'electric',
    name: 'Electric',
    category: 'premium',
    description: 'Crackling electricity',
    coinPrice: 900,
    preview: '',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    category: 'premium',
    description: 'Northern lights shimmer',
    coinPrice: 1000,
    preview: '',
  },
  {
    id: 'plasma',
    name: 'Plasma',
    category: 'premium',
    description: 'Energetic plasma waves',
    coinPrice: 1100,
    preview: '',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Dust',
    category: 'premium',
    description: 'Starry cosmic effect',
    coinPrice: 1200,
    preview: '',
  },
  {
    id: 'matrix',
    name: 'Digital Rain',
    category: 'premium',
    description: 'Matrix-style data rain',
    coinPrice: 1200,
    preview: '',
  },
  {
    id: 'holographic',
    name: 'Holographic',
    category: 'premium',
    description: 'Prismatic holographic shift',
    coinPrice: 1500,
    preview: '',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'premium',
    description: 'Brilliant diamond sparkle',
    coinPrice: 1500,
    preview: '',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    category: 'premium',
    description: 'Lush emerald glow',
    coinPrice: 1300,
    preview: '',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'premium',
    description: 'Deep ruby radiance',
    coinPrice: 1300,
    preview: '',
  },
  {
    id: 'sapphire',
    name: 'Sapphire',
    category: 'premium',
    description: 'Ocean blue brilliance',
    coinPrice: 1300,
    preview: '',
  },
  {
    id: 'amethyst',
    name: 'Amethyst',
    category: 'premium',
    description: 'Mystical purple aura',
    coinPrice: 1300,
    preview: '',
  },

  // Legendary
  {
    id: 'supernova',
    name: 'Supernova',
    category: 'legendary',
    description: 'Explosive stellar burst',
    coinPrice: 3000,
    preview: '',
  },
  {
    id: 'black_hole',
    name: 'Event Horizon',
    category: 'legendary',
    description: 'Gravitational distortion',
    coinPrice: 3500,
    preview: '',
  },
  {
    id: 'quantum',
    name: 'Quantum Flux',
    category: 'legendary',
    description: 'Reality-bending particles',
    coinPrice: 4000,
    preview: '',
  },
  {
    id: 'void',
    name: 'Void Walker',
    category: 'legendary',
    description: 'Dark matter emanation',
    coinPrice: 4500,
    preview: '',
  },
  {
    id: 'celestial',
    name: 'Celestial',
    category: 'legendary',
    description: 'Heavenly divine light',
    coinPrice: 5000,
    preview: '',
  },

  // Limited
  {
    id: 'anniversary',
    name: 'Anniversary',
    category: 'limited',
    description: 'Special anniversary edition',
    coinPrice: 0,
    preview: '',
  },
  {
    id: 'founders',
    name: 'Founders',
    category: 'limited',
    description: 'Exclusive to early adopters',
    coinPrice: 0,
    preview: '',
  },
  {
    id: 'champion',
    name: 'Champion',
    category: 'limited',
    description: 'Leaderboard top 3 reward',
    coinPrice: 0,
    preview: '',
  },
];

const defaultAvatarStyle: AvatarStyle = {
  borderStyle: 'gradient',
  borderWidth: 3,
  borderColor: '#10b981',
  secondaryColor: '#8b5cf6',
  glowIntensity: 50,
  animationSpeed: 'normal',
  shape: 'circle',
  particleEffect: 'none',
  pulseOnHover: true,
  showLevel: false,
  levelBadgeStyle: 'default',
};

export const useAvatarStyle = create<{
  style: AvatarStyle;
  ownedStyles: BorderStyleType[];
  updateStyle: <K extends keyof AvatarStyle>(key: K, value: AvatarStyle[K]) => void;
  resetStyle: () => void;
  addOwnedStyle: (style: BorderStyleType) => void;
  exportStyle: () => string;
  importStyle: (json: string) => boolean;
}>()(
  persist(
    (set, get) => ({
      style: defaultAvatarStyle,
      ownedStyles: ['none', 'solid', 'gradient', 'pulse'],
      updateStyle: (key, value) => {
        set((state) => ({
          style: { ...state.style, [key]: value },
        }));
      },
      resetStyle: () => set({ style: defaultAvatarStyle }),
      addOwnedStyle: (style) => {
        set((state) => ({
          ownedStyles: [...new Set([...state.ownedStyles, style])],
        }));
      },
      exportStyle: () => JSON.stringify(get().style),
      importStyle: (json) => {
        try {
          const parsed = JSON.parse(json);
          set({ style: { ...defaultAvatarStyle, ...parsed } });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'cgraph-avatar-style-v2',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);

interface AnimatedAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  fallbackText?: string;
  customStyle?: Partial<AvatarStyle>;
  className?: string;
  onClick?: () => void;
  showStatus?: boolean;
  statusType?: 'online' | 'idle' | 'dnd' | 'offline';
  level?: number;
  isPremium?: boolean;
  isVerified?: boolean;
  title?: { name: string; color: string; animation?: string };
}

export default function AnimatedAvatar({
  src,
  alt,
  size = 'md',
  fallbackText,
  customStyle,
  className = '',
  onClick,
  showStatus = false,
  statusType = 'offline',
  level,
  isPremium,
  isVerified,
  title,
}: AnimatedAvatarProps) {
  const { style: globalStyle } = useAvatarStyle();
  const style = useMemo(
    () => (customStyle ? { ...globalStyle, ...customStyle } : globalStyle),
    [globalStyle, customStyle]
  );

  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>(
    []
  );

  // Generate particles for effects
  useEffect(() => {
    if (style.particleEffect !== 'none') {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
      }));
      setParticles(newParticles);
    }
  }, [style.particleEffect]);

  const sizeConfig = {
    xs: { container: 'h-6 w-6', text: '0.6rem', badge: 'h-2 w-2', levelSize: '8px' },
    sm: { container: 'h-8 w-8', text: '0.75rem', badge: 'h-2.5 w-2.5', levelSize: '10px' },
    md: { container: 'h-10 w-10', text: '0.875rem', badge: 'h-3 w-3', levelSize: '12px' },
    lg: { container: 'h-12 w-12', text: '1rem', badge: 'h-3.5 w-3.5', levelSize: '14px' },
    xl: { container: 'h-16 w-16', text: '1.25rem', badge: 'h-4 w-4', levelSize: '16px' },
    '2xl': { container: 'h-24 w-24', text: '1.75rem', badge: 'h-5 w-5', levelSize: '20px' },
    '3xl': { container: 'h-32 w-32', text: '2.25rem', badge: 'h-6 w-6', levelSize: '24px' },
  };

  const statusColors = {
    online: { bg: 'bg-green-500', glow: 'rgba(34, 197, 94, 0.6)' },
    idle: { bg: 'bg-yellow-500', glow: 'rgba(234, 179, 8, 0.6)' },
    dnd: { bg: 'bg-red-500', glow: 'rgba(239, 68, 68, 0.6)' },
    offline: { bg: 'bg-gray-500', glow: 'transparent' },
  };

  const animationDurations = {
    none: 0,
    slow: 6,
    normal: 3,
    fast: 1.5,
    ultra: 0.75,
  };

  const getShapeStyles = (): string => {
    switch (style.shape) {
      case 'circle':
        return 'rounded-full';
      case 'rounded-square':
        return 'rounded-2xl';
      case 'hexagon':
        return 'rounded-xl [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]';
      case 'octagon':
        return 'rounded-xl [clip-path:polygon(30%_0%,70%_0%,100%_30%,100%_70%,70%_100%,30%_100%,0%_70%,0%_30%)]';
      case 'shield':
        return 'rounded-t-full rounded-b-[50%]';
      case 'diamond':
        return '[clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]';
      default:
        return 'rounded-full';
    }
  };

  const getBorderGradient = (): string => {
    const { borderStyle: bs, borderColor: c1, secondaryColor: c2 } = style;

    switch (bs) {
      case 'none':
        return 'transparent';
      case 'solid':
        return c1;
      case 'gradient':
        return `linear-gradient(135deg, ${c1}, ${c2})`;
      case 'rainbow':
        return 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)';
      case 'aurora':
        return 'linear-gradient(135deg, #00ff87, #60efff, #0061ff, #60efff, #00ff87)';
      case 'plasma':
        return 'linear-gradient(135deg, #ff00ff, #00ffff, #ff00ff, #ffff00, #ff00ff)';
      case 'cosmic':
        return 'linear-gradient(135deg, #1a1a2e, #4a148c, #311b92, #0d47a1, #1a1a2e)';
      case 'matrix':
        return 'linear-gradient(180deg, #003300, #00ff00, #003300)';
      case 'holographic':
        return 'linear-gradient(135deg, #ff0080, #ff8c00, #40e0d0, #8a2be2, #ff0080)';
      case 'diamond':
        return 'linear-gradient(135deg, #ffffff, #e0e0e0, #ffffff, #c0c0c0, #ffffff)';
      case 'emerald':
        return 'linear-gradient(135deg, #004d00, #00ff00, #50c878, #00ff00, #004d00)';
      case 'ruby':
        return 'linear-gradient(135deg, #8b0000, #ff0000, #ff6347, #ff0000, #8b0000)';
      case 'sapphire':
        return 'linear-gradient(135deg, #000080, #0000ff, #4169e1, #0000ff, #000080)';
      case 'amethyst':
        return 'linear-gradient(135deg, #4b0082, #8b00ff, #9932cc, #8b00ff, #4b0082)';
      case 'fire':
        return 'linear-gradient(180deg, #ff4400, #ff8800, #ffcc00, #ff8800, #ff4400)';
      case 'electric':
        return 'linear-gradient(135deg, #00ffff, #0088ff, #00ffff, #ffffff, #00ffff)';
      case 'supernova':
        return 'radial-gradient(circle, #ffffff, #ffff00, #ff8800, #ff0000, #ff00ff)';
      case 'black_hole':
        return 'radial-gradient(circle, #000000, #1a0033, #330066, #1a0033, #000000)';
      case 'quantum':
        return 'linear-gradient(135deg, #00ff00, #ff00ff, #00ffff, #ffff00, #00ff00)';
      case 'void':
        return 'radial-gradient(circle, #0d0015, #1a0033, #0d0015)';
      case 'celestial':
        return 'linear-gradient(135deg, #ffd700, #ffffff, #87ceeb, #ffffff, #ffd700)';
      case 'anniversary':
        return 'linear-gradient(135deg, #ffd700, #ff69b4, #ffd700)';
      case 'founders':
        return 'linear-gradient(135deg, #00ff00, #ffd700, #00ff00)';
      case 'champion':
        return 'linear-gradient(135deg, #ffd700, #c0c0c0, #cd7f32, #ffd700)';
      default:
        return `linear-gradient(135deg, ${c1}, ${c2})`;
    }
  };

  const getAnimationProps = (): AnimationReturn => {
    const duration = animationDurations[style.animationSpeed];
    if (!duration) return {};

    const intensity = style.glowIntensity;
    const { borderStyle: bs } = style;

    switch (bs) {
      case 'pulse':
        return {
          animate: { scale: [1, 1.03, 1], opacity: [1, 0.9, 1] },
          transition: { duration, repeat: Infinity, ease: 'easeInOut' },
        };

      case 'spin':
      case 'rainbow':
      case 'aurora':
      case 'plasma':
      case 'holographic':
        return {
          animate: { rotate: 360 },
          transition: { duration: duration * 2, repeat: Infinity, ease: 'linear' },
        };

      case 'glow':
        return {
          animate: {
            boxShadow: [
              `0 0 ${intensity * 0.3}px ${style.borderColor}`,
              `0 0 ${intensity * 0.8}px ${style.borderColor}`,
              `0 0 ${intensity * 0.3}px ${style.borderColor}`,
            ],
          },
          transition: { duration, repeat: Infinity, ease: 'easeInOut' },
        };

      case 'neon':
        return {
          animate: {
            boxShadow: [
              `0 0 ${intensity * 0.2}px ${style.borderColor}, 0 0 ${intensity * 0.4}px ${style.borderColor}, inset 0 0 ${intensity * 0.1}px ${style.borderColor}`,
              `0 0 ${intensity * 0.5}px ${style.borderColor}, 0 0 ${intensity * 0.8}px ${style.borderColor}, inset 0 0 ${intensity * 0.3}px ${style.borderColor}`,
              `0 0 ${intensity * 0.2}px ${style.borderColor}, 0 0 ${intensity * 0.4}px ${style.borderColor}, inset 0 0 ${intensity * 0.1}px ${style.borderColor}`,
            ],
          },
          transition: { duration: duration * 0.7, repeat: Infinity, ease: 'easeInOut' },
        };

      case 'fire':
        return {
          animate: {
            boxShadow: [
              `0 0 ${intensity * 0.3}px #ff4400, 0 -${intensity * 0.2}px ${intensity * 0.4}px #ff6600, 0 -${intensity * 0.4}px ${intensity * 0.6}px #ff8800`,
              `0 0 ${intensity * 0.5}px #ff6600, 0 -${intensity * 0.3}px ${intensity * 0.6}px #ff8800, 0 -${intensity * 0.6}px ${intensity * 0.8}px #ffaa00`,
              `0 0 ${intensity * 0.3}px #ff4400, 0 -${intensity * 0.2}px ${intensity * 0.4}px #ff6600, 0 -${intensity * 0.4}px ${intensity * 0.6}px #ff8800`,
            ],
            filter: ['hue-rotate(0deg)', 'hue-rotate(15deg)', 'hue-rotate(0deg)'],
          },
          transition: { duration: duration * 0.4, repeat: Infinity, ease: 'easeInOut' },
        };

      case 'electric':
        return {
          animate: {
            boxShadow: [
              `0 0 ${intensity * 0.2}px #00ffff, 0 0 ${intensity * 0.4}px #0088ff`,
              `0 0 ${intensity * 0.6}px #00ffff, 0 0 ${intensity * 0.8}px #0088ff, 0 0 ${intensity * 1.2}px #ffffff`,
              `0 0 ${intensity * 0.1}px #0088ff, 0 0 ${intensity * 0.2}px #00ffff`,
              `0 0 ${intensity * 0.4}px #00ffff, 0 0 ${intensity * 0.6}px #0088ff`,
            ],
            scale: [1, 1.01, 0.99, 1],
          },
          transition: { duration: duration * 0.3, repeat: Infinity, ease: 'linear' },
        };

      case 'supernova':
        return {
          animate: {
            boxShadow: [
              `0 0 ${intensity * 0.5}px #ffffff, 0 0 ${intensity}px #ffff00, 0 0 ${intensity * 1.5}px #ff8800`,
              `0 0 ${intensity}px #ffffff, 0 0 ${intensity * 1.5}px #ffff00, 0 0 ${intensity * 2}px #ff0000`,
              `0 0 ${intensity * 0.5}px #ffffff, 0 0 ${intensity}px #ffff00, 0 0 ${intensity * 1.5}px #ff8800`,
            ],
            scale: [1, 1.02, 1],
          },
          transition: { duration: duration * 0.8, repeat: Infinity, ease: 'easeInOut' },
        };

      case 'black_hole':
        return {
          animate: {
            boxShadow: [
              `0 0 ${intensity * 0.5}px #330066, inset 0 0 ${intensity * 0.3}px #000000`,
              `0 0 ${intensity}px #4b0082, inset 0 0 ${intensity * 0.5}px #1a0033`,
              `0 0 ${intensity * 0.5}px #330066, inset 0 0 ${intensity * 0.3}px #000000`,
            ],
            scale: [1, 0.98, 1],
          },
          transition: { duration: duration * 1.2, repeat: Infinity, ease: 'easeInOut' },
        };

      case 'quantum':
        return {
          animate: {
            boxShadow: [
              `0 0 ${intensity * 0.3}px #00ff00, ${intensity * 0.2}px 0 ${intensity * 0.3}px #ff00ff`,
              `0 0 ${intensity * 0.3}px #ff00ff, ${-intensity * 0.2}px 0 ${intensity * 0.3}px #00ffff`,
              `0 0 ${intensity * 0.3}px #00ffff, 0 ${intensity * 0.2}px ${intensity * 0.3}px #ffff00`,
              `0 0 ${intensity * 0.3}px #ffff00, 0 ${-intensity * 0.2}px ${intensity * 0.3}px #00ff00`,
            ],
            rotate: [0, 90, 180, 270, 360],
          },
          transition: { duration: duration * 2, repeat: Infinity, ease: 'linear' },
        };

      case 'celestial':
        return {
          animate: {
            boxShadow: [
              `0 0 ${intensity * 0.5}px #ffd700, 0 0 ${intensity}px rgba(255, 255, 255, 0.5)`,
              `0 0 ${intensity}px #ffd700, 0 0 ${intensity * 1.5}px rgba(255, 255, 255, 0.8)`,
              `0 0 ${intensity * 0.5}px #ffd700, 0 0 ${intensity}px rgba(255, 255, 255, 0.5)`,
            ],
            filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
          },
          transition: { duration, repeat: Infinity, ease: 'easeInOut' },
        };

      case 'diamond':
      case 'emerald':
      case 'ruby':
      case 'sapphire':
      case 'amethyst': {
        const gemColors: Record<string, string> = {
          diamond: '#ffffff',
          emerald: '#50c878',
          ruby: '#ff0000',
          sapphire: '#0000ff',
          amethyst: '#9932cc',
        };
        const gemColor = gemColors[bs] || '#ffffff';
        return {
          animate: {
            boxShadow: [
              `0 0 ${intensity * 0.3}px ${gemColor}, inset 0 0 ${intensity * 0.2}px rgba(255,255,255,0.3)`,
              `0 0 ${intensity * 0.6}px ${gemColor}, inset 0 0 ${intensity * 0.4}px rgba(255,255,255,0.5)`,
              `0 0 ${intensity * 0.3}px ${gemColor}, inset 0 0 ${intensity * 0.2}px rgba(255,255,255,0.3)`,
            ],
          },
          transition: { duration, repeat: Infinity, ease: 'easeInOut' },
        };
      }

      default:
        return {};
    }
  };

  const getParticleEmoji = () => {
    switch (style.particleEffect) {
      case 'sparkles':
        return ['✨', '⭐', '💫'];
      case 'bubbles':
        return ['○', '◯', '●'];
      case 'flames':
        return ['🔥', '💥', '⚡'];
      case 'snow':
        return ['❄️', '❅', '❆'];
      case 'hearts':
        return ['❤️', '💕', '💖'];
      case 'stars':
        return ['⭐', '🌟', '💫'];
      default:
        return [];
    }
  };

  const shapeClass = getShapeStyles();
  const borderGradient = getBorderGradient();
  const animationProps = getAnimationProps();
  const config = sizeConfig[size];

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Particle Effects */}
      <AnimatePresence>
        {style.particleEffect !== 'none' &&
          particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="pointer-events-none absolute z-20 text-xs"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, (Math.random() - 0.5) * 30],
                y: [0, -20 - Math.random() * 20],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeOut',
              }}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
            >
              {getParticleEmoji()[Math.floor(Math.random() * getParticleEmoji().length)]}
            </motion.span>
          ))}
      </AnimatePresence>

      {/* Main Avatar Container */}
      <motion.div
        className={`${config.container} ${shapeClass} relative overflow-visible`}
        style={{
          background: borderGradient,
          padding: style.borderStyle !== 'none' ? `${style.borderWidth}px` : 0,
        }}
        {...animationProps}
        onClick={onClick}
        whileHover={style.pulseOnHover || onClick ? { scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
      >
        {/* Inner Avatar */}
        <div className={`h-full w-full ${shapeClass} relative overflow-hidden bg-dark-800`}>
          {src ? (
            <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600">
              <span className="font-bold text-white" style={{ fontSize: config.text }}>
                {fallbackText || (alt ? alt.charAt(0).toUpperCase() : '?')}
              </span>
            </div>
          )}

          {/* Premium/Verified Badge Overlay */}
          {(isPremium || isVerified) && (
            <div className="absolute right-0 top-0 -translate-y-1 translate-x-1 transform">
              {isPremium && (
                <motion.div
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-[8px]">👑</span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Level Badge */}
      {(style.showLevel || level) && level !== undefined && (
        <motion.div
          className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 transform rounded-full px-1.5 py-0.5 font-bold text-white"
          style={{
            fontSize: config.levelSize,
            background:
              style.levelBadgeStyle === 'ornate'
                ? 'linear-gradient(135deg, #ffd700, #ff8c00)'
                : style.levelBadgeStyle === 'cyber'
                  ? 'linear-gradient(135deg, #00ff00, #00ffff)'
                  : 'linear-gradient(135deg, #10b981, #8b5cf6)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {level}
        </motion.div>
      )}

      {/* Status Indicator */}
      {showStatus && (
        <motion.div
          className={`absolute bottom-0 right-0 ${config.badge} rounded-full ${statusColors[statusType].bg} z-10 border-2 border-dark-900`}
          animate={
            statusType === 'online'
              ? {
                  boxShadow: [`0 0 0 0 ${statusColors[statusType].glow}`, `0 0 0 4px transparent`],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Title Display */}
      {title && (
        <motion.div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 transform whitespace-nowrap"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${title.color}40, ${title.color}20)`,
              color: title.color,
              textShadow: `0 0 8px ${title.color}60`,
            }}
          >
            {title.name}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// Enhanced Avatar Style Picker with Categories
export function AvatarStylePicker() {
  const { style, ownedStyles, updateStyle, resetStyle } = useAvatarStyle();
  const [activeCategory, setActiveCategory] = useState<BorderCategory>('free');

  const categories: { id: BorderCategory; name: string; description: string }[] = [
    { id: 'free', name: 'Free', description: 'Available to everyone' },
    { id: 'premium', name: 'Premium', description: 'Purchase with coins' },
    { id: 'legendary', name: 'Legendary', description: 'Rare exclusive styles' },
    { id: 'limited', name: 'Limited', description: 'Special editions' },
  ];

  const filteredStyles = BORDER_STYLES.filter((s) => s.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Avatar Customization</h3>
        <button
          onClick={resetStyle}
          className="text-sm text-gray-400 transition-colors hover:text-white"
        >
          Reset to Default
        </button>
      </div>

      {/* Preview */}
      <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-dark-800/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5" />
        <AnimatedAvatar
          alt="Preview"
          size="3xl"
          fallbackText="You"
          showStatus
          statusType="online"
          level={42}
          isPremium
          title={{ name: 'Legend', color: '#ffd700' }}
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Border Styles Grid */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Border Style</label>
        <div className="grid grid-cols-3 gap-2">
          {filteredStyles.map((bs) => {
            const isOwned = ownedStyles.includes(bs.id);
            const isSelected = style.borderStyle === bs.id;

            return (
              <motion.button
                key={bs.id}
                onClick={() => isOwned && updateStyle('borderStyle', bs.id)}
                disabled={!isOwned}
                className={`relative overflow-hidden rounded-lg p-3 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                    : isOwned
                      ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                      : 'cursor-not-allowed bg-dark-800 text-gray-500 opacity-60'
                }`}
                whileHover={isOwned ? { scale: 1.02 } : {}}
                whileTap={isOwned ? { scale: 0.98 } : {}}
              >
                <div className="font-semibold">{bs.name}</div>
                {!isOwned && (
                  <div className="mt-1 text-[10px] text-yellow-500">🔒 {bs.coinPrice} coins</div>
                )}
                {bs.category === 'legendary' && isOwned && (
                  <motion.div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(135deg, transparent 40%, rgba(255,215,0,0.1) 50%, transparent 60%)',
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Border Width */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Border Width</label>
          <span className="text-sm text-primary-400">{style.borderWidth}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="6"
          value={style.borderWidth}
          onChange={(e) => updateStyle('borderWidth', Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.borderColor}
              onChange={(e) => updateStyle('borderColor', e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-lg border-0"
            />
            <input
              type="text"
              value={style.borderColor}
              onChange={(e) => updateStyle('borderColor', e.target.value)}
              className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 font-mono text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Secondary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.secondaryColor}
              onChange={(e) => updateStyle('secondaryColor', e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-lg border-0"
            />
            <input
              type="text"
              value={style.secondaryColor}
              onChange={(e) => updateStyle('secondaryColor', e.target.value)}
              className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 font-mono text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Glow Intensity */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Glow Intensity</label>
          <span className="text-sm text-primary-400">{style.glowIntensity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={style.glowIntensity}
          onChange={(e) => updateStyle('glowIntensity', Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Animation Speed */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Animation Speed</label>
        <div className="grid grid-cols-5 gap-2">
          {(['none', 'slow', 'normal', 'fast', 'ultra'] as const).map((speed) => (
            <button
              key={speed}
              onClick={() => updateStyle('animationSpeed', speed)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                style.animationSpeed === speed
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* Shape */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Shape</label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: 'circle', label: 'Circle' },
              { value: 'rounded-square', label: 'Rounded' },
              { value: 'hexagon', label: 'Hexagon' },
              { value: 'octagon', label: 'Octagon' },
              { value: 'shield', label: 'Shield' },
              { value: 'diamond', label: 'Diamond' },
            ] as const
          ).map((shape) => (
            <button
              key={shape.value}
              onClick={() => updateStyle('shape', shape.value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                style.shape === shape.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      {/* Particle Effects */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Particle Effect</label>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { value: 'none', label: 'None', emoji: '❌' },
              { value: 'sparkles', label: 'Sparkles', emoji: '✨' },
              { value: 'bubbles', label: 'Bubbles', emoji: '🫧' },
              { value: 'flames', label: 'Flames', emoji: '🔥' },
              { value: 'snow', label: 'Snow', emoji: '❄️' },
              { value: 'hearts', label: 'Hearts', emoji: '💕' },
              { value: 'stars', label: 'Stars', emoji: '⭐' },
            ] as const
          ).map((effect) => (
            <button
              key={effect.value}
              onClick={() => updateStyle('particleEffect', effect.value)}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                style.particleEffect === effect.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              <span>{effect.emoji}</span>
              <span>{effect.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Pulse on Hover</span>
          <div
            onClick={() => updateStyle('pulseOnHover', !style.pulseOnHover)}
            className={`h-6 w-10 rounded-full transition-colors ${
              style.pulseOnHover ? 'bg-primary-600' : 'bg-dark-600'
            }`}
          >
            <motion.div
              className="mt-1 h-4 w-4 rounded-full bg-white"
              animate={{ x: style.pulseOnHover ? 22 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </label>

        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Show Level Badge</span>
          <div
            onClick={() => updateStyle('showLevel', !style.showLevel)}
            className={`h-6 w-10 rounded-full transition-colors ${
              style.showLevel ? 'bg-primary-600' : 'bg-dark-600'
            }`}
          >
            <motion.div
              className="mt-1 h-4 w-4 rounded-full bg-white"
              animate={{ x: style.showLevel ? 22 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
