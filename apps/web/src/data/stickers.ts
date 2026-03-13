/**
 * Animated Stickers System
 *
 * Premium animated stickers for chat with various animation effects.
 * Designed for monetization with tiered pricing and sticker packs.
 */

export type StickerCategory =
  | 'emotions'
  | 'reactions'
  | 'memes'
  | 'seasonal'
  | 'gaming'
  | 'animals'
  | 'food'
  | 'special';
export type StickerRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type StickerAnimation =
  | 'none'
  | 'bounce'
  | 'shake'
  | 'spin'
  | 'pulse'
  | 'wiggle'
  | 'float'
  | 'pop'
  | 'wave'
  | 'zoom'
  | 'flip'
  | 'swing'
  | 'jello'
  | 'heartbeat'
  | 'flash'
  | 'rubberband';

export interface Sticker {
  id: string;
  name: string;
  emoji: string; // Fallback emoji for the sticker
  category: StickerCategory;
  rarity: StickerRarity;
  animation: StickerAnimation;
  animationDuration: number; // in ms
  soundEffect?: string;
  colors: string[];
  description: string;
  packId: string;
}

export interface StickerPack {
  id: string;
  name: string;
  description: string;
  coverEmoji: string;
  category: StickerCategory;
  rarity: StickerRarity;
  coinPrice: number;
  isFree: boolean;
  isLimited: boolean;
  limitedUntil?: string;
  stickerCount: number;
  previewColors: string[];
}

// Rarity colors for UI styling
export const STICKER_RARITY_COLORS: Record<
  StickerRarity,
  { bg: string; border: string; text: string; glow: string }
> = {
  common: {
    bg: 'bg-gray-500/20',
    border: 'border-gray-500/50',
    text: 'text-gray-400',
    glow: 'shadow-gray-500/20',
  },
  uncommon: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    glow: 'shadow-green-500/30',
  },
  rare: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/30',
  },
  epic: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/40',
  },
  legendary: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/50',
  },
};

// Animation keyframes definitions
export const STICKER_ANIMATIONS: Record<StickerAnimation, string> = {
  none: '',
  bounce: 'animate-bounce',
  shake: 'animate-shake',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  wiggle: 'animate-wiggle',
  float: 'animate-float',
  pop: 'animate-pop',
  wave: 'animate-wave',
  zoom: 'animate-zoom',
  flip: 'animate-flip',
  swing: 'animate-swing',
  jello: 'animate-jello',
  heartbeat: 'animate-heartbeat',
  flash: 'animate-flash',
  rubberband: 'animate-rubberband',
};

// Custom CSS animations for stickers (add to global CSS)
export const STICKER_ANIMATION_CSS = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
}

@keyframes zoom {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes flip {
  0% { transform: perspective(400px) rotateY(0); }
  100% { transform: perspective(400px) rotateY(360deg); }
}

@keyframes swing {
  20% { transform: rotate(15deg); }
  40% { transform: rotate(-10deg); }
  60% { transform: rotate(5deg); }
  80% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}

@keyframes jello {
  0%, 100% { transform: scale3d(1, 1, 1); }
  30% { transform: scale3d(1.25, 0.75, 1); }
  40% { transform: scale3d(0.75, 1.25, 1); }
  50% { transform: scale3d(1.15, 0.85, 1); }
  65% { transform: scale3d(0.95, 1.05, 1); }
  75% { transform: scale3d(1.05, 0.95, 1); }
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}

@keyframes flash {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.5; }
}

@keyframes rubberband {
  0% { transform: scale3d(1, 1, 1); }
  30% { transform: scale3d(1.25, 0.75, 1); }
  40% { transform: scale3d(0.75, 1.25, 1); }
  50% { transform: scale3d(1.15, 0.85, 1); }
  65% { transform: scale3d(0.95, 1.05, 1); }
  75% { transform: scale3d(1.05, 0.95, 1); }
  100% { transform: scale3d(1, 1, 1); }
}

