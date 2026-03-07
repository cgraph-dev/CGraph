/**
 * Avatar Border Type Definitions
 *
 * Comprehensive type system for themed avatar borders across different aesthetics.
 * Each theme has multiple border variations with unique animations.
 *
 * @version 1.0.0
 * @since 2026-01-18
 */

// ==================== BORDER THEMES ====================

export type BorderTheme =
  | 'free' // Free tier borders
  | 'premium' // Premium subscription
  | 'enterprise' // Enterprise subscription
  | 'legendary' // Achievement-locked
  | 'mythic' // Special events/Top 100
  | '8bit' // Retro gaming aesthetic
  | 'japanese' // Japanese traditional
  | 'chinese' // Chinese traditional
  | 'anime' // Anime/manga style
  | 'cyberpunk' // Futuristic cyberpunk
  | 'gothic' // Gothic/dark aesthetic
  | 'kawaii' // Cute Japanese style
  | 'steampunk' // Victorian + industrial
  | 'vaporwave' // 80s/90s aesthetic
  | 'cosmic' // Space/galaxy theme
  | 'fantasy' // Medieval fantasy
  | 'nature' // Natural elements
  | 'tribal' // Tribal patterns
  | 'geometric' // Mathematical patterns
  | 'holographic' // Futuristic holo
  | 'elemental' // Fire/Water/Earth/Air
  | 'scifi' // Science fiction
  | 'minimal' // Minimalist design
  | 'gaming' // Gaming themed
  | 'seasonal' // Seasonal events
  | 'achievement'; // Achievement rewards

// ==================== BORDER TYPES ====================

export type AvatarBorderType =
  // Free tier (4)
  | 'none'
  | 'static'
  | 'simple-glow'
  | 'gentle-pulse'

  // Premium subscription (8)
  | 'rotating-ring'
  | 'dual-ring'
  | 'gradient-wave'
  | 'spark-trail'
  | 'prismatic'
  | 'neon-outline'
  | 'ripple'
  | 'heartbeat'

  // Enterprise subscription (12)
  | 'fire-inferno'
  | 'ice-frost'
  | 'storm-electric'
  | 'nature-vines'
  | 'water-flow'
  | 'shadow-mist'
  | 'light-radiance'
  | 'cherry-blossom'
  | 'golden-coins'
  | 'starfield'
  | 'aurora-borealis'
  | 'bubble-rise'

  // Legendary (Achievement-locked, 8)
  | 'phoenix-rising'
  | 'dragon-scale'
  | 'void-portal'
  | 'cosmic-nebula'
  | 'chaos-rift'
  | 'divine-halo'
  | 'ancient-runes'
  | 'crystal-formation'

  // Mythic (Events/Top 100, 8)
  | 'reality-warp'
  | 'timeline-shift'
  | 'dimensional-tear'
  | 'celestial-crown'
  | 'infinity-loop'
  | 'primordial-flame'
  | 'eternal-frost'
  | 'transcendent'

  // 8-Bit Theme (8)
  | '8bit-pixels'
  | '8bit-powerup'
  | '8bit-coins'
  | '8bit-hearts'
  | '8bit-stars'
  | '8bit-rainbow'
  | '8bit-glitch'
  | '8bit-boss'

  // Japanese Theme (10)
  | 'sakura-petals'
  | 'bamboo-forest'
  | 'koi-fish'
  | 'paper-lanterns'
  | 'shrine-torii'
  | 'samurai-blade'
  | 'zen-circle'
  | 'maple-leaves'
  | 'wave-pattern'
  | 'kanji-scroll'

  // Chinese Theme (10)
  | 'dragon-dance'
  | 'phoenix-feather'
  | 'lotus-bloom'
  | 'jade-ring'
  | 'paper-cut'
  | 'temple-bells'
  | 'ink-brush'
  | 'cloud-pattern'
  | 'fortune-coins'
  | 'zodiac-circle'

  // Anime Theme (10)
  | 'manga-speed-lines'
  | 'power-aura'
  | 'transformation'
  | 'chibi-sparkle'
  | 'impact-frame'
  | 'spirit-energy'
  | 'magical-circle'
  | 'sakuga-flash'
  | 'eye-shine'
  | 'battle-scars'

  // Cyberpunk Theme (10)
  | 'cyber-circuit'
  | 'neon-hexagon'
  | 'hologram-glitch'
  | 'data-stream'
  | 'tech-scanner'
  | 'neural-link'
  | 'quantum-flux'
  | 'ai-interface'
  | 'synth-wave'
  | 'matrix-code'

  // Gothic Theme (10)
  | 'blood-moon'
  | 'bat-swarm'
  | 'thorns-vines'
  | 'coffin-chains'
  | 'skull-crown'
  | 'raven-feathers'
  | 'cursed-runes'
  | 'vampire-bite'
  | 'cemetery-mist'
  | 'darkrose'

  // Kawaii Theme (10)
  | 'pastel-hearts'
  | 'rainbow-stars'
  | 'candy-swirl'
  | 'bubble-tea'
  | 'kitty-paws'
  | 'unicorn-magic'
  | 'cupcake-sprinkles'
  | 'cloud-nine'
  | 'fairy-dust'
  | 'teddy-bear'

  // Steampunk Theme (8)
  | 'brass-gears'
  | 'steam-engine'
  | 'clockwork'
  | 'copper-pipes'
  | 'Victorian-frame'
  | 'airship-propeller'
  | 'tesla-coil'
  | 'industrial-rivets'

  // Vaporwave Theme (8)
  | 'retro-grid'
  | 'palm-trees'
  | 'sunset-gradient'
  | 'glitch-art'
  | 'wireframe'
  | 'neon-triangle'
  | 'vhs-static'
  | 'aesthetic-kanji';

