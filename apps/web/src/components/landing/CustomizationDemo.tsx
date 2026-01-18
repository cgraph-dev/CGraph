/**
 * Customization Demo Component
 *
 * Interactive demo showcasing the app's extensive customization capabilities.
 * Features:
 * - Theme customization (colors, effects, animations)
 * - Avatar borders with animated RPG-style effects
 * - Profile customization (chat bubbles, user cards)
 * - Premium customization options
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBorder, TiltCard, GlowText } from './effects';
import { fadeInUp, springs, staggerContainer } from './animations';
import { getBordersByTheme, getBorderById } from '@/data/avatar-borders';
import type { BorderTheme } from '@/types/avatar-borders';

// =============================================================================
// TYPES
// =============================================================================

type ThemePreset = 'emerald' | 'purple' | 'cyan' | 'orange' | 'pink' | 'gold' | 'crimson' | 'arctic';
type EffectPreset = 'glassmorphism' | 'neon' | 'holographic' | 'minimal' | 'aurora' | 'cyberpunk';
type AnimationSpeed = 'slow' | 'normal' | 'fast';
type AvatarBorderType = 'none' | 'static' | 'glow' | 'pulse' | 'rotate' | 'fire' | 'ice' | 'electric' | 'legendary' | 'mythic';
type ChatBubbleStyle = 'default' | 'rounded' | 'sharp' | 'cloud' | 'modern' | 'retro';
type ProfileCardStyle = 'minimal' | 'detailed' | 'compact' | 'expanded' | 'gaming';

interface DemoState {
  theme: ThemePreset;
  effect: EffectPreset;
  animationSpeed: AnimationSpeed;
  particlesEnabled: boolean;
  glowEnabled: boolean;
  blurEnabled: boolean;
  // Avatar customization
  avatarBorder: AvatarBorderType;
  avatarBorderColor: ThemePreset;
  avatarSize: 'small' | 'medium' | 'large';
  selectedBorderTheme?: BorderTheme; // NEW: For themed borders showcase
  selectedBorderId?: string; // NEW: Specific border from theme collection
  selectedProfileThemeId?: string; // NEW: Specific profile theme variant
  // Chat customization
  chatBubbleStyle: ChatBubbleStyle;
  chatBubbleColor: ThemePreset;
  bubbleBorderRadius?: number; // 0-50px
  bubbleShadowIntensity?: number; // 0-100%
  bubbleEntranceAnimation?: 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';
  bubbleGlassEffect?: boolean;
  bubbleShowTail?: boolean;
  bubbleHoverEffect?: boolean;
  groupMessages?: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
  // Profile customization
  profileCardStyle: ProfileCardStyle;
  showBadges: boolean;
  showStatus: boolean;
  animatedBackground: boolean;
}

type DemoPanel = 'theme' | 'avatar' | 'chat' | 'profile';

// =============================================================================
// THEME COLORS
// =============================================================================

const themeColors: Record<ThemePreset, { primary: string; secondary: string; glow: string; name: string }> = {
  emerald: { primary: '#10b981', secondary: '#34d399', glow: 'rgba(16, 185, 129, 0.5)', name: 'Emerald' },
  purple: { primary: '#8b5cf6', secondary: '#a78bfa', glow: 'rgba(139, 92, 246, 0.5)', name: 'Purple' },
  cyan: { primary: '#06b6d4', secondary: '#22d3ee', glow: 'rgba(6, 182, 212, 0.5)', name: 'Cyan' },
  orange: { primary: '#f97316', secondary: '#fb923c', glow: 'rgba(249, 115, 22, 0.5)', name: 'Orange' },
  pink: { primary: '#ec4899', secondary: '#f472b6', glow: 'rgba(236, 72, 153, 0.5)', name: 'Pink' },
  gold: { primary: '#eab308', secondary: '#facc15', glow: 'rgba(234, 179, 8, 0.5)', name: 'Gold' },
  crimson: { primary: '#dc2626', secondary: '#f87171', glow: 'rgba(220, 38, 38, 0.5)', name: 'Crimson' },
  arctic: { primary: '#38bdf8', secondary: '#7dd3fc', glow: 'rgba(56, 189, 248, 0.5)', name: 'Arctic' },
};

// =============================================================================
// AVATAR BORDER DEFINITIONS
// =============================================================================

const avatarBorders: Record<AvatarBorderType, { name: string; description: string; premium: boolean; rarity?: string }> = {
  none: { name: 'None', description: 'No border', premium: false },
  static: { name: 'Static', description: 'Simple colored border', premium: false },
  glow: { name: 'Glow', description: 'Soft glowing effect', premium: false },
  pulse: { name: 'Pulse', description: 'Rhythmic pulsing glow', premium: false },
  rotate: { name: 'Orbit', description: 'Rotating gradient ring', premium: true, rarity: 'Rare' },
  fire: { name: 'Inferno', description: 'Animated flame effect', premium: true, rarity: 'Epic' },
  ice: { name: 'Frost', description: 'Crystalline ice particles', premium: true, rarity: 'Epic' },
  electric: { name: 'Storm', description: 'Electric sparks and arcs', premium: true, rarity: 'Epic' },
  legendary: { name: 'Legendary', description: 'Multi-layered animated aura', premium: true, rarity: 'Legendary' },
  mythic: { name: 'Mythic', description: 'Reality-bending void effect', premium: true, rarity: 'Mythic' },
};

const rarityColors: Record<string, string> = {
  Rare: '#3b82f6',
  Epic: '#8b5cf6',
  Legendary: '#f97316',
  Mythic: '#ec4899',
};

// =============================================================================
// ANIMATED AVATAR COMPONENT
// =============================================================================

interface AnimatedAvatarProps {
  borderType: AvatarBorderType;
  borderColor: ThemePreset;
  size: 'small' | 'medium' | 'large';
  speedMultiplier: number;
}

const AnimatedAvatar = memo(function AnimatedAvatar({
  borderType,
  borderColor,
  size,
  speedMultiplier,
}: AnimatedAvatarProps) {
  const colors = themeColors[borderColor];
  const sizeMap = { small: 48, medium: 64, large: 80 };
  const avatarSize = sizeMap[size];
  const borderWidth = size === 'small' ? 2 : size === 'medium' ? 3 : 4;

  const renderBorderEffect = () => {
    switch (borderType) {
      case 'none':
        return null;

      case 'static':
        return (
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: `${borderWidth}px solid ${colors.primary}` }}
          />
        );

      case 'glow':
        return (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: `${borderWidth}px solid ${colors.primary}`,
              boxShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
            }}
            animate={{
              boxShadow: [
                `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
                `0 0 25px ${colors.glow}, 0 0 50px ${colors.glow}`,
                `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
              ],
            }}
            transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
          />
        );

      case 'pulse':
        return (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.primary}` }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.primary}` }}
              animate={{
                scale: [1, 1.3, 1.3],
                opacity: [0.8, 0, 0],
              }}
              transition={{ duration: 1.5 * speedMultiplier, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.secondary}` }}
              animate={{
                scale: [1, 1.5, 1.5],
                opacity: [0.6, 0, 0],
              }}
              transition={{ duration: 1.5 * speedMultiplier, repeat: Infinity, delay: 0.3 }}
            />
          </>
        );

      case 'rotate':
        return (
          <motion.div
            className="absolute inset-[-4px] rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, transparent, ${colors.primary})`,
              padding: borderWidth,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
          >
            <div className="h-full w-full rounded-full bg-gray-900" />
          </motion.div>
        );

      case 'fire':
        return (
          <>
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.primary}` }}
            />
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: 6,
                  height: 12,
                  background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary}, transparent)`,
                  borderRadius: '50%',
                  left: '50%',
                  top: '50%',
                  transformOrigin: `0 ${avatarSize / 2 + 4}px`,
                  rotate: `${i * 30}deg`,
                }}
                animate={{
                  scaleY: [0.5, 1.2, 0.5],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 0.4 * speedMultiplier,
                  repeat: Infinity,
                  delay: i * 0.05,
                }}
              />
            ))}
          </>
        );

      case 'ice':
        return (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: `${borderWidth}px solid ${colors.primary}`,
                boxShadow: `0 0 20px ${colors.glow}`,
              }}
            />
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2"
                style={{
                  background: colors.secondary,
                  borderRadius: '2px',
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, Math.cos((i / 8) * Math.PI * 2) * (avatarSize / 2 + 10)],
                  y: [0, Math.sin((i / 8) * Math.PI * 2) * (avatarSize / 2 + 10)],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180],
                }}
                transition={{
                  duration: 2 * speedMultiplier,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        );

      case 'electric':
        return (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.primary}` }}
              animate={{
                boxShadow: [
                  `0 0 10px ${colors.glow}`,
                  `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`,
                  `0 0 10px ${colors.glow}`,
                ],
              }}
              transition={{ duration: 0.15 * speedMultiplier, repeat: Infinity, repeatDelay: 0.5 }}
            />
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.svg
                key={i}
                className="absolute"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${i * 60}deg) translateY(-${avatarSize / 2 + 8}px)`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.3 * speedMultiplier,
                  repeat: Infinity,
                  repeatDelay: 1 + Math.random(),
                  delay: i * 0.2,
                }}
              >
                <path
                  d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"
                  fill={colors.primary}
                />
              </motion.svg>
            ))}
          </>
        );

      case 'legendary':
        return (
          <>
            {/* Inner glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, transparent 60%, ${colors.glow} 100%)`,
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
            />
            {/* Rotating outer ring */}
            <motion.div
              className="absolute inset-[-6px] rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, #fff, ${colors.primary})`,
                padding: borderWidth + 2,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
            >
              <div className="h-full w-full rounded-full bg-gray-900" />
            </motion.div>
            {/* Particle ring */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{
                  background: i % 2 === 0 ? colors.primary : colors.secondary,
                  left: '50%',
                  top: '50%',
                  boxShadow: `0 0 6px ${colors.glow}`,
                }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * (avatarSize / 2 + 12),
                  y: Math.sin((i / 8) * Math.PI * 2) * (avatarSize / 2 + 12),
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1 * speedMultiplier,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </>
        );

      case 'mythic':
        return (
          <>
            {/* Void background */}
            <motion.div
              className="absolute inset-[-8px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.glow}, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 3 * speedMultiplier, repeat: Infinity }}
            />
            {/* Multi-layer rotating rings */}
            <motion.div
              className="absolute inset-[-6px] rounded-full opacity-60"
              style={{
                background: `conic-gradient(from 0deg, ${colors.primary}, transparent, ${colors.secondary}, transparent, ${colors.primary})`,
                padding: borderWidth,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
            >
              <div className="h-full w-full rounded-full bg-gray-900" />
            </motion.div>
            <motion.div
              className="absolute inset-[-4px] rounded-full"
              style={{
                background: `conic-gradient(from 180deg, ${colors.secondary}, transparent, ${colors.primary}, transparent, ${colors.secondary})`,
                padding: borderWidth,
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 4 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
            >
              <div className="h-full w-full rounded-full bg-gray-900" />
            </motion.div>
            {/* Orbiting particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full"
                style={{
                  background: i % 3 === 0 ? '#fff' : i % 3 === 1 ? colors.primary : colors.secondary,
                  left: '50%',
                  top: '50%',
                  boxShadow: `0 0 8px ${colors.glow}`,
                }}
                animate={{
                  x: [
                    Math.cos((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                    Math.cos(((i + 6) / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                    Math.cos((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                  ],
                  y: [
                    Math.sin((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                    Math.sin(((i + 6) / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                    Math.sin((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                  ],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 4 * speedMultiplier,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: avatarSize + 24, height: avatarSize + 24 }}
    >
      {/* Border effects layer */}
      <div
        className="absolute"
        style={{
          width: avatarSize,
          height: avatarSize,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {renderBorderEffect()}
      </div>

      {/* Avatar image */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800"
        style={{ width: avatarSize - 4, height: avatarSize - 4 }}
      >
        <span className="text-xl font-bold text-white">CG</span>
      </div>
    </div>
  );
});

// =============================================================================
// PROFILE THEME SHOWCASE (Discord-style)
// =============================================================================

interface ProfileThemeShowcaseProps {
  theme: BorderTheme;
  colors: { primary: string; secondary: string; glow: string };
  selectedThemeId?: string;
  onThemeSelect: (themeId: string) => void;
}

// Profile Theme Configuration Interface
interface ProfileThemeConfig {
  id: string;
  name: string;
  icon: string;
  tier: 'free' | 'premium' | 'elite';
  background: {
    type: 'gradient' | 'animated' | 'particle' | 'geometric';
    colors: string[];
    animation?: string;
  };
  effects: {
    particles?: { count: number; type: string; behavior: string };
    overlay?: string;
    glow?: string;
    border?: string;
  };
  previewDescription: string;
}

// Profile Theme Card Component
const ProfileThemeCard: React.FC<{
  theme: ProfileThemeConfig;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  delay: number;
}> = ({ theme, isSelected, isHovered, onSelect, onHover, delay }) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return '#ec4899';
      case 'premium': return '#8b5cf6';
      default: return '#10b981';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'elite': return 'ELITE';
      case 'premium': return 'PRO';
      default: return 'FREE';
    }
  };

  const getParticleSymbol = (type: string) => {
    const symbols: Record<string, string> = {
      pixel: '▪',
      petal: '🌸',
      energy: '✦',
      neon: '●',
      smoke: '◉',
      stars: '✨',
    };
    return symbols[type] || '●';
  };

  return (
    <motion.button
      className="relative overflow-hidden rounded-lg border border-white/10 p-3 text-left"
      style={{
        background: `linear-gradient(135deg, ${theme.background.colors.join(', ')})`,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onSelect}
    >
      {/* Overlay Effects */}
      {theme.effects.overlay === 'scanlines' && (
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
      )}
      {theme.effects.overlay === 'holographic' && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Glow Effect */}
      {theme.effects.glow && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{
            boxShadow: [
              `inset 0 0 20px ${theme.effects.glow}40`,
              `inset 0 0 40px ${theme.effects.glow}60`,
              `inset 0 0 20px ${theme.effects.glow}40`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Animated Particles */}
      {theme.effects.particles && [...Array(theme.effects.particles.count)].map((_, i) => {
        const startX = Math.random() * 100;
        const particleType = theme.effects.particles?.type || 'pixel';
        return (
          <motion.div
            key={i}
            className="pointer-events-none absolute text-xs"
            style={{
              color: theme.effects.glow || '#ffffff',
              left: `${startX}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-10, -60, -10],
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            {getParticleSymbol(particleType)}
          </motion.div>
        );
      })}

      {/* Selection Border */}
      {isSelected && (
        <>
          {[0, 1, 2, 3].map((corner) => (
            <motion.div
              key={corner}
              className="absolute h-2 w-2"
              style={{
                borderColor: getTierColor(theme.tier),
                top: corner < 2 ? 0 : 'auto',
                bottom: corner >= 2 ? 0 : 'auto',
                left: corner % 2 === 0 ? 0 : 'auto',
                right: corner % 2 === 1 ? 0 : 'auto',
                borderTop: corner < 2 ? `2px solid ${getTierColor(theme.tier)}` : 'none',
                borderBottom: corner >= 2 ? `2px solid ${getTierColor(theme.tier)}` : 'none',
                borderLeft: corner % 2 === 0 ? `2px solid ${getTierColor(theme.tier)}` : 'none',
                borderRight: corner % 2 === 1 ? `2px solid ${getTierColor(theme.tier)}` : 'none',
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: corner * 0.1 }}
            />
          ))}
        </>
      )}

      {/* Tier Badge */}
      <motion.div
        className="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white"
        style={{ backgroundColor: getTierColor(theme.tier) }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, type: 'spring' }}
      >
        {getTierLabel(theme.tier)}
      </motion.div>

      {/* Content */}
      <div className="relative z-10 mt-4">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{theme.icon}</span>
          <div>
            <div className="text-[11px] font-semibold text-white">{theme.name}</div>
            <div className="mt-0.5 text-[9px] text-white/70">{theme.previewDescription}</div>
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/80 p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="text-xs font-semibold text-white">{theme.name}</div>
              <div className="mt-1 text-[9px] font-bold" style={{ color: getTierColor(theme.tier) }}>
                {getTierLabel(theme.tier)} TIER
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

function ProfileThemeShowcase({ theme, selectedThemeId, onThemeSelect }: ProfileThemeShowcaseProps) {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  // Define all theme categories with 3 tiers each
  const themesByCategory: Record<string, ProfileThemeConfig[]> = {
    '8bit': [
      {
        id: '8bit-arcade',
        name: 'Arcade',
        icon: '🕹️',
        tier: 'free',
        background: { type: 'gradient', colors: ['#1a1a2e', '#16213e'] },
        effects: {
          particles: { count: 12, type: 'pixel', behavior: 'rain' },
          overlay: 'scanlines',
          glow: '#00ff00',
        },
        previewDescription: 'Retro pixels',
      },
      {
        id: '8bit-neon',
        name: 'Neon',
        icon: '🌃',
        tier: 'premium',
        background: { type: 'gradient', colors: ['#0f0f0f', '#1a0033', '#330066'] },
        effects: {
          particles: { count: 18, type: 'neon', behavior: 'float' },
          overlay: 'holographic',
          glow: '#ff00ff',
        },
        previewDescription: 'Neon glow',
      },
      {
        id: '8bit-dream',
        name: 'Dreams',
        icon: '👾',
        tier: 'elite',
        background: { type: 'animated', colors: ['#ff006e', '#8338ec', '#3a86ff'] },
        effects: {
          particles: { count: 24, type: 'pixel', behavior: 'cascade' },
          overlay: 'scanlines',
          glow: '#00ffff',
        },
        previewDescription: 'Pixel cascade',
      },
    ],
    japanese: [
      {
        id: 'jp-zen',
        name: 'Zen',
        icon: '🎋',
        tier: 'free',
        background: { type: 'gradient', colors: ['#1a3a2e', '#2d5a4a'] },
        effects: {
          particles: { count: 10, type: 'petal', behavior: 'float' },
          glow: '#4ade80',
        },
        previewDescription: 'Zen vibes',
      },
      {
        id: 'jp-sakura',
        name: 'Sakura',
        icon: '🌸',
        tier: 'premium',
        background: { type: 'gradient', colors: ['#ffc0cb', '#ffb3d9'] },
        effects: {
          particles: { count: 20, type: 'petal', behavior: 'cascade' },
          glow: '#ec4899',
        },
        previewDescription: 'Petal rain',
      },
      {
        id: 'jp-wave',
        name: 'Wave',
        icon: '🌊',
        tier: 'elite',
        background: { type: 'animated', colors: ['#1e40af', '#3b82f6', '#60a5fa'] },
        effects: {
          particles: { count: 30, type: 'energy', behavior: 'burst' },
          overlay: 'holographic',
          glow: '#3b82f6',
        },
        previewDescription: 'Energy burst',
      },
    ],
    anime: [
      {
        id: 'anime-power',
        name: 'Power',
        icon: '⚡',
        tier: 'free',
        background: { type: 'gradient', colors: ['#fbbf24', '#f59e0b'] },
        effects: {
          particles: { count: 15, type: 'energy', behavior: 'burst' },
          glow: '#fbbf24',
        },
        previewDescription: 'Power up',
      },
      {
        id: 'anime-mystic',
        name: 'Mystic',
        icon: '✨',
        tier: 'premium',
        background: { type: 'gradient', colors: ['#7c3aed', '#8b5cf6'] },
        effects: {
          particles: { count: 25, type: 'stars', behavior: 'float' },
          overlay: 'holographic',
          glow: '#8b5cf6',
        },
        previewDescription: 'Star magic',
      },
      {
        id: 'anime-hero',
        name: 'Hero',
        icon: '🔥',
        tier: 'elite',
        background: { type: 'animated', colors: ['#dc2626', '#ef4444', '#f97316'] },
        effects: {
          particles: { count: 35, type: 'energy', behavior: 'cascade' },
          glow: '#dc2626',
        },
        previewDescription: 'Flame aura',
      },
    ],
    cyberpunk: [
      {
        id: 'cyber-city',
        name: 'City',
        icon: '🌆',
        tier: 'free',
        background: { type: 'gradient', colors: ['#1e1e2e', '#2e1e3e'] },
        effects: {
          particles: { count: 12, type: 'neon', behavior: 'rain' },
          overlay: 'scanlines',
          glow: '#00ffff',
        },
        previewDescription: 'Neon rain',
      },
      {
        id: 'cyber-matrix',
        name: 'Matrix',
        icon: '💻',
        tier: 'premium',
        background: { type: 'gradient', colors: ['#000000', '#003300'] },
        effects: {
          particles: { count: 28, type: 'pixel', behavior: 'cascade' },
          overlay: 'scanlines',
          glow: '#00ff00',
        },
        previewDescription: 'Code rain',
      },
      {
        id: 'cyber-pulse',
        name: 'Pulse',
        icon: '⚡',
        tier: 'elite',
        background: { type: 'animated', colors: ['#ff00ff', '#00ffff'] },
        effects: {
          particles: { count: 40, type: 'neon', behavior: 'burst' },
          overlay: 'holographic',
          glow: '#ff00ff',
        },
        previewDescription: 'Electric pulse',
      },
    ],
    gothic: [
      {
        id: 'gothic-shadow',
        name: 'Shadow',
        icon: '🌑',
        tier: 'free',
        background: { type: 'gradient', colors: ['#1a0a1f', '#2a1a2f'] },
        effects: {
          particles: { count: 10, type: 'smoke', behavior: 'float' },
          glow: '#6b21a8',
        },
        previewDescription: 'Dark mist',
      },
      {
        id: 'gothic-blood',
        name: 'Blood',
        icon: '🩸',
        tier: 'premium',
        background: { type: 'gradient', colors: ['#450a0a', '#7f1d1d'] },
        effects: {
          particles: { count: 22, type: 'smoke', behavior: 'cascade' },
          glow: '#dc2626',
        },
        previewDescription: 'Crimson',
      },
      {
        id: 'gothic-void',
        name: 'Void',
        icon: '👁️',
        tier: 'elite',
        background: { type: 'animated', colors: ['#000000', '#1a0033', '#330066'] },
        effects: {
          particles: { count: 32, type: 'smoke', behavior: 'burst' },
          glow: '#6366f1',
        },
        previewDescription: 'Void energy',
      },
    ],
    kawaii: [
      {
        id: 'kawaii-pastel',
        name: 'Pastel',
        icon: '🌈',
        tier: 'free',
        background: { type: 'gradient', colors: ['#fce7f3', '#fbcfe8'] },
        effects: {
          particles: { count: 14, type: 'stars', behavior: 'float' },
          glow: '#f472b6',
        },
        previewDescription: 'Soft stars',
      },
      {
        id: 'kawaii-candy',
        name: 'Candy',
        icon: '🍭',
        tier: 'premium',
        background: { type: 'gradient', colors: ['#fef3c7', '#fde68a'] },
        effects: {
          particles: { count: 24, type: 'stars', behavior: 'cascade' },
          overlay: 'holographic',
          glow: '#f59e0b',
        },
        previewDescription: 'Sweet magic',
      },
      {
        id: 'kawaii-rainbow',
        name: 'Rainbow',
        icon: '🦄',
        tier: 'elite',
        background: { type: 'animated', colors: ['#ec4899', '#8b5cf6', '#3b82f6'] },
        effects: {
          particles: { count: 36, type: 'stars', behavior: 'burst' },
          overlay: 'holographic',
          glow: '#ec4899',
        },
        previewDescription: 'Rainbow burst',
      },
    ],
  };

  // Get themes for current category
  const currentCategoryThemes = themesByCategory[theme as keyof typeof themesByCategory] || themesByCategory['8bit'];

  if (!currentCategoryThemes) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-4 backdrop-blur-sm">
        <div className="mb-3 text-center text-xs font-medium text-gray-400">
          Next-Gen Profile Themes • Click to select
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-3 gap-2">
          {currentCategoryThemes.map((themeConfig, idx) => (
            <ProfileThemeCard
              key={themeConfig.id}
              theme={themeConfig}
              isSelected={selectedThemeId === themeConfig.id}
              isHovered={hoveredTheme === themeConfig.id}
              onSelect={() => onThemeSelect(themeConfig.id)}
              onHover={(hovered) => setHoveredTheme(hovered ? themeConfig.id : null)}
              delay={idx * 0.05}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// PREVIEW COMPONENTS
// =============================================================================

function AvatarPreview({ state, onChange: _onChange }: { state: DemoState; onChange?: (updates: Partial<DemoState>) => void }) {
  const colors = themeColors[state.theme];
  const speedMultiplier = state.animationSpeed === 'slow' ? 2 : state.animationSpeed === 'fast' ? 0.5 : 1;

  // Get selected themed border if one is selected
  const selectedBorder = state.selectedBorderId ? getBorderById(state.selectedBorderId) : null;

  // Use themed border type if available, otherwise fall back to default
  const avatarBorderType = selectedBorder?.type || state.avatarBorder;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8"
      style={{
        backdropFilter: state.blurEnabled ? 'blur(20px)' : 'none',
        boxShadow: state.glowEnabled ? `0 0 40px ${colors.glow}` : 'none',
      }}
      animate={state.glowEnabled ? {
        boxShadow: [
          `0 0 30px ${colors.glow}`,
          `0 0 50px ${colors.glow}`,
          `0 0 30px ${colors.glow}`,
        ],
      } : {}}
      transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
    >
      {/* Particles overlay */}
      {state.particlesEnabled && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: (2 + Math.random() * 2) * speedMultiplier,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center">
        {/* Large Avatar with Border */}
        <div className="mb-6 relative">
          <AnimatedAvatar
            borderType={avatarBorderType as AvatarBorderType}
            borderColor={state.avatarBorderColor}
            size="large"
            speedMultiplier={speedMultiplier}
          />

          {/* Themed Border Overlay - shows selected themed border */}
          {selectedBorder && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${selectedBorder.primaryColor}40, ${selectedBorder.secondaryColor || selectedBorder.primaryColor}40)`,
                border: `4px solid ${selectedBorder.primaryColor}`,
                boxShadow: `0 0 20px ${selectedBorder.primaryColor}80`,
              }}
              animate={{
                boxShadow: [
                  `0 0 15px ${selectedBorder.primaryColor}60`,
                  `0 0 30px ${selectedBorder.primaryColor}90`,
                  `0 0 15px ${selectedBorder.primaryColor}60`,
                ],
                rotate: selectedBorder.type.includes('ring') || selectedBorder.type.includes('rotating') ? 360 : 0,
              }}
              transition={{
                boxShadow: { duration: 2 * speedMultiplier, repeat: Infinity },
                rotate: { duration: 4 * speedMultiplier, repeat: Infinity, ease: 'linear' },
              }}
            />
          )}
        </div>

        {/* User Info */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-1">CGraph User</h3>
          <p className="text-sm text-gray-400">Level 42 • Legendary</p>
        </div>

        {/* Size Options Display */}
        <div className="mt-6 flex gap-4">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <motion.div
              key={size}
              className="flex flex-col items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <AnimatedAvatar
                borderType={state.avatarBorder}
                borderColor={state.avatarBorderColor}
                size={size}
                speedMultiplier={speedMultiplier}
              />
              <span className="text-xs text-gray-400 capitalize">{size}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Helper function to get profile theme config by ID
function getProfileThemeConfig(themeId: string | undefined): ProfileThemeConfig | null {
  if (!themeId) return null;

  // Theme configurations from ProfileThemeShowcase
  const allThemes: Record<string, ProfileThemeConfig[]> = {
    '8bit': [
      { id: '8bit-arcade', name: 'Arcade', icon: '🕹️', tier: 'free', background: { type: 'gradient', colors: ['#1a1a2e', '#16213e'] }, effects: { particles: { count: 12, type: 'pixel', behavior: 'rain' }, overlay: 'scanlines', glow: '#00ff00' }, previewDescription: 'Retro pixels' },
      { id: '8bit-neon', name: 'Neon', icon: '🌃', tier: 'premium', background: { type: 'gradient', colors: ['#0f0f0f', '#1a0033', '#330066'] }, effects: { particles: { count: 18, type: 'neon', behavior: 'float' }, overlay: 'holographic', glow: '#ff00ff' }, previewDescription: 'Neon glow' },
      { id: '8bit-dream', name: 'Dreams', icon: '👾', tier: 'elite', background: { type: 'animated', colors: ['#ff006e', '#8338ec', '#3a86ff'] }, effects: { particles: { count: 24, type: 'pixel', behavior: 'cascade' }, overlay: 'scanlines', glow: '#00ffff' }, previewDescription: 'Pixel cascade' },
    ],
    japanese: [
      { id: 'jp-zen', name: 'Zen', icon: '🎋', tier: 'free', background: { type: 'gradient', colors: ['#1a3a2e', '#2d5a4a'] }, effects: { particles: { count: 10, type: 'petal', behavior: 'float' }, glow: '#4ade80' }, previewDescription: 'Zen vibes' },
      { id: 'jp-sakura', name: 'Sakura', icon: '🌸', tier: 'premium', background: { type: 'gradient', colors: ['#ffc0cb', '#ffb3d9'] }, effects: { particles: { count: 20, type: 'petal', behavior: 'cascade' }, glow: '#ec4899' }, previewDescription: 'Petal rain' },
      { id: 'jp-wave', name: 'Wave', icon: '🌊', tier: 'elite', background: { type: 'animated', colors: ['#1e40af', '#3b82f6', '#60a5fa'] }, effects: { particles: { count: 30, type: 'energy', behavior: 'burst' }, overlay: 'holographic', glow: '#3b82f6' }, previewDescription: 'Energy burst' },
    ],
    anime: [
      { id: 'anime-power', name: 'Power', icon: '⚡', tier: 'free', background: { type: 'gradient', colors: ['#fbbf24', '#f59e0b'] }, effects: { particles: { count: 15, type: 'energy', behavior: 'burst' }, glow: '#fbbf24' }, previewDescription: 'Power up' },
      { id: 'anime-mystic', name: 'Mystic', icon: '✨', tier: 'premium', background: { type: 'gradient', colors: ['#7c3aed', '#8b5cf6'] }, effects: { particles: { count: 25, type: 'stars', behavior: 'float' }, overlay: 'holographic', glow: '#8b5cf6' }, previewDescription: 'Star magic' },
      { id: 'anime-hero', name: 'Hero', icon: '🔥', tier: 'elite', background: { type: 'animated', colors: ['#dc2626', '#ef4444', '#f97316'] }, effects: { particles: { count: 35, type: 'energy', behavior: 'cascade' }, glow: '#dc2626' }, previewDescription: 'Flame aura' },
    ],
    cyberpunk: [
      { id: 'cyber-city', name: 'City', icon: '🌆', tier: 'free', background: { type: 'gradient', colors: ['#1e1e2e', '#2e1e3e'] }, effects: { particles: { count: 12, type: 'neon', behavior: 'rain' }, overlay: 'scanlines', glow: '#00ffff' }, previewDescription: 'Neon rain' },
      { id: 'cyber-matrix', name: 'Matrix', icon: '💻', tier: 'premium', background: { type: 'gradient', colors: ['#000000', '#003300'] }, effects: { particles: { count: 28, type: 'pixel', behavior: 'cascade' }, overlay: 'scanlines', glow: '#00ff00' }, previewDescription: 'Code rain' },
      { id: 'cyber-holo', name: 'Holo', icon: '🔮', tier: 'elite', background: { type: 'animated', colors: ['#ff00ff', '#00ffff', '#ffff00'] }, effects: { particles: { count: 32, type: 'neon', behavior: 'float' }, overlay: 'holographic', glow: '#ff00ff' }, previewDescription: 'Holo shift' },
    ],
    gothic: [
      { id: 'goth-dark', name: 'Dark', icon: '🌑', tier: 'free', background: { type: 'gradient', colors: ['#0a0a0a', '#1a1a1a'] }, effects: { particles: { count: 8, type: 'smoke', behavior: 'float' }, glow: '#4b0082' }, previewDescription: 'Dark mist' },
      { id: 'goth-blood', name: 'Blood', icon: '🩸', tier: 'premium', background: { type: 'gradient', colors: ['#1a0000', '#4d0000'] }, effects: { particles: { count: 15, type: 'energy', behavior: 'rain' }, glow: '#dc2626' }, previewDescription: 'Blood rain' },
      { id: 'goth-void', name: 'Void', icon: '🌌', tier: 'elite', background: { type: 'animated', colors: ['#000000', '#1a0033', '#0d0015'] }, effects: { particles: { count: 25, type: 'stars', behavior: 'float' }, overlay: 'holographic', glow: '#8b5cf6' }, previewDescription: 'Void space' },
    ],
    kawaii: [
      { id: 'kawaii-sweet', name: 'Sweet', icon: '🍬', tier: 'free', background: { type: 'gradient', colors: ['#ffc0cb', '#ffb3d9'] }, effects: { particles: { count: 12, type: 'hearts', behavior: 'float' }, glow: '#ec4899' }, previewDescription: 'Sweet hearts' },
      { id: 'kawaii-dream', name: 'Dream', icon: '💖', tier: 'premium', background: { type: 'gradient', colors: ['#b3e0ff', '#ffffb3', '#ffb3d9'] }, effects: { particles: { count: 20, type: 'stars', behavior: 'float' }, glow: '#a855f7' }, previewDescription: 'Dream stars' },
      { id: 'kawaii-magic', name: 'Magic', icon: '✨', tier: 'elite', background: { type: 'animated', colors: ['#ff69b4', '#9370db', '#87ceeb'] }, effects: { particles: { count: 30, type: 'sparkles', behavior: 'cascade' }, overlay: 'holographic', glow: '#ec4899' }, previewDescription: 'Sparkle magic' },
    ],
  };

  for (const themes of Object.values(allThemes)) {
    const found = themes.find(t => t.id === themeId);
    if (found) return found;
  }

  return null;
}

function ProfilePreview({ state, onChange: _onChange }: { state: DemoState; onChange: (updates: Partial<DemoState>) => void }) {
  const colors = themeColors[state.theme];
  const speedMultiplier = state.animationSpeed === 'slow' ? 2 : state.animationSpeed === 'fast' ? 0.5 : 1;

  // Get selected profile theme configuration
  const selectedTheme = getProfileThemeConfig(state.selectedProfileThemeId);

  // Meaningful themed badges with cool visuals
  const mockBadges = [
    {
      id: '1',
      emoji: '🛡️',
      name: 'Guardian Shield',
      rarity: 'legendary',
      description: 'Protected 1000+ users',
      theme: 'defensive'
    },
    {
      id: '2',
      emoji: '⚔️',
      name: 'Blade Master',
      rarity: 'epic',
      description: 'Top 100 Contributors',
      theme: 'combat'
    },
    {
      id: '3',
      emoji: '🎩',
      name: 'Arcane Sage',
      rarity: 'mythic',
      description: 'Answered 500+ questions',
      theme: 'magic'
    },
    {
      id: '4',
      emoji: '👑',
      name: 'Royal Crown',
      rarity: 'legendary',
      description: 'Community Leader',
      theme: 'prestige'
    },
  ];

  const getBadgeGlow = (rarity: string) => {
    switch (rarity) {
      case 'mythic': return '#ec4899'; // Pink for mythic
      case 'legendary': return '#f59e0b'; // Gold for legendary
      case 'epic': return '#8b5cf6'; // Purple for epic
      case 'rare': return '#3b82f6'; // Blue for rare
      case 'uncommon': return '#10b981'; // Green for uncommon
      default: return '#6b7280'; // Gray for common
    }
  };

  // Use selected theme's background and glow, otherwise fall back to state
  const backgroundStyle = selectedTheme
    ? `linear-gradient(135deg, ${selectedTheme.background.colors.join(', ')})`
    : state.effect === 'glassmorphism'
    ? 'rgba(17, 24, 39, 0.7)'
    : state.effect === 'neon'
    ? 'rgba(0, 0, 0, 0.9)'
    : state.effect === 'holographic'
    ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(30, 41, 59, 0.8))'
    : 'rgba(17, 24, 39, 0.95)';

  const glowColor = selectedTheme?.effects.glow || colors.glow;
  const particleCount = selectedTheme?.effects.particles?.count || 15;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10"
      style={{
        background: backgroundStyle,
        backdropFilter: state.blurEnabled ? 'blur(20px)' : 'none',
        boxShadow: state.glowEnabled || selectedTheme ? `0 0 40px ${glowColor}` : 'none',
      }}
      animate={state.glowEnabled || selectedTheme ? {
        boxShadow: [
          `0 0 30px ${glowColor}`,
          `0 0 50px ${glowColor}`,
          `0 0 30px ${glowColor}`,
        ],
      } : {}}
      transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
    >
      {/* Particles overlay */}
      {(state.particlesEnabled || selectedTheme) && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: particleCount }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: selectedTheme?.effects.glow || colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: (2 + Math.random()) * speedMultiplier,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated background */}
      {(state.animatedBackground || selectedTheme?.background.type === 'animated') && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: selectedTheme
              ? `linear-gradient(45deg, ${selectedTheme.background.colors[0]}10, ${selectedTheme.background.colors[1]}10, transparent)`
              : `linear-gradient(45deg, ${colors.primary}10, ${colors.secondary}10, transparent)`,
            backgroundSize: '200% 200%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 8 * speedMultiplier, repeat: Infinity }}
        />
      )}

      <div className="relative p-6">
        {/* Profile Card Layout based on style */}
        {state.profileCardStyle === 'minimal' && (
          <div className="flex items-center gap-4">
            <AnimatedAvatar
              borderType={state.avatarBorder}
              borderColor={state.avatarBorderColor}
              size="medium"
              speedMultiplier={speedMultiplier}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">CGraph User</h3>
                {/* Electric Title Badge with Animation */}
                <motion.div
                  className="relative overflow-hidden rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Electric spark effect */}
                  <motion.div
                    className="pointer-events-none absolute inset-0"
                    animate={{
                      boxShadow: [
                        `0 0 10px ${colors.glow}, inset 0 0 5px ${colors.glow}`,
                        `0 0 20px ${colors.glow}, inset 0 0 10px ${colors.glow}`,
                        `0 0 10px ${colors.glow}, inset 0 0 5px ${colors.glow}`,
                      ],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="relative z-10 flex items-center gap-0.5">
                    <motion.span
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      ⚡
                    </motion.span>
                    Speed Demon
                  </span>
                </motion.div>
              </div>
              {state.showStatus && (
                <div className="mt-1 flex items-center gap-1.5 text-sm text-emerald-400">
                  <motion.span
                    className="h-2 w-2 rounded-full bg-emerald-400"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  ></motion.span>
                  Online
                </div>
              )}
            </div>
          </div>
        )}

        {state.profileCardStyle === 'detailed' && (
          <div>
            {/* Holographic shine overlay */}
            <motion.div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                backgroundSize: '200% 200%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <AnimatedAvatar
                  borderType={state.avatarBorder}
                  borderColor={state.avatarBorderColor}
                  size="large"
                  speedMultiplier={speedMultiplier}
                />
              </motion.div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">CGraph User</h3>
                  {/* Fire-animated Legendary Title Badge */}
                  <motion.div
                    className="relative overflow-hidden rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Fire flicker effect */}
                    <motion.div
                      className="pointer-events-none absolute inset-0"
                      animate={{
                        boxShadow: [
                          '0 0 15px rgba(245, 158, 11, 0.6), inset 0 0 8px rgba(239, 68, 68, 0.4)',
                          '0 0 25px rgba(245, 158, 11, 0.9), inset 0 0 15px rgba(239, 68, 68, 0.6)',
                          '0 0 15px rgba(245, 158, 11, 0.6), inset 0 0 8px rgba(239, 68, 68, 0.4)',
                        ],
                      }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />

                    {/* Animated flame particles */}
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="pointer-events-none absolute bottom-0 h-1 w-0.5 rounded-full bg-orange-400"
                        style={{
                          left: `${25 + i * 25}%`,
                        }}
                        animate={{
                          y: [0, -12, 0],
                          opacity: [0, 0.8, 0],
                          scale: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}

                    <span className="relative z-10 flex items-center gap-1">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      >
                        👑
                      </motion.span>
                      Legendary
                    </span>
                  </motion.div>
                </div>
                <p className="text-sm text-gray-400 mb-2">Full-stack developer & community enthusiast</p>
                {state.showStatus && (
                  <div className="flex items-center gap-1.5 text-sm text-emerald-400">
                    <motion.span
                      className="relative h-2 w-2 rounded-full bg-emerald-400"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {/* Ping effect */}
                      <motion.span
                        className="absolute inset-0 rounded-full bg-emerald-400"
                        animate={{ scale: [1, 2, 2], opacity: [0.5, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.span>
                    Online
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Level', value: '42' },
                { label: 'Posts', value: '1.2K' },
                { label: 'Karma', value: '8.5K' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  className="rounded-lg bg-white/5 p-2 text-center"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div className="text-lg font-bold" style={{ color: colors.primary }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Badges */}
            {state.showBadges && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-400">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🏆
                  </motion.span>{' '}
                  Featured Badges
                </div>
                <div className="flex flex-wrap gap-2">
                  {mockBadges.map((badge, i) => (
                    <motion.div
                      key={badge.id}
                      className="group relative"
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.1, type: 'spring', stiffness: 250 }}
                      whileHover={{ scale: 1.15, rotate: 5, zIndex: 10 }}
                    >
                      {/* Glow ring */}
                      <motion.div
                        className="absolute inset-[-4px] rounded-full opacity-0 group-hover:opacity-100"
                        style={{
                          background: `conic-gradient(from 0deg, ${getBadgeGlow(badge.rarity)}, transparent, ${getBadgeGlow(badge.rarity)})`,
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />

                      <motion.div
                        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-xl"
                        animate={{
                          boxShadow: [
                            `0 0 8px ${getBadgeGlow(badge.rarity)}40, 0 0 16px ${getBadgeGlow(badge.rarity)}20`,
                            `0 0 16px ${getBadgeGlow(badge.rarity)}80, 0 0 32px ${getBadgeGlow(badge.rarity)}40`,
                            `0 0 8px ${getBadgeGlow(badge.rarity)}40, 0 0 16px ${getBadgeGlow(badge.rarity)}20`,
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {badge.emoji}

                        {/* Particle effects on hover */}
                        <AnimatePresence>
                          {[0, 1, 2].map((particleIdx) => (
                            <motion.div
                              key={particleIdx}
                              className="pointer-events-none absolute h-1 w-1 rounded-full"
                              style={{ background: getBadgeGlow(badge.rarity) }}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1.5, 0],
                                x: [0, Math.cos((particleIdx * 2 * Math.PI) / 3) * 20, 0],
                                y: [0, Math.sin((particleIdx * 2 * Math.PI) / 3) * 20, 0],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: particleIdx * 0.2,
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </motion.div>

                      {/* Enhanced tooltip */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/95 px-3 py-1.5 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                        <div className="text-xs font-bold text-white">{badge.name}</div>
                        <div className="text-[9px] capitalize" style={{ color: getBadgeGlow(badge.rarity) }}>
                          {badge.rarity}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {state.profileCardStyle === 'compact' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AnimatedAvatar
                borderType={state.avatarBorder}
                borderColor={state.avatarBorderColor}
                size="small"
                speedMultiplier={speedMultiplier}
              />
              <div>
                <h3 className="text-sm font-bold text-white">CGraph User</h3>
                <p className="text-xs text-gray-400">Level 42</p>
              </div>
            </div>
            {state.showBadges && (
              <div className="flex gap-1">
                {mockBadges.slice(0, 3).map((badge) => (
                  <div
                    key={badge.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-sm"
                  >
                    {badge.emoji}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {state.profileCardStyle === 'expanded' && (
          <div className="space-y-4">
            {/* Cover Image */}
            <motion.div
              className="relative -m-6 mb-2 h-24 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              }}
              animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
              transition={{ duration: 10, repeat: Infinity }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50"></div>
            </motion.div>

            {/* Avatar overlapping cover */}
            <div className="relative -mt-12 mb-2 flex justify-center">
              <AnimatedAvatar
                borderType={state.avatarBorder}
                borderColor={state.avatarBorderColor}
                size="large"
                speedMultiplier={speedMultiplier}
              />
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-1">CGraph User</h3>
              <p className="text-sm text-gray-400 mb-3">Full-stack developer & community enthusiast</p>
              {state.showStatus && (
                <div className="flex items-center justify-center gap-1.5 text-sm text-emerald-400 mb-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  Online
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Level', value: '42' },
                  { label: 'Posts', value: '1.2K' },
                  { label: 'Karma', value: '8.5K' },
                  { label: 'Streak', value: '30d' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-white/5 p-2">
                    <div className="text-base font-bold" style={{ color: colors.primary }}>
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Badges */}
              {state.showBadges && (
                <div className="flex justify-center gap-2">
                  {mockBadges.map((badge, i) => (
                    <motion.div
                      key={badge.id}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-xl"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.2 }}
                    >
                      {badge.emoji}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {state.profileCardStyle === 'gaming' && (
          <div>
            {/* Gaming-style header with XP bar */}
            <div className="mb-4">
              <div className="flex items-center gap-4 mb-3">
                <AnimatedAvatar
                  borderType={state.avatarBorder}
                  borderColor={state.avatarBorderColor}
                  size="medium"
                  speedMultiplier={speedMultiplier}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">CGraph User</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: colors.primary }}>Level 42</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400">Legendary Tier</span>
                  </div>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div>
                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span>XP Progress</span>
                  <span>8,420 / 10,000</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: '84%' }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Gaming Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { icon: '⚔️', label: 'Victories', value: '234' },
                { icon: '🎯', label: 'Accuracy', value: '92%' },
                { icon: '🔥', label: 'Streak', value: '30 days' },
                { icon: '👑', label: 'Rank', value: '#127' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                  whileHover={{ scale: 1.05, borderColor: colors.primary + '40' }}
                >
                  <div className="mb-1 text-lg">{stat.icon}</div>
                  <div className="text-sm font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Achievement Badges */}
            {state.showBadges && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-400">
                  <span>🏆</span> Recent Achievements
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {mockBadges.map((badge, i) => (
                    <motion.div
                      key={badge.id}
                      className="group relative aspect-square"
                      initial={{ opacity: 0, rotate: -180, scale: 0 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                      whileHover={{ scale: 1.15, rotate: 10 }}
                    >
                      <motion.div
                        className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 text-2xl"
                        animate={{
                          boxShadow: [
                            `0 0 8px ${getBadgeGlow(badge.rarity)}40`,
                            `0 0 16px ${getBadgeGlow(badge.rarity)}80`,
                            `0 0 8px ${getBadgeGlow(badge.rarity)}40`,
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {badge.emoji}
                      </motion.div>
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {badge.name}
                      </div>
                      {/* Rarity indicator */}
                      <div
                        className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900"
                        style={{ backgroundColor: getBadgeGlow(badge.rarity) }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChatPreview({ state }: { state: DemoState }) {
  const colors = themeColors[state.theme];
  const bubbleColors = themeColors[state.chatBubbleColor];
  const speedMultiplier = state.animationSpeed === 'slow' ? 2 : state.animationSpeed === 'fast' ? 0.5 : 1;

  const getBubbleAnimation = (isOwn: boolean, index: number) => {
    const delay = index * 0.1;

    switch (state.chatBubbleStyle) {
      case 'rounded':
        return {
          initial: { opacity: 0, scale: 0.8, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          transition: { delay, type: 'spring' as const, stiffness: 200 },
        };
      case 'sharp':
        return {
          initial: { opacity: 0, x: isOwn ? 20 : -20 },
          animate: { opacity: 1, x: 0 },
          transition: { delay, type: 'tween' as const },
        };
      case 'cloud':
        return {
          initial: { opacity: 0, scale: 0.5, y: 10 },
          animate: { opacity: 1, scale: 1, y: 0 },
          transition: { delay, type: 'spring' as const, stiffness: 150, damping: 12 },
        };
      case 'modern':
        return {
          initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { delay, duration: 0.4 },
        };
      case 'retro':
        return {
          initial: { opacity: 0, rotateX: -90 },
          animate: { opacity: 1, rotateX: 0 },
          transition: { delay, type: 'spring' as const, stiffness: 120 },
        };
      default:
        return {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { delay },
        };
    }
  };

  const getBubbleStyle = (isOwn: boolean) => {
    const baseStyle: React.CSSProperties = {
      background: isOwn ? bubbleColors.primary : `${colors.primary}20`,
    };

    switch (state.chatBubbleStyle) {
      case 'rounded':
        return {
          ...baseStyle,
          borderRadius: '20px',
          boxShadow: isOwn ? `0 4px 12px ${bubbleColors.primary}40` : `0 2px 8px ${colors.primary}20`,
        };
      case 'sharp':
        return {
          ...baseStyle,
          borderRadius: '4px',
          border: `1px solid ${isOwn ? bubbleColors.primary : colors.primary}30`,
        };
      case 'cloud':
        return {
          ...baseStyle,
          borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          boxShadow: `0 2px 8px rgba(0,0,0,0.1)`,
        };
      case 'modern':
        return {
          ...baseStyle,
          borderRadius: '16px',
          border: isOwn ? 'none' : `1px solid ${colors.primary}40`,
          backdropFilter: 'blur(10px)',
          background: isOwn
            ? `linear-gradient(135deg, ${bubbleColors.primary}, ${bubbleColors.secondary})`
            : `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}10)`,
        };
      case 'retro':
        return {
          ...baseStyle,
          borderRadius: '0',
          border: `2px solid ${isOwn ? bubbleColors.secondary : colors.primary}`,
          boxShadow: `4px 4px 0 ${isOwn ? bubbleColors.secondary : colors.primary}40`,
        };
      default:
        return { ...baseStyle, borderRadius: '12px' };
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10"
      style={{
        background: state.effect === 'glassmorphism'
          ? 'rgba(17, 24, 39, 0.7)'
          : state.effect === 'neon'
          ? 'rgba(0, 0, 0, 0.9)'
          : state.effect === 'holographic'
          ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(30, 41, 59, 0.8))'
          : state.effect === 'aurora'
          ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(30, 58, 59, 0.8))'
          : state.effect === 'cyberpunk'
          ? 'rgba(10, 10, 20, 0.95)'
          : 'rgba(17, 24, 39, 0.95)',
        backdropFilter: state.blurEnabled ? 'blur(20px)' : 'none',
        boxShadow: state.glowEnabled ? `0 0 40px ${colors.glow}` : 'none',
      }}
      animate={state.glowEnabled ? {
        boxShadow: [
          `0 0 30px ${colors.glow}`,
          `0 0 50px ${colors.glow}`,
          `0 0 30px ${colors.glow}`,
        ],
      } : {}}
      transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
    >
      {/* Particles overlay */}
      {state.particlesEnabled && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: (2 + Math.random()) * speedMultiplier,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated background for aurora/cyberpunk */}
      {state.animatedBackground && state.effect === 'aurora' && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(45deg, ${colors.primary}10, ${colors.secondary}10, transparent)`,
            backgroundSize: '200% 200%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 8 * speedMultiplier, repeat: Infinity }}
        />
      )}

      {/* Content */}
      <div className={`relative ${state.compactMode ? 'p-3' : 'p-5'}`}>
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <AnimatedAvatar
            borderType={state.avatarBorder}
            borderColor={state.avatarBorderColor}
            size={state.avatarSize}
            speedMultiplier={speedMultiplier}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">CGraph User</span>
              {state.showBadges && (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: colors.primary, color: '#fff' }}
                >
                  PRO
                </span>
              )}
            </div>
            {state.showStatus && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <motion.div
                  className="h-2 w-2 rounded-full"
                  style={{ background: '#22c55e' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Online
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className={`space-y-${state.compactMode ? '2' : '3'}`}>
          <motion.div
            className="p-3"
            style={getBubbleStyle(false)}
            {...getBubbleAnimation(false, 0)}
            whileHover={{ scale: 1.02, boxShadow: `0 4px 16px ${colors.primary}30` }}
          >
            <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} text-gray-200`}>
              Welcome! Your profile looks amazing with that border! 🔥
            </p>
            {state.showTimestamps && (
              <span className="mt-1 block text-[10px] text-gray-500">10:42 AM</span>
            )}
          </motion.div>

          <motion.div
            className="ml-auto max-w-[75%] p-3"
            style={getBubbleStyle(true)}
            {...getBubbleAnimation(true, 1)}
            whileHover={{ scale: 1.02, boxShadow: `0 6px 20px ${bubbleColors.primary}50` }}
          >
            <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} text-white`}>
              Thanks! Just unlocked the Legendary tier 🎉
            </p>
            {state.showTimestamps && (
              <span className="mt-1 block text-[10px] text-white/60">10:43 AM</span>
            )}
          </motion.div>

          <motion.div
            className="p-3"
            style={getBubbleStyle(false)}
            {...getBubbleAnimation(false, 2)}
            whileHover={{ scale: 1.02, boxShadow: `0 4px 16px ${colors.primary}30` }}
          >
            <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} text-gray-200`}>
              The customization options are incredible! 🎨
            </p>
            {state.showTimestamps && (
              <span className="mt-1 block text-[10px] text-gray-500">10:44 AM</span>
            )}
          </motion.div>
        </div>

        {/* Status bar */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span style={{ color: colors.primary }}>🔐</span> E2E Encrypted
          </span>
          <span style={{ color: colors.primary }}>Premium</span>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// CONTROL PANELS
// =============================================================================

function ThemeControlPanel({
  state,
  onChange,
}: {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}) {
  const colors = themeColors[state.theme];

  return (
    <div className="space-y-5">
      {/* Theme Colors */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Theme Color</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(themeColors) as ThemePreset[]).map((theme) => (
            <motion.button
              key={theme}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                state.theme === theme ? 'scale-110 border-white' : 'border-transparent'
              }`}
              style={{
                background: `linear-gradient(135deg, ${themeColors[theme].primary}, ${themeColors[theme].secondary})`,
                boxShadow: state.theme === theme ? `0 0 15px ${themeColors[theme].glow}` : 'none',
              }}
              onClick={() => onChange({ theme })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={themeColors[theme].name}
            />
          ))}
        </div>
      </div>

      {/* Effect Style */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Effect Style</label>
        <div className="grid grid-cols-3 gap-2">
          {(['glassmorphism', 'neon', 'holographic', 'minimal', 'aurora', 'cyberpunk'] as EffectPreset[]).map((effect) => (
            <motion.button
              key={effect}
              className={`rounded-lg border px-2 py-1.5 text-xs capitalize transition-all ${
                state.effect === effect
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ effect })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {effect}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Animation Speed */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Animation Speed</label>
        <div className="flex gap-2">
          {(['slow', 'normal', 'fast'] as AnimationSpeed[]).map((speed) => (
            <motion.button
              key={speed}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize transition-all ${
                state.animationSpeed === speed
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ animationSpeed: speed })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {speed}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Toggle Effects */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Visual Effects</label>
        {[
          { key: 'particlesEnabled', label: 'Particles', icon: '✨' },
          { key: 'glowEnabled', label: 'Glow', icon: '💡' },
          { key: 'blurEnabled', label: 'Blur', icon: '🌫️' },
          { key: 'animatedBackground', label: 'Animated BG', icon: '🎨' },
        ].map(({ key, label, icon }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 p-2.5 transition-colors hover:border-white/20"
          >
            <span className="flex items-center gap-2 text-sm text-gray-300">
              <span>{icon}</span> {label}
            </span>
            <motion.div
              className={`relative h-5 w-9 rounded-full transition-colors ${
                state[key as keyof DemoState] ? '' : 'bg-gray-700'
              }`}
              style={{
                background: state[key as keyof DemoState]
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  : undefined,
              }}
              onClick={() => onChange({ [key]: !state[key as keyof DemoState] })}
            >
              <motion.div
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-lg"
                animate={{ left: state[key as keyof DemoState] ? '18px' : '2px' }}
                transition={springs.snappy}
              />
            </motion.div>
          </label>
        ))}
      </div>

      {/* Themed Border Collections - Moved from Avatar tab */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">
          Themed Border Collections
          <span className="ml-2 text-[10px] text-emerald-400">NEW: 150+ Animated Borders!</span>
        </label>
        <p className="mb-3 text-xs text-gray-500">
          Select a theme collection, then choose a border. Your selection applies across avatar, profile, and chat.
        </p>
        <div className="space-y-3">
          {/* Theme selector grid */}
          <div className="grid grid-cols-3 gap-2">
            {(['8bit', 'japanese', 'anime', 'cyberpunk', 'gothic', 'kawaii'] as BorderTheme[]).map((theme) => {
              const themeBorders = getBordersByTheme(theme);
              const isSelected = state.selectedBorderTheme === theme;

              // Get theme icon and colors
              const themeConfigMap: Record<string, { icon: string; color: string; bgGrad: string }> = {
                '8bit': { icon: '🕹️', color: '#00ff00', bgGrad: 'from-green-900/20 to-green-800/20' },
                'japanese': { icon: '🌸', color: '#ff6b9d', bgGrad: 'from-pink-900/20 to-pink-800/20' },
                'anime': { icon: '⚡', color: '#667eea', bgGrad: 'from-purple-900/20 to-purple-800/20' },
                'cyberpunk': { icon: '🌆', color: '#00f5ff', bgGrad: 'from-cyan-900/20 to-cyan-800/20' },
                'gothic': { icon: '🦇', color: '#8b0000', bgGrad: 'from-red-900/20 to-red-800/20' },
                'kawaii': { icon: '🌈', color: '#ffb3d9', bgGrad: 'from-pink-900/20 to-pink-700/20' },
              };
              const themeConfig = themeConfigMap[theme] || { icon: '✨', color: '#ffffff', bgGrad: 'from-gray-900/20 to-gray-800/20' };

              return (
                <motion.button
                  key={theme}
                  className={`relative overflow-hidden rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10'
                      : 'border-white/10 bg-gradient-to-br hover:border-white/30'
                  } ${themeConfig.bgGrad}`}
                  onClick={() => onChange({ selectedBorderTheme: theme })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Animated glow on selection */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 -z-10"
                      animate={{
                        boxShadow: [
                          `inset 0 0 20px ${themeConfig.color}30`,
                          `inset 0 0 40px ${themeConfig.color}50`,
                          `inset 0 0 20px ${themeConfig.color}30`,
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xl">{themeConfig.icon}</span>
                    <div>
                      <div className="text-xs font-medium capitalize text-white">
                        {theme}
                      </div>
                      <div className="mt-0.5 text-[9px] text-gray-400">
                        {themeBorders.length} borders
                      </div>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Border preview grid for selected theme */}
          {state.selectedBorderTheme && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs font-medium capitalize text-gray-300">
                    {state.selectedBorderTheme} Collection
                  </div>
                  <div className="text-[9px] text-emerald-400">
                    Click to apply to your entire profile
                  </div>
                </div>

                {/* Animated border preview cards */}
                <div className="grid grid-cols-4 gap-2">
                  {getBordersByTheme(state.selectedBorderTheme).slice(0, 8).map((border, idx) => {
                    const tier = border.unlockType === 'default' ? 'free' :
                                border.unlockType === 'subscription' || border.unlockType === 'purchase' ? 'pro' : 'elite';
                    const tierConfig = {
                      free: { label: 'FREE', color: '#10b981', bgColor: '#10b98120' },
                      pro: { label: 'PRO', color: '#8b5cf6', bgColor: '#8b5cf620' },
                      elite: { label: 'ELITE', color: '#ec4899', bgColor: '#ec489920' },
                    }[tier];

                    const isSelected = state.selectedBorderId === border.id;

                    return (
                      <motion.div
                        key={border.id}
                        className="group relative"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300 }}
                      >
                        <motion.button
                          className={`relative aspect-square w-full overflow-hidden rounded-lg border ${
                            isSelected ? 'border-emerald-400' : 'border-white/20'
                          } cursor-pointer`}
                          style={{
                            background: `linear-gradient(135deg, ${border.primaryColor}40, ${border.secondaryColor || border.primaryColor}40)`,
                          }}
                          whileHover={{ scale: 1.05, zIndex: 10 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            // Apply themed border globally to entire profile
                            const borderTheme = state.selectedBorderTheme;
                            const themeColorMap: Partial<Record<BorderTheme, ThemePreset>> = {
                              '8bit': 'emerald',
                              'japanese': 'pink',
                              'anime': 'purple',
                              'cyberpunk': 'cyan',
                              'gothic': 'crimson',
                              'kawaii': 'pink',
                              'steampunk': 'orange',
                              'vaporwave': 'purple',
                              'cosmic': 'purple',
                              'fantasy': 'purple',
                              'nature': 'emerald',
                              'tribal': 'orange',
                              'geometric': 'cyan',
                              'holographic': 'purple',
                              'chinese': 'gold'
                            };
                            const matchingThemeColor = borderTheme && themeColorMap[borderTheme]
                              ? themeColorMap[borderTheme]!
                              : state.theme;

                            onChange({
                              selectedBorderId: border.id,
                              // Apply theme globally across all visual elements
                              theme: matchingThemeColor,
                              avatarBorderColor: matchingThemeColor,
                              chatBubbleColor: matchingThemeColor,
                              // Set avatar border to use the themed border style
                              avatarBorder: 'legendary' // Use premium border for themed borders
                            });
                          }}
                        >
                          {/* Tier label */}
                          <div
                            className="absolute left-1 top-1 z-10 rounded px-1 py-0.5 text-[8px] font-bold"
                            style={{ backgroundColor: tierConfig.bgColor, color: tierConfig.color }}
                          >
                            {tierConfig.label}
                          </div>

                          {/* Animated effects */}
                          <motion.div
                            className="absolute inset-0"
                            style={{
                              background: `radial-gradient(circle at 50% 50%, ${border.primaryColor}60, ${border.secondaryColor || border.primaryColor}60, transparent)`,
                            }}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />

                          {/* Selection indicator */}
                          {isSelected && (
                            <motion.div
                              className="absolute inset-0 border-2 border-emerald-400 rounded-lg pointer-events-none"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ type: 'spring' }}
                            />
                          )}
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
                  <span>{getBordersByTheme(state.selectedBorderTheme).length} total borders</span>
                  <span className="text-emerald-400">✓ Syncs across all tabs</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Next-Gen Profile Themes - Moved from Avatar tab */}
      {state.selectedBorderTheme && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400">
            Next-Gen Profile Themes
            <span className="ml-2 text-[10px] text-purple-400">Apply custom theme to your profile!</span>
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Choose a profile theme variant from the {state.selectedBorderTheme} collection. These themes customize your entire profile appearance.
          </p>
          <ProfileThemeShowcase
            theme={state.selectedBorderTheme}
            colors={colors}
            selectedThemeId={state.selectedProfileThemeId}
            onThemeSelect={(themeId) => onChange({ selectedProfileThemeId: themeId })}
          />
        </div>
      )}
    </div>
  );
}

function AvatarControlPanel({
  state,
  onChange,
}: {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Avatar Preview */}
      <div className="flex justify-center py-4">
        <AnimatedAvatar
          borderType={state.avatarBorder}
          borderColor={state.avatarBorderColor}
          size="large"
          speedMultiplier={state.animationSpeed === 'slow' ? 2 : state.animationSpeed === 'fast' ? 0.5 : 1}
        />
      </div>

      {/* Border Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Avatar Border</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(avatarBorders) as [AvatarBorderType, typeof avatarBorders[AvatarBorderType]][]).map(
            ([type, info]) => (
              <motion.button
                key={type}
                className={`relative rounded-lg border p-2 text-left transition-all ${
                  state.avatarBorder === type
                    ? 'border-white/50 bg-white/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
                onClick={() => onChange({ avatarBorder: type })}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${state.avatarBorder === type ? 'text-white' : 'text-gray-400'}`}>
                    {info.name}
                  </span>
                  {info.premium && (
                    <span
                      className="rounded px-1 py-0.5 text-[9px] font-bold"
                      style={{ background: rarityColors[info.rarity!], color: '#fff' }}
                    >
                      {info.rarity}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] text-gray-500">{info.description}</p>
              </motion.button>
            )
          )}
        </div>
      </div>

      {/* Border Color */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Border Color</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(themeColors) as ThemePreset[]).map((color) => (
            <motion.button
              key={color}
              className={`h-7 w-7 rounded-full border-2 transition-all ${
                state.avatarBorderColor === color ? 'scale-110 border-white' : 'border-transparent'
              }`}
              style={{
                background: `linear-gradient(135deg, ${themeColors[color].primary}, ${themeColors[color].secondary})`,
              }}
              onClick={() => onChange({ avatarBorderColor: color })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>
      </div>

      {/* Avatar Size */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Avatar Size</label>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <motion.button
              key={size}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize transition-all ${
                state.avatarSize === size
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ avatarSize: size })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {size}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Note: Themed borders moved to Theme tab */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
          <span>🎨</span> Themed Border Collections
        </div>
        <p className="mt-1 text-xs text-gray-400">
          150+ animated borders across 6 themes are now in the <span className="font-semibold text-emerald-400">Theme tab</span>!
          Select a theme collection there to apply unified styling across your entire profile.
        </p>
      </div>

      {/* Premium upsell */}
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-yellow-400">
          <span>👑</span> Unlock Premium Borders
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Get access to Epic, Legendary & Mythic animated borders across all themes
        </p>
      </div>
    </div>
  );
}

function ChatControlPanel({
  state,
  onChange,
}: {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}) {
  const colors = themeColors[state.theme];

  return (
    <div className="space-y-5">
      {/* Bubble Style Presets */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Bubble Style Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {(['default', 'rounded', 'sharp', 'cloud', 'modern', 'retro'] as ChatBubbleStyle[]).map((style) => (
            <motion.button
              key={style}
              className={`rounded-lg border px-2 py-1.5 text-xs capitalize transition-all ${
                state.chatBubbleStyle === style
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ chatBubbleStyle: style })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {style}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bubble Color */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Your Bubble Color</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(themeColors) as ThemePreset[]).map((color) => (
            <motion.button
              key={color}
              className={`h-7 w-7 rounded-full border-2 transition-all ${
                state.chatBubbleColor === color ? 'scale-110 border-white' : 'border-transparent'
              }`}
              style={{
                background: `linear-gradient(135deg, ${themeColors[color].primary}, ${themeColors[color].secondary})`,
              }}
              onClick={() => onChange({ chatBubbleColor: color })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>
      </div>

      {/* Border Radius Slider */}
      <div>
        <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-400">
          <span>Border Radius</span>
          <span className="text-xs" style={{ color: colors.primary }}>
            {state.bubbleBorderRadius || 16}px
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={state.bubbleBorderRadius || 16}
          onChange={(e) => onChange({ bubbleBorderRadius: parseInt(e.target.value) })}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
          style={{
            background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${
              ((state.bubbleBorderRadius || 16) / 50) * 100
            }%, #374151 ${((state.bubbleBorderRadius || 16) / 50) * 100}%, #374151 100%)`,
          }}
        />
      </div>

      {/* Shadow Intensity Slider */}
      <div>
        <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-400">
          <span>Shadow Intensity</span>
          <span className="text-xs" style={{ color: colors.primary }}>
            {state.bubbleShadowIntensity || 20}%
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={state.bubbleShadowIntensity || 20}
          onChange={(e) => onChange({ bubbleShadowIntensity: parseInt(e.target.value) })}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg"
          style={{
            background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${state.bubbleShadowIntensity || 20}%, #374151 ${state.bubbleShadowIntensity || 20}%, #374151 100%)`,
          }}
        />
      </div>

      {/* Entrance Animation */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Entrance Animation</label>
        <div className="grid grid-cols-3 gap-2">
          {(['none', 'slide', 'fade', 'scale', 'bounce', 'flip'] as const).map((anim) => (
            <motion.button
              key={anim}
              className={`rounded-lg border px-2 py-1.5 text-xs capitalize transition-all ${
                state.bubbleEntranceAnimation === anim
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ bubbleEntranceAnimation: anim })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {anim}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat Visual Effects */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Visual Effects</label>
        {[
          { key: 'bubbleGlassEffect', label: 'Glass Effect', icon: '💎', desc: 'Frosted glass backdrop blur' },
          { key: 'bubbleShowTail', label: 'Message Tail', icon: '💬', desc: 'Classic chat bubble tail' },
          { key: 'bubbleHoverEffect', label: 'Hover Animation', icon: '✨', desc: 'Lift on hover' },
        ].map(({ key, label, icon, desc }) => (
          <label
            key={key}
            className="flex cursor-pointer items-start justify-between rounded-lg border border-white/10 p-2.5 transition-colors hover:border-white/20"
          >
            <div className="flex-1">
              <span className="flex items-center gap-2 text-sm text-gray-300">
                <span>{icon}</span> {label}
              </span>
              <p className="mt-0.5 text-[10px] text-gray-500">{desc}</p>
            </div>
            <motion.div
              className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                state[key as keyof DemoState] ? '' : 'bg-gray-700'
              }`}
              style={{
                background: state[key as keyof DemoState]
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  : undefined,
              }}
              onClick={() => onChange({ [key]: !state[key as keyof DemoState] })}
            >
              <motion.div
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-lg"
                animate={{ left: state[key as keyof DemoState] ? '18px' : '2px' }}
                transition={springs.snappy}
              />
            </motion.div>
          </label>
        ))}
      </div>

      {/* Chat Layout Options */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Layout Options</label>
        {[
          { key: 'showTimestamps', label: 'Show Timestamps', icon: '🕐', desc: 'Display message time' },
          { key: 'compactMode', label: 'Compact Mode', icon: '📐', desc: 'Reduced spacing' },
          { key: 'groupMessages', label: 'Group Messages', icon: '📦', desc: 'Combine sequential messages' },
        ].map(({ key, label, icon, desc }) => (
          <label
            key={key}
            className="flex cursor-pointer items-start justify-between rounded-lg border border-white/10 p-2.5 transition-colors hover:border-white/20"
          >
            <div className="flex-1">
              <span className="flex items-center gap-2 text-sm text-gray-300">
                <span>{icon}</span> {label}
              </span>
              <p className="mt-0.5 text-[10px] text-gray-500">{desc}</p>
            </div>
            <motion.div
              className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                state[key as keyof DemoState] ? '' : 'bg-gray-700'
              }`}
              style={{
                background: state[key as keyof DemoState]
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  : undefined,
              }}
              onClick={() => onChange({ [key]: !state[key as keyof DemoState] })}
            >
              <motion.div
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-lg"
                animate={{ left: state[key as keyof DemoState] ? '18px' : '2px' }}
                transition={springs.snappy}
              />
            </motion.div>
          </label>
        ))}
      </div>

      {/* Advanced Features Hint */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
          <span>💡</span> Pro Tip
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Access 20+ more customization options in the full web app including gradient controls, border styles, and typing indicators
        </p>
      </div>
    </div>
  );
}

function ProfileControlPanel({
  state,
  onChange,
}: {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Profile Card Style */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Profile Card Style</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'minimal', name: 'Minimal', desc: 'Clean & simple' },
            { id: 'detailed', name: 'Detailed', desc: 'Full info display' },
            { id: 'compact', name: 'Compact', desc: 'Space efficient' },
            { id: 'expanded', name: 'Expanded', desc: 'Show everything' },
            { id: 'gaming', name: 'Gaming', desc: 'Stats focused', premium: true },
          ] as const).map((style) => (
            <motion.button
              key={style.id}
              className={`relative rounded-lg border p-2 text-left transition-all ${
                state.profileCardStyle === style.id
                  ? 'border-white/50 bg-white/10'
                  : 'border-white/10 hover:border-white/30'
              }`}
              onClick={() => onChange({ profileCardStyle: style.id })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${state.profileCardStyle === style.id ? 'text-white' : 'text-gray-400'}`}>
                  {style.name}
                </span>
                {'premium' in style && style.premium && (
                  <span className="rounded bg-purple-500 px-1 py-0.5 text-[9px] font-bold text-white">
                    PRO
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-gray-500">{style.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Profile Options */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Profile Display</label>
        {[
          { key: 'showBadges', label: 'Show Badges', icon: '🏆' },
          { key: 'showStatus', label: 'Show Status', icon: '🟢' },
        ].map(({ key, label, icon }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 p-2.5 transition-colors hover:border-white/20"
          >
            <span className="flex items-center gap-2 text-sm text-gray-300">
              <span>{icon}</span> {label}
            </span>
            <motion.div
              className={`relative h-5 w-9 rounded-full transition-colors ${
                state[key as keyof DemoState] ? '' : 'bg-gray-700'
              }`}
              style={{
                background: state[key as keyof DemoState]
                  ? `linear-gradient(135deg, ${themeColors[state.theme].primary}, ${themeColors[state.theme].secondary})`
                  : undefined,
              }}
              onClick={() => onChange({ [key]: !state[key as keyof DemoState] })}
            >
              <motion.div
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-lg"
                animate={{ left: state[key as keyof DemoState] ? '18px' : '2px' }}
                transition={springs.snappy}
              />
            </motion.div>
          </label>
        ))}
      </div>

      {/* Unique Identity Info */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
          <span>🌟</span> Your Unique Identity
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Your customizations sync across all forums and chats. Stand out everywhere!
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CustomizationDemo() {
  const [state, setState] = useState<DemoState>({
    theme: 'emerald',
    effect: 'glassmorphism',
    animationSpeed: 'normal',
    particlesEnabled: true,
    glowEnabled: true,
    blurEnabled: true,
    avatarBorder: 'legendary',
    avatarBorderColor: 'emerald',
    avatarSize: 'medium',
    selectedBorderTheme: undefined, // User can select to explore themed borders
    chatBubbleStyle: 'default',
    chatBubbleColor: 'emerald',
    bubbleBorderRadius: 16,
    bubbleShadowIntensity: 20,
    bubbleEntranceAnimation: 'slide',
    bubbleGlassEffect: false,
    bubbleShowTail: true,
    bubbleHoverEffect: true,
    groupMessages: true,
    showTimestamps: true,
    compactMode: false,
    profileCardStyle: 'detailed',
    showBadges: true,
    showStatus: true,
    animatedBackground: true,
  });

  const [activePanel, setActivePanel] = useState<DemoPanel>('avatar');

  const updateState = (updates: Partial<DemoState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const panels: { id: DemoPanel; label: string; icon: string }[] = [
    { id: 'theme', label: 'Theme', icon: '🎨' },
    { id: 'avatar', label: 'Avatar', icon: '👤' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'profile', label: 'Profile', icon: '📋' },
  ];

  return (
    <section className="relative overflow-hidden bg-gray-950 py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.05),transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          transition={springs.gentle}
        >
          <motion.span
            className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            100+ Customization Options
          </motion.span>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Make It <GlowText>Yours</GlowText>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            Create your unique identity with animated avatar borders, custom chat bubbles, and personalized profiles.
            <span className="block mt-2 text-emerald-400">Your style follows you everywhere.</span>
          </p>
        </motion.div>

        {/* Demo Content */}
        <motion.div
          className="grid items-start gap-8 lg:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Preview Panel */}
          <motion.div variants={fadeInUp}>
            <TiltCard maxTilt={5}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  {activePanel === 'theme' && <ProfilePreview state={state} onChange={updateState} />}
                  {activePanel === 'avatar' && <AvatarPreview state={state} onChange={updateState} />}
                  {activePanel === 'chat' && <ChatPreview state={state} />}
                  {activePanel === 'profile' && <ProfilePreview state={state} onChange={updateState} />}
                </motion.div>
              </AnimatePresence>
            </TiltCard>

            {/* Feature tags */}
            <motion.div
              className="mt-6 flex flex-wrap justify-center gap-2"
              variants={staggerContainer}
            >
              {[
                '150+ Themed Borders',
                '6 Chat Styles',
                '8 Color Themes',
                '6 Effect Modes',
                'Cross-Platform',
                'Premium Options',
              ].map((tag) => (
                <motion.span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400"
                  variants={fadeInUp}
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Control Panel */}
          <motion.div variants={fadeInUp}>
            <AnimatedBorder>
              <div className="p-5">
                {/* Panel Tabs */}
                <div className="mb-6 flex rounded-lg bg-gray-800/50 p-1">
                  {panels.map((panel) => (
                    <button
                      key={panel.id}
                      className={`relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        activePanel === panel.id ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                      }`}
                      onClick={() => setActivePanel(panel.id)}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1.5">
                        <span>{panel.icon}</span>
                        <span className="hidden sm:inline">{panel.label}</span>
                      </span>
                      {activePanel === panel.id && (
                        <motion.div
                          layoutId="activeCustomPanel"
                          className="absolute inset-0 rounded-md bg-white/10"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Panel Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePanel}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activePanel === 'theme' && <ThemeControlPanel state={state} onChange={updateState} />}
                    {activePanel === 'avatar' && <AvatarControlPanel state={state} onChange={updateState} />}
                    {activePanel === 'chat' && <ChatControlPanel state={state} onChange={updateState} />}
                    {activePanel === 'profile' && <ProfileControlPanel state={state} onChange={updateState} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </AnimatedBorder>

            {/* Premium CTA */}
            <motion.div
              className="mt-6 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span>👑</span> Unlock Premium Customizations
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Epic, Legendary & Mythic borders, exclusive themes, and more
                  </p>
                </div>
                <a
                  href="/register"
                  className="shrink-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
                >
                  Upgrade
                </a>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default CustomizationDemo;