.animate-shake { animation: shake 0.5s ease-in-out; }
.animate-wiggle { animation: wiggle 0.5s ease-in-out infinite; }
.animate-float { animation: float 2s ease-in-out infinite; }
.animate-pop { animation: pop 0.3s ease-out; }
.animate-wave { animation: wave 1s ease-in-out infinite; }
.animate-zoom { animation: zoom 1s ease-in-out infinite; }
.animate-flip { animation: flip 1s ease-in-out; }
.animate-swing { animation: swing 1s ease-in-out; }
.animate-jello { animation: jello 1s ease-in-out; }
.animate-heartbeat { animation: heartbeat 1.5s ease-in-out infinite; }
.animate-flash { animation: flash 1s ease-in-out infinite; }
.animate-rubberband { animation: rubberband 1s ease-in-out; }
`;

// ==================== STICKER PACKS ====================
export const STICKER_PACKS: StickerPack[] = [
  // ========== FREE PACKS ==========
  {
    id: 'basic_emotions',
    name: 'Basic Emotions',
    description: 'Essential emotion stickers for everyday conversations',
    coverEmoji: '😊',
    category: 'emotions',
    rarity: 'common',
    coinPrice: 0,
    isFree: true,
    isLimited: false,
    stickerCount: 12,
    previewColors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
  },
  {
    id: 'simple_reactions',
    name: 'Quick Reactions',
    description: 'Fast reaction stickers for any situation',
    coverEmoji: '👍',
    category: 'reactions',
    rarity: 'common',
    coinPrice: 0,
    isFree: true,
    isLimited: false,
    stickerCount: 10,
    previewColors: ['#4CAF50', '#2196F3', '#FF9800'],
  },

  // ========== PREMIUM PACKS ==========
  {
    id: 'animated_emotions',
    name: 'Animated Emotions',
    description: 'Expressive animated emotion stickers',
    coverEmoji: '🎭',
    category: 'emotions',
    rarity: 'uncommon',
    coinPrice: 300,
    isFree: false,
    isLimited: false,
    stickerCount: 15,
    previewColors: ['#E91E63', '#9C27B0', '#673AB7'],
  },
  {
    id: 'cute_animals',
    name: 'Cute Animals',
    description: 'Adorable animated animal stickers',
    coverEmoji: '🐱',
    category: 'animals',
    rarity: 'uncommon',
    coinPrice: 350,
    isFree: false,
    isLimited: false,
    stickerCount: 18,
    previewColors: ['#FF9800', '#795548', '#607D8B'],
  },
  {
    id: 'food_frenzy',
    name: 'Food Frenzy',
    description: 'Delicious animated food stickers',
    coverEmoji: '🍕',
    category: 'food',
    rarity: 'uncommon',
    coinPrice: 300,
    isFree: false,
    isLimited: false,
    stickerCount: 16,
    previewColors: ['#FF5722', '#FFEB3B', '#8BC34A'],
  },
  {
    id: 'gaming_vibes',
    name: 'Gaming Vibes',
    description: 'Epic gaming stickers for gamers',
    coverEmoji: '🎮',
    category: 'gaming',
    rarity: 'rare',
    coinPrice: 500,
    isFree: false,
    isLimited: false,
    stickerCount: 20,
    previewColors: ['#00BCD4', '#3F51B5', '#F44336'],
  },
  {
    id: 'meme_masters',
    name: 'Meme Masters',
    description: 'Classic meme-inspired animated stickers',
    coverEmoji: '😂',
    category: 'memes',
    rarity: 'rare',
    coinPrice: 450,
    isFree: false,
    isLimited: false,
    stickerCount: 15,
    previewColors: ['#FF4081', '#7C4DFF', '#18FFFF'],
  },
  {
    id: 'party_time',
    name: 'Party Time',
    description: 'Celebration stickers with confetti effects',
    coverEmoji: '🎉',
    category: 'reactions',
    rarity: 'rare',
    coinPrice: 400,
    isFree: false,
    isLimited: false,
    stickerCount: 14,
    previewColors: ['#E040FB', '#FF5252', '#FFEA00'],
  },

  // ========== EPIC PACKS ==========
  {
    id: 'neon_emotions',
    name: 'Neon Emotions',
    description: 'Glowing neon animated emotion stickers',
    coverEmoji: '💫',
    category: 'emotions',
    rarity: 'epic',
    coinPrice: 800,
    isFree: false,
    isLimited: false,
    stickerCount: 20,
    previewColors: ['#FF00FF', '#00FFFF', '#FFFF00'],
  },
  {
    id: 'legendary_creatures',
    name: 'Legendary Creatures',
    description: 'Mythical creature stickers with special effects',
    coverEmoji: '🐉',
    category: 'animals',
    rarity: 'epic',
    coinPrice: 900,
    isFree: false,
    isLimited: false,
    stickerCount: 16,
    previewColors: ['#9C27B0', '#FF5722', '#2196F3'],
  },
  {
    id: 'cyber_reactions',
    name: 'Cyber Reactions',
    description: 'Futuristic cyberpunk reaction stickers',
    coverEmoji: '🤖',
    category: 'reactions',
    rarity: 'epic',
    coinPrice: 850,
    isFree: false,
    isLimited: false,
    stickerCount: 18,
    previewColors: ['#00E5FF', '#FF1744', '#76FF03'],
  },
  {
    id: 'space_odyssey',
    name: 'Space Odyssey',
    description: 'Cosmic space-themed animated stickers',
    coverEmoji: '🚀',
    category: 'special',
    rarity: 'epic',
    coinPrice: 950,
    isFree: false,
    isLimited: false,
    stickerCount: 20,
    previewColors: ['#3F51B5', '#9C27B0', '#00BCD4'],
  },

  // ========== LEGENDARY PACKS ==========
  {
    id: 'ultimate_emotions',
    name: 'Ultimate Emotions',
    description: 'The most expressive animated stickers with particle effects',
    coverEmoji: '✨',
    category: 'emotions',
    rarity: 'legendary',
    coinPrice: 1500,
    isFree: false,
    isLimited: false,
    stickerCount: 25,
    previewColors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6'],
  },
  {
    id: 'galaxy_special',
    name: 'Galaxy Collection',
    description: 'Ultra-rare galactic stickers with cosmic animations',
    coverEmoji: '🌌',
    category: 'special',
    rarity: 'legendary',
    coinPrice: 2000,
    isFree: false,
    isLimited: false,
    stickerCount: 20,
    previewColors: ['#9C27B0', '#3F51B5', '#00BCD4', '#E91E63'],
  },
  {
    id: 'holographic_collection',
    name: 'Holographic Collection',
    description: 'Stunning holographic effect stickers',
    coverEmoji: '💎',
    category: 'special',
    rarity: 'legendary',
    coinPrice: 2500,
    isFree: false,
    isLimited: false,
    stickerCount: 18,
    previewColors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0000'],
  },

  // ========== SEASONAL PACKS ==========
  {
    id: 'winter_wonderland',
    name: 'Winter Wonderland',
    description: 'Festive winter holiday stickers',
    coverEmoji: '❄️',
    category: 'seasonal',
    rarity: 'rare',
    coinPrice: 400,
    isFree: false,
    isLimited: true,
    limitedUntil: '2026-01-31',
    stickerCount: 16,
    previewColors: ['#B3E5FC', '#FFFFFF', '#1976D2'],
  },
  {
    id: 'lunar_new_year',
    name: 'Lunar New Year',
    description: 'Celebrate the Year of the Snake',
    coverEmoji: '🐍',
    category: 'seasonal',
    rarity: 'epic',
    coinPrice: 600,
    isFree: false,
    isLimited: true,
    limitedUntil: '2026-02-28',
    stickerCount: 18,
    previewColors: ['#F44336', '#FFD700', '#FF5722'],
  },
  {
    id: 'valentines_love',
    name: "Valentine's Special",
    description: 'Romantic stickers for love and affection',
    coverEmoji: '💝',
    category: 'seasonal',
    rarity: 'rare',
    coinPrice: 450,
    isFree: false,
    isLimited: true,
    limitedUntil: '2026-02-14',
    stickerCount: 14,
    previewColors: ['#E91E63', '#F48FB1', '#FF1744'],
  },
];

// ==================== STICKERS ====================
export const STICKERS: Sticker[] = [
  // ========== BASIC EMOTIONS PACK (FREE) ==========
  {
    id: 'happy_smile',
    name: 'Happy Smile',
    emoji: '😊',
    category: 'emotions',
    rarity: 'common',
    animation: 'bounce',
    animationDuration: 500,
    colors: ['#FFD700', '#FFA500'],
    description: 'A cheerful bouncing smile',
    packId: 'basic_emotions',
  },
  {
    id: 'sad_tear',
    name: 'Sad Tear',
    emoji: '😢',
    category: 'emotions',
    rarity: 'common',
    animation: 'pulse',
    animationDuration: 1000,
    colors: ['#6B9BD2', '#4A7CAC'],
    description: 'A pulsing sad tear',
    packId: 'basic_emotions',
  },
  {
    id: 'laugh_out_loud',
    name: 'LOL',
    emoji: '😂',
    category: 'emotions',
    rarity: 'common',
    animation: 'shake',
    animationDuration: 500,
    colors: ['#FFE066', '#FFCC00'],
    description: 'Laughing so hard it shakes',
    packId: 'basic_emotions',
  },
  {
    id: 'love_hearts',
    name: 'In Love',
    emoji: '😍',
    category: 'emotions',
    rarity: 'common',
    animation: 'heartbeat',
    animationDuration: 1500,
    colors: ['#FF6B9D', '#E91E63'],
    description: 'Heart-eyed with love',
    packId: 'basic_emotions',
  },
  {
    id: 'angry_face',
    name: 'Angry',
    emoji: '😠',
    category: 'emotions',
    rarity: 'common',
    animation: 'shake',
    animationDuration: 300,
    colors: ['#FF4444', '#CC0000'],
    description: 'Shaking with anger',
    packId: 'basic_emotions',
  },
  {
    id: 'surprised_wow',
    name: 'Surprised',
    emoji: '😮',
    category: 'emotions',
    rarity: 'common',
    animation: 'pop',
    animationDuration: 300,
    colors: ['#FFBB33', '#FF8800'],
    description: 'Popping with surprise',
    packId: 'basic_emotions',
  },
  {
    id: 'thinking_hmm',
    name: 'Thinking',
    emoji: '🤔',
    category: 'emotions',
    rarity: 'common',
    animation: 'float',
    animationDuration: 2000,
    colors: ['#9E9E9E', '#757575'],
    description: 'Deep in thought',
    packId: 'basic_emotions',
  },
  {
    id: 'cool_sunglasses',
    name: 'Cool',
    emoji: '😎',
    category: 'emotions',
    rarity: 'common',
    animation: 'swing',
    animationDuration: 1000,
    colors: ['#2196F3', '#1976D2'],
    description: 'Too cool for school',
    packId: 'basic_emotions',
  },
  {
    id: 'sleepy_zzz',
    name: 'Sleepy',
    emoji: '😴',
    category: 'emotions',
    rarity: 'common',
    animation: 'float',
    animationDuration: 2500,
    colors: ['#9C27B0', '#7B1FA2'],
    description: 'Floating to dreamland',
    packId: 'basic_emotions',
  },
  {
    id: 'wink_face',
    name: 'Wink',
    emoji: '😉',
    category: 'emotions',
    rarity: 'common',
    animation: 'bounce',
    animationDuration: 500,
    colors: ['#FFC107', '#FF9800'],
    description: 'Playful wink',
    packId: 'basic_emotions',
  },
  {
    id: 'sick_face',
    name: 'Sick',
    emoji: '🤒',
    category: 'emotions',
    rarity: 'common',
    animation: 'wiggle',
    animationDuration: 800,
    colors: ['#8BC34A', '#689F38'],
    description: 'Feeling under the weather',
    packId: 'basic_emotions',
  },
  {
    id: 'crazy_eyes',
    name: 'Crazy',
    emoji: '🤪',
    category: 'emotions',
    rarity: 'common',
    animation: 'jello',
    animationDuration: 1000,
    colors: ['#FF5722', '#E64A19'],
    description: 'Going absolutely crazy',
    packId: 'basic_emotions',
  },

  // ========== SIMPLE REACTIONS PACK (FREE) ==========
  {
    id: 'thumbs_up',
    name: 'Thumbs Up',
    emoji: '👍',
    category: 'reactions',
    rarity: 'common',
    animation: 'pop',
    animationDuration: 300,
    colors: ['#4CAF50', '#388E3C'],
    description: 'Approval pop',
    packId: 'simple_reactions',
  },
  {
    id: 'thumbs_down',
    name: 'Thumbs Down',
    emoji: '👎',
    category: 'reactions',
    rarity: 'common',
    animation: 'shake',
    animationDuration: 400,
    colors: ['#F44336', '#D32F2F'],
    description: 'Disapproval shake',
    packId: 'simple_reactions',
  },
  {
    id: 'clapping_hands',
    name: 'Clapping',
    emoji: '👏',
    category: 'reactions',
    rarity: 'common',
    animation: 'rubberband',
    animationDuration: 600,
    colors: ['#FF9800', '#F57C00'],
    description: 'Applause animation',
    packId: 'simple_reactions',
  },
  {
    id: 'fire_hot',
    name: 'Fire',
    emoji: '🔥',
    category: 'reactions',
    rarity: 'common',
    animation: 'pulse',
    animationDuration: 800,
    colors: ['#FF5722', '#FF9800', '#FFEB3B'],
    description: "That's fire!",
    packId: 'simple_reactions',
  },
  {
    id: 'heart_love',
    name: 'Heart',
    emoji: '❤️',
    category: 'reactions',
    rarity: 'common',
    animation: 'heartbeat',
    animationDuration: 1200,
    colors: ['#E91E63', '#C2185B'],
    description: 'Beating heart',
    packId: 'simple_reactions',
  },
  {
    id: 'star_sparkle',
    name: 'Star',
    emoji: '⭐',
    category: 'reactions',
    rarity: 'common',
    animation: 'spin',
    animationDuration: 1500,
    colors: ['#FFD700', '#FFC107'],
    description: 'Spinning star',
    packId: 'simple_reactions',
  },
  {
    id: 'check_mark',
    name: 'Check',
    emoji: '✅',
    category: 'reactions',
    rarity: 'common',
    animation: 'pop',
    animationDuration: 250,
    colors: ['#4CAF50', '#2E7D32'],
    description: 'Done!',
    packId: 'simple_reactions',
  },
  {
    id: 'cross_mark',
    name: 'Cross',
    emoji: '❌',
    category: 'reactions',
    rarity: 'common',
    animation: 'shake',
    animationDuration: 300,
    colors: ['#F44336', '#B71C1C'],
    description: 'Nope!',
    packId: 'simple_reactions',
  },
  {
    id: 'hundred_points',
    name: '100',
    emoji: '💯',
    category: 'reactions',
    rarity: 'common',
    animation: 'bounce',
    animationDuration: 500,
    colors: ['#F44336', '#D32F2F'],
    description: 'Perfect score!',
    packId: 'simple_reactions',
  },
  {
    id: 'eyes_look',
    name: 'Eyes',
    emoji: '👀',
    category: 'reactions',
    rarity: 'common',
    animation: 'wiggle',
    animationDuration: 600,
    colors: ['#9E9E9E', '#616161'],
    description: 'Looking around',
    packId: 'simple_reactions',
  },

  // ========== ANIMATED EMOTIONS PACK ==========
  {
    id: 'party_face',
    name: 'Party Face',
    emoji: '🥳',
    category: 'emotions',
    rarity: 'uncommon',
    animation: 'jello',
    animationDuration: 800,
    soundEffect: 'party_horn',
    colors: ['#FF4081', '#7C4DFF', '#18FFFF'],
    description: 'Party time celebration',
    packId: 'animated_emotions',
  },
  {
    id: 'mind_blown',
    name: 'Mind Blown',
    emoji: '🤯',
    category: 'emotions',
    rarity: 'uncommon',
    animation: 'shake',
    animationDuration: 600,
    soundEffect: 'explosion',
    colors: ['#FF5722', '#FFEB3B', '#FF9800'],
    description: 'Mind officially blown',
    packId: 'animated_emotions',
  },
  {
    id: 'star_eyes',
    name: 'Star Eyes',
    emoji: '🤩',
    category: 'emotions',
    rarity: 'uncommon',
    animation: 'flash',
    animationDuration: 1000,
    colors: ['#FFD700', '#FFC107', '#FFEB3B'],
    description: 'Starstruck amazement',
    packId: 'animated_emotions',
  },
  {
    id: 'nervous_sweat',
    name: 'Nervous',
    emoji: '😰',
    category: 'emotions',
    rarity: 'uncommon',
    animation: 'wiggle',
    animationDuration: 400,
    colors: ['#90CAF9', '#42A5F5'],
    description: 'Nervously sweating',
    packId: 'animated_emotions',
  },
  {
    id: 'pleading_eyes',
    name: 'Pleading',
    emoji: '🥺',
    category: 'emotions',
    rarity: 'uncommon',
    animation: 'heartbeat',
    animationDuration: 1200,
    colors: ['#CE93D8', '#AB47BC'],
    description: 'Pretty please',
    packId: 'animated_emotions',
  },

  // ========== CUTE ANIMALS PACK ==========
  {
    id: 'happy_cat',
    name: 'Happy Cat',
    emoji: '😺',
    category: 'animals',
    rarity: 'uncommon',
    animation: 'bounce',
    animationDuration: 600,
    colors: ['#FF9800', '#F57C00'],
    description: 'Bouncy happy cat',
    packId: 'cute_animals',
  },
  {
    id: 'love_cat',
    name: 'Love Cat',
    emoji: '😻',
    category: 'animals',
    rarity: 'uncommon',
    animation: 'heartbeat',
    animationDuration: 1000,
    colors: ['#E91E63', '#FF9800'],
    description: 'Cat in love',
    packId: 'cute_animals',
  },
  {
    id: 'puppy_face',
    name: 'Puppy',
    emoji: '🐶',
    category: 'animals',
    rarity: 'uncommon',
    animation: 'wiggle',
    animationDuration: 500,
    colors: ['#8D6E63', '#6D4C41'],
    description: 'Tail-wagging puppy',
    packId: 'cute_animals',
  },
  {
    id: 'bunny_hop',
    name: 'Bunny',
    emoji: '🐰',
    category: 'animals',
    rarity: 'uncommon',
    animation: 'bounce',
    animationDuration: 400,
    colors: ['#F5F5F5', '#FCE4EC'],
    description: 'Hopping bunny',
    packId: 'cute_animals',
  },
  {
    id: 'panda_wave',
    name: 'Panda',
    emoji: '🐼',
    category: 'animals',
    rarity: 'uncommon',
    animation: 'wave',
    animationDuration: 1000,
    colors: ['#FFFFFF', '#212121'],
    description: 'Waving panda',
    packId: 'cute_animals',
  },
  {
    id: 'fox_sly',
    name: 'Fox',
    emoji: '🦊',
    category: 'animals',
    rarity: 'uncommon',
    animation: 'swing',
    animationDuration: 800,
    colors: ['#FF5722', '#BF360C'],
    description: 'Sly fox',
    packId: 'cute_animals',
  },

  // ========== GAMING VIBES PACK ==========
  {
    id: 'game_controller',
    name: 'Controller',
    emoji: '🎮',
    category: 'gaming',
    rarity: 'rare',
    animation: 'shake',
    animationDuration: 400,
    colors: ['#424242', '#1976D2', '#F44336'],
    description: 'Button mashing',
    packId: 'gaming_vibes',
  },
  {
    id: 'trophy_winner',
    name: 'Trophy',
    emoji: '🏆',
    category: 'gaming',
    rarity: 'rare',
    animation: 'bounce',
    animationDuration: 600,
    soundEffect: 'victory_fanfare',
    colors: ['#FFD700', '#FFA000'],
    description: 'Victory achieved!',
    packId: 'gaming_vibes',
  },
  {
    id: 'joystick_move',
    name: 'Joystick',
    emoji: '🕹️',
    category: 'gaming',
    rarity: 'rare',
    animation: 'wiggle',
    animationDuration: 500,
    colors: ['#F44336', '#212121'],
    description: 'Retro gaming',
    packId: 'gaming_vibes',
  },
  {
    id: 'headphones_music',
    name: 'Headphones',
    emoji: '🎧',
    category: 'gaming',
    rarity: 'rare',
    animation: 'pulse',
    animationDuration: 800,
    colors: ['#9C27B0', '#7B1FA2'],
    description: 'Gaming vibes',
    packId: 'gaming_vibes',
  },
  {
    id: 'sword_attack',
    name: 'Sword',
    emoji: '⚔️',
    category: 'gaming',
    rarity: 'rare',
    animation: 'swing',
    animationDuration: 400,
    soundEffect: 'sword_clash',
    colors: ['#78909C', '#455A64'],
    description: 'Battle ready',
    packId: 'gaming_vibes',
  },
  {
    id: 'crystal_gem',
    name: 'Crystal',
    emoji: '💎',
    category: 'gaming',
    rarity: 'rare',
    animation: 'spin',
    animationDuration: 2000,
    colors: ['#00BCD4', '#00ACC1', '#0097A7'],
    description: 'Precious loot',
    packId: 'gaming_vibes',
  },
  {
    id: 'potion_drink',
    name: 'Potion',
    emoji: '🧪',
    category: 'gaming',
    rarity: 'rare',
    animation: 'float',
    animationDuration: 1500,
    colors: ['#4CAF50', '#8BC34A', '#CDDC39'],
    description: 'Health restored',
    packId: 'gaming_vibes',
  },
  {
    id: 'ghost_boo',
    name: 'Ghost',
    emoji: '👻',
    category: 'gaming',
    rarity: 'rare',
    animation: 'float',
    animationDuration: 2000,
    colors: ['#FFFFFF', '#E0E0E0'],
    description: 'Spooky ghost',
    packId: 'gaming_vibes',
  },

  // ========== NEON EMOTIONS PACK (EPIC) ==========
  {
    id: 'neon_heart',
    name: 'Neon Heart',
    emoji: '💖',
    category: 'emotions',
    rarity: 'epic',
    animation: 'heartbeat',
    animationDuration: 1000,
    colors: ['#FF00FF', '#FF1493', '#FF69B4'],
    description: 'Glowing neon heart',
    packId: 'neon_emotions',
  },
  {
    id: 'neon_star',
    name: 'Neon Star',
    emoji: '🌟',
    category: 'emotions',
    rarity: 'epic',
    animation: 'spin',
    animationDuration: 1500,
    colors: ['#FFFF00', '#FFD700', '#FFA500'],
    description: 'Spinning neon star',
    packId: 'neon_emotions',
  },
  {
    id: 'neon_lightning',
    name: 'Neon Lightning',
    emoji: '⚡',
    category: 'emotions',
    rarity: 'epic',
    animation: 'flash',
    animationDuration: 500,
    colors: ['#00FFFF', '#00CED1', '#20B2AA'],
    description: 'Electric neon bolt',
    packId: 'neon_emotions',
  },
  {
    id: 'neon_fire',
    name: 'Neon Fire',
    emoji: '🔥',
    category: 'emotions',
    rarity: 'epic',
    animation: 'pulse',
    animationDuration: 600,
    colors: ['#FF4500', '#FF6347', '#FF7F50'],
    description: 'Glowing neon flames',
    packId: 'neon_emotions',
  },
  {
    id: 'neon_rainbow',
    name: 'Neon Rainbow',
    emoji: '🌈',
    category: 'emotions',
    rarity: 'epic',
    animation: 'wave',
    animationDuration: 2000,
    colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'],
    description: 'Flowing neon rainbow',
    packId: 'neon_emotions',
  },

  // ========== LEGENDARY CREATURES PACK (EPIC) ==========
  {
    id: 'dragon_fire',
    name: 'Fire Dragon',
    emoji: '🐉',
    category: 'animals',
    rarity: 'epic',
    animation: 'shake',
    animationDuration: 500,
    soundEffect: 'dragon_roar',
    colors: ['#FF5722', '#F44336', '#FFEB3B'],
    description: 'Fire-breathing dragon',
    packId: 'legendary_creatures',
  },
  {
    id: 'unicorn_magic',
    name: 'Unicorn',
    emoji: '🦄',
    category: 'animals',
    rarity: 'epic',
    animation: 'float',
    animationDuration: 2000,
    colors: ['#E91E63', '#9C27B0', '#3F51B5', '#2196F3'],
    description: 'Magical unicorn',
    packId: 'legendary_creatures',
  },
  {
    id: 'phoenix_rise',
    name: 'Phoenix',
    emoji: '🔥',
    category: 'animals',
    rarity: 'epic',
    animation: 'pulse',
    animationDuration: 1000,
    colors: ['#FF5722', '#FF9800', '#FFEB3B', '#F44336'],
    description: 'Rising phoenix',
    packId: 'legendary_creatures',
  },

  // ========== ULTIMATE EMOTIONS PACK (LEGENDARY) ==========
  {
    id: 'cosmic_love',
    name: 'Cosmic Love',
    emoji: '💕',
    category: 'emotions',
    rarity: 'legendary',
    animation: 'heartbeat',
    animationDuration: 1200,
    soundEffect: 'cosmic_love',
    colors: ['#FF00FF', '#00FFFF', '#FF1493', '#9400D3'],
    description: 'Love across the universe',
    packId: 'ultimate_emotions',
  },
  {
    id: 'supernova_joy',
    name: 'Supernova Joy',
    emoji: '🌟',
    category: 'emotions',
    rarity: 'legendary',
    animation: 'spin',
    animationDuration: 1000,
    soundEffect: 'supernova',
    colors: ['#FFFFFF', '#FFD700', '#FF6B6B', '#9400D3'],
    description: 'Explosive happiness',
    packId: 'ultimate_emotions',
  },
  {
    id: 'quantum_mind',
    name: 'Quantum Mind',
    emoji: '🧠',
    category: 'emotions',
    rarity: 'legendary',
    animation: 'pulse',
    animationDuration: 800,
    colors: ['#9C27B0', '#00BCD4', '#4CAF50', '#FF9800'],
    description: 'Infinite intelligence',
    packId: 'ultimate_emotions',
  },
  {
    id: 'celestial_peace',
    name: 'Celestial Peace',
    emoji: '☮️',
    category: 'emotions',
    rarity: 'legendary',
    animation: 'float',
    animationDuration: 3000,
    colors: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6'],
    description: 'Heavenly tranquility',
    packId: 'ultimate_emotions',
  },
  {
    id: 'void_mystery',
    name: 'Void Mystery',
    emoji: '🕳️',
    category: 'emotions',
    rarity: 'legendary',
    animation: 'spin',
    animationDuration: 5000,
    colors: ['#000000', '#1A1A2E', '#16213E', '#0F3460'],
    description: 'Endless depth',
    packId: 'ultimate_emotions',
  },

  // ========== GALAXY SPECIAL PACK (LEGENDARY) ==========
  {
    id: 'galaxy_spiral',
    name: 'Galaxy Spiral',
    emoji: '🌌',
    category: 'special',
    rarity: 'legendary',
    animation: 'spin',
    animationDuration: 8000,
    soundEffect: 'space_ambient',
    colors: ['#9C27B0', '#3F51B5', '#00BCD4', '#E91E63'],
    description: 'Spiraling galaxy',
    packId: 'galaxy_special',
  },
  {
    id: 'black_hole',
    name: 'Black Hole',
    emoji: '🕳️',
    category: 'special',
    rarity: 'legendary',
    animation: 'spin',
    animationDuration: 3000,
    colors: ['#000000', '#1A0033', '#330066'],
    description: 'Gravitational pull',
    packId: 'galaxy_special',
  },
  {
    id: 'meteor_shower',
    name: 'Meteor Shower',
    emoji: '☄️',
    category: 'special',
    rarity: 'legendary',
    animation: 'shake',
    animationDuration: 400,
    soundEffect: 'meteor_impact',
    colors: ['#FF5722', '#FF9800', '#FFEB3B'],
    description: 'Cosmic bombardment',
    packId: 'galaxy_special',
  },
  {
    id: 'aurora_lights',
    name: 'Aurora',
    emoji: '🌈',
    category: 'special',
    rarity: 'legendary',
    animation: 'wave',
    animationDuration: 3000,
    colors: ['#00FF00', '#00FFFF', '#FF00FF', '#FFFF00'],
    description: 'Northern lights dance',
    packId: 'galaxy_special',
  },
  {
    id: 'saturn_rings',
    name: 'Saturn',
    emoji: '🪐',
    category: 'special',
    rarity: 'legendary',
    animation: 'spin',
    animationDuration: 6000,
    colors: ['#FFCC80', '#FFE0B2', '#FFF3E0'],
    description: 'Ringed planet',
    packId: 'galaxy_special',
  },

  // ========== HOLOGRAPHIC COLLECTION (LEGENDARY) ==========
  {
    id: 'holo_diamond',
    name: 'Holo Diamond',
    emoji: '💎',
    category: 'special',
    rarity: 'legendary',
    animation: 'spin',
    animationDuration: 2000,
    colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0000', '#00FF00'],
    description: 'Holographic gem',
    packId: 'holographic_collection',
  },
  {
    id: 'holo_crown',
    name: 'Holo Crown',
    emoji: '👑',
    category: 'special',
    rarity: 'legendary',
    animation: 'float',
    animationDuration: 2500,
    colors: ['#FFD700', '#FF00FF', '#00FFFF', '#FF6B6B'],
    description: 'Holographic royalty',
    packId: 'holographic_collection',
  },
  {
    id: 'holo_butterfly',
    name: 'Holo Butterfly',
    emoji: '🦋',
    category: 'special',
    rarity: 'legendary',
    animation: 'float',
    animationDuration: 2000,
    colors: ['#E91E63', '#9C27B0', '#2196F3', '#00BCD4'],
    description: 'Iridescent butterfly',
    packId: 'holographic_collection',
  },

  // ========== WINTER WONDERLAND PACK (SEASONAL) ==========
  {
    id: 'snowflake_fall',
    name: 'Snowflake',
    emoji: '❄️',
    category: 'seasonal',
    rarity: 'rare',
    animation: 'float',
    animationDuration: 3000,
    colors: ['#FFFFFF', '#B3E5FC', '#81D4FA'],
    description: 'Falling snowflake',
    packId: 'winter_wonderland',
  },
  {
    id: 'snowman_wave',
    name: 'Snowman',
    emoji: '⛄',
    category: 'seasonal',
    rarity: 'rare',
    animation: 'wave',
    animationDuration: 1000,
    colors: ['#FFFFFF', '#FF9800', '#795548'],
    description: 'Friendly snowman',
    packId: 'winter_wonderland',
  },
  {
    id: 'christmas_tree',
    name: 'Christmas Tree',
    emoji: '🎄',
    category: 'seasonal',
    rarity: 'rare',
    animation: 'flash',
    animationDuration: 1500,
    colors: ['#4CAF50', '#F44336', '#FFD700'],
    description: 'Twinkling tree',
    packId: 'winter_wonderland',
  },
  {
    id: 'santa_hat',
    name: 'Santa Hat',
    emoji: '🎅',
    category: 'seasonal',
    rarity: 'rare',
    animation: 'bounce',
    animationDuration: 500,
    colors: ['#F44336', '#FFFFFF'],
    description: 'Jolly hat',
    packId: 'winter_wonderland',
  },
  {
    id: 'gift_box',
    name: 'Gift',
    emoji: '🎁',
    category: 'seasonal',
    rarity: 'rare',
    animation: 'shake',
    animationDuration: 600,
    colors: ['#F44336', '#4CAF50', '#FFD700'],
    description: 'Surprise gift',
    packId: 'winter_wonderland',
  },

  // ========== VALENTINE'S SPECIAL PACK (SEASONAL) ==========
  {
    id: 'cupid_arrow',
    name: 'Cupid Arrow',
    emoji: '💘',
    category: 'seasonal',
    rarity: 'rare',
    animation: 'swing',
    animationDuration: 800,
    colors: ['#E91E63', '#FF4081', '#FFD700'],
    description: "Cupid's love arrow",
    packId: 'valentines_love',
  },
  {
    id: 'love_letter',
    name: 'Love Letter',
    emoji: '💌',
    category: 'seasonal',
    rarity: 'rare',
    animation: 'float',
    animationDuration: 2000,
    colors: ['#FFCDD2', '#E91E63', '#F8BBD9'],
    description: 'Secret love note',
    packId: 'valentines_love',
  },
  {
    id: 'chocolate_heart',
    name: 'Chocolate',
    emoji: '🍫',
    category: 'seasonal',
    rarity: 'rare',
    animation: 'pulse',
    animationDuration: 1000,
    colors: ['#795548', '#5D4037', '#A1887F'],
    description: 'Sweet treat',
    packId: 'valentines_love',
  },
  {
    id: 'rose_bloom',
    name: 'Rose',
    emoji: '🌹',
    category: 'seasonal',
    rarity: 'rare',
    animation: 'pop',
    animationDuration: 500,
    colors: ['#F44336', '#E91E63', '#4CAF50'],
    description: 'Blooming rose',
    packId: 'valentines_love',
  },
  {
    id: 'heart_sparkle',
    name: 'Sparkling Heart',
    emoji: '💖',
    category: 'seasonal',
    rarity: 'rare',
    animation: 'heartbeat',
    animationDuration: 1200,
    colors: ['#FF4081', '#E91E63', '#FF80AB'],
    description: 'Sparkling love',
    packId: 'valentines_love',
  },
];

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get all stickers in a pack
 */
export function getStickersByPack(packId: string): Sticker[] {
  return STICKERS.filter((s) => s.packId === packId);
}

/**
 * Get sticker pack by ID
 */
export function getStickerPackById(packId: string): StickerPack | undefined {
  return STICKER_PACKS.find((p) => p.id === packId);
}

/**
 * Get stickers by category
 */
export function getStickersByCategory(category: StickerCategory): Sticker[] {
  return STICKERS.filter((s) => s.category === category);
}

/**
 * Get stickers by rarity
 */
export function getStickersByRarity(rarity: StickerRarity): Sticker[] {
  return STICKERS.filter((s) => s.rarity === rarity);
}

/**
 * Get free sticker packs
 */
export function getFreeStickerPacks(): StickerPack[] {
  return STICKER_PACKS.filter((p) => p.isFree);
}

/**
 * Get premium sticker packs
 */
export function getPremiumStickerPacks(): StickerPack[] {
  return STICKER_PACKS.filter((p) => !p.isFree && !p.isLimited);
}

/**
 * Get limited/seasonal sticker packs
 */
export function getLimitedStickerPacks(): StickerPack[] {
  return STICKER_PACKS.filter((p) => p.isLimited);
}

/**
 * Get sticker by ID
 */
export function getStickerById(id: string): Sticker | undefined {
  return STICKERS.find((s) => s.id === id);
}

/**
 * Check if a sticker pack is currently available (for limited packs)
 */
export function isStickerPackAvailable(pack: StickerPack): boolean {
  if (!pack.isLimited || !pack.limitedUntil) return true;
  return new Date() <= new Date(pack.limitedUntil);
}

/**
 * Get total coin value of a pack's stickers
 */
export function getPackValue(packId: string): number {
  const pack = getStickerPackById(packId);
  return pack?.coinPrice ?? 0;
}

/**
 * Sort packs by price
 */
export function sortPacksByPrice(ascending = true): StickerPack[] {
  return [...STICKER_PACKS].sort((a, b) =>
    ascending ? a.coinPrice - b.coinPrice : b.coinPrice - a.coinPrice
  );
}