// ==================== RARITY SYSTEM ====================

export type BorderRarity =
  | 'free'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export type BorderUnlockType =
  | 'default' // Available to all
  | 'subscription' // Requires active subscription
  | 'achievement' // Unlocked via achievement
  | 'leaderboard' // Top 100 in category
  | 'event' // Special event reward
  | 'purchase' // Buy with coins
  | 'level' // Reach specific level
  | 'prestige'; // Prestige system

// ==================== BORDER CONFIGURATION ====================

export interface AvatarBorderConfig {
  /** Unique identifier */
  id: string;

  /** Border type */
  type: AvatarBorderType;

  /** Display name */
  name: string;

  /** Description */
  description: string;

  /** Theme category */
  theme: BorderTheme;

  /** Rarity tier */
  rarity: BorderRarity;

  /** How to unlock */
  unlockType: BorderUnlockType;

  /** Unlock requirement details */
  unlockRequirement?: {
    type: 'subscription' | 'achievement' | 'level' | 'coins' | 'leaderboard' | 'event';
    value: string | number;
    description: string;
  };

  /** Primary color */
  primaryColor: string;

  /** Secondary color (optional) */
  secondaryColor?: string;

  /** Accent color (optional) */
  accentColor?: string;

  /** Number of particles/effects */
  particleCount?: number;

  /** Animation speed */
  animationSpeed?: 'slow' | 'normal' | 'fast';

  /** Animation duration in seconds */
  animationDuration?: number;

  /** Is premium/paid */
  isPremium: boolean;

  /** Coin cost (if purchasable) */
  coinCost?: number;

  /** Preview image URL */
  previewUrl?: string;

  /** Tags for filtering */
  tags: string[];

  // ---- Lottie border fields (optional) ----

  /** Lottie animation URL (CDN-hosted JSON) */
  lottieUrl?: string;

  /** Lottie asset ID for referencing backend manifest */
  lottieAssetId?: string;

  /** Lottie playback configuration */
  lottieConfig?: {
    loop?: boolean;
    speed?: number;
    segment?: [number, number];
  };
}

// ==================== PARTICLE TYPES ====================

export type ParticleType =
  | 'circle'
  | 'square'
  | 'star'
  | 'heart'
  | 'sparkle'
  | 'pixel'
  | 'leaf'
  | 'petal'
  | 'snowflake'
  | 'flame'
  | 'bubble'
  | 'lightning'
  | 'rune'
  | 'gear'
  | 'triangle'
  | 'hexagon'
  | 'custom'
  | 'spark'
  | 'sakura'
  | 'coin'
  | 'electric'
  | 'crystal'
  | 'glitch'
  | 'void';

export interface ParticleConfig {
  type: ParticleType;
  count: number;
  size: number;
  color: string;
  opacity: number;
  speed: number;
  direction: 'clockwise' | 'counterclockwise' | 'random' | 'outward' | 'inward';
  pattern: 'orbit' | 'spiral' | 'burst' | 'wave' | 'grid' | 'random';
}

// ==================== ANIMATION TYPES ====================

export type BorderAnimationType =
  | 'static'
  | 'rotate'
  | 'pulse'
  | 'glow'
  | 'shimmer'
  | 'gradient-shift'
  | 'particles'
  | 'morph'
  | 'glitch'
  | 'wave'
  | 'spiral'
  | 'breathe'
  | 'flicker'
  | 'cascade'
  | 'ripple'
  | 'lottie';

// ==================== THEME COLORS ====================

export const THEME_COLORS: Record<
  BorderTheme,
  { primary: string; secondary: string; accent: string }
> = {
  free: {
    primary: '#9ca3af',
    secondary: '#6b7280',
    accent: '#d1d5db',
  },
  premium: {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
  },
  enterprise: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a78bfa',
  },
  legendary: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24',
  },
  mythic: {
    primary: '#ec4899',
    secondary: '#db2777',
    accent: '#f472b6',
  },
  '8bit': {
    primary: '#00ff00',
    secondary: '#ff00ff',
    accent: '#00ffff',
  },
  japanese: {
    primary: '#e63946',
    secondary: '#f1faee',
    accent: '#a8dadc',
  },
  chinese: {
    primary: '#c1121f',
    secondary: '#ffc300',
    accent: '#003566',
  },
  anime: {
    primary: '#ff006e',
    secondary: '#8338ec',
    accent: '#3a86ff',
  },
  cyberpunk: {
    primary: '#00f5ff',
    secondary: '#ff00ff',
    accent: '#ffff00',
  },
  gothic: {
    primary: '#000000',
    secondary: '#8b0000',
    accent: '#4b0082',
  },
  kawaii: {
    primary: '#ffb3d9',
    secondary: '#b3e0ff',
    accent: '#ffffb3',
  },
  steampunk: {
    primary: '#8b4513',
    secondary: '#cd7f32',
    accent: '#ffd700',
  },
  vaporwave: {
    primary: '#ff71ce',
    secondary: '#01cdfe',
    accent: '#05ffa1',
  },
  cosmic: {
    primary: '#4a0e8f',
    secondary: '#7b2cbf',
    accent: '#c77dff',
  },
  fantasy: {
    primary: '#6a4c93',
    secondary: '#1982c4',
    accent: '#8ac926',
  },
  nature: {
    primary: '#2d6a4f',
    secondary: '#52b788',
    accent: '#95d5b2',
  },
  tribal: {
    primary: '#d4a574',
    secondary: '#8b4513',
    accent: '#ff6347',
  },
  geometric: {
    primary: '#457b9d',
    secondary: '#1d3557',
    accent: '#f1faee',
  },
  holographic: {
    primary: '#ff00ff',
    secondary: '#00ffff',
    accent: '#ffff00',
  },
  elemental: {
    primary: '#e63946',
    secondary: '#457b9d',
    accent: '#2a9d8f',
  },
  scifi: {
    primary: '#00d4ff',
    secondary: '#7209b7',
    accent: '#4cc9f0',
  },
  minimal: {
    primary: '#374151',
    secondary: '#6b7280',
    accent: '#9ca3af',
  },
  gaming: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    accent: '#22c55e',
  },
  seasonal: {
    primary: '#f59e0b',
    secondary: '#ef4444',
    accent: '#10b981',
  },
  achievement: {
    primary: '#fbbf24',
    secondary: '#f59e0b',
    accent: '#d97706',
  },
};

// ==================== RARITY COLORS ====================

export const RARITY_COLORS: Record<BorderRarity, { glow: string; gradient: string }> = {
  free: {
    glow: 'rgba(156, 163, 175, 0.3)',
    gradient: 'from-gray-400 to-gray-500',
  },
  common: {
    glow: 'rgba(156, 163, 175, 0.4)',
    gradient: 'from-gray-500 to-gray-600',
  },
  uncommon: {
    glow: 'rgba(16, 185, 129, 0.5)',
    gradient: 'from-emerald-400 to-green-500',
  },
  rare: {
    glow: 'rgba(59, 130, 246, 0.5)',
    gradient: 'from-blue-400 to-indigo-500',
  },
  epic: {
    glow: 'rgba(139, 92, 246, 0.6)',
    gradient: 'from-purple-400 to-violet-500',
  },
  legendary: {
    glow: 'rgba(245, 158, 11, 0.7)',
    gradient: 'from-yellow-400 via-amber-400 to-orange-500',
  },
  mythic: {
    glow: 'rgba(236, 72, 153, 0.8)',
    gradient: 'from-pink-400 via-rose-400 to-red-500',
  },
};
