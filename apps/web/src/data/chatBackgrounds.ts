/**
 * Animated Chat Backgrounds
 *
 * Premium chat backgrounds with various animation effects.
 * Designed for monetization with tiered pricing.
 */

export type BackgroundCategory = 'free' | 'premium' | 'legendary' | 'seasonal';

export interface ChatBackground {
  id: string;
  name: string;
  category: BackgroundCategory;
  description: string;
  coinPrice: number;
  type: 'solid' | 'gradient' | 'animated' | 'pattern' | 'particle';
  colors: string[];
  animation?: {
    type: 'wave' | 'pulse' | 'flow' | 'sparkle' | 'rain' | 'snow' | 'float' | 'rotate';
    speed: number;
    intensity: number;
  };
  pattern?: string;
  preview: string;
}

export const CHAT_BACKGROUNDS: ChatBackground[] = [
  // ==================== FREE BACKGROUNDS ====================
  {
    id: 'default_dark',
    name: 'Midnight',
    category: 'free',
    description: 'Clean dark background',
    coinPrice: 0,
    type: 'solid',
    colors: ['#0f0f17'],
    preview: 'bg-dark-950',
  },
  {
    id: 'subtle_gradient',
    name: 'Subtle Fade',
    category: 'free',
    description: 'Gentle dark gradient',
    coinPrice: 0,
    type: 'gradient',
    colors: ['#0f0f17', '#1a1a2e'],
    preview: 'bg-gradient-to-b from-dark-950 to-dark-900',
  },
  {
    id: 'ocean_depth',
    name: 'Ocean Depth',
    category: 'free',
    description: 'Deep blue atmosphere',
    coinPrice: 0,
    type: 'gradient',
    colors: ['#0a1628', '#152238'],
    preview: 'bg-gradient-to-br from-blue-950 to-slate-900',
  },
  {
    id: 'forest_night',
    name: 'Forest Night',
    category: 'free',
    description: 'Dark green ambiance',
    coinPrice: 0,
    type: 'gradient',
    colors: ['#0a1f0a', '#0f2f1a'],
    preview: 'bg-gradient-to-br from-green-950 to-emerald-950',
  },

  // ==================== PREMIUM BACKGROUNDS ====================
  {
    id: 'aurora_waves',
    name: 'Aurora Waves',
    category: 'premium',
    description: 'Flowing northern lights',
    coinPrice: 800,
    type: 'animated',
    colors: ['#00ff87', '#60efff', '#0061ff'],
    animation: { type: 'wave', speed: 8, intensity: 50 },
    preview: 'bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500',
  },
  {
    id: 'neon_city',
    name: 'Neon City',
    category: 'premium',
    description: 'Cyberpunk cityscape vibes',
    coinPrice: 900,
    type: 'animated',
    colors: ['#ff00ff', '#00ffff', '#ff0080'],
    animation: { type: 'pulse', speed: 4, intensity: 30 },
    preview: 'bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500',
  },
  {
    id: 'sunset_horizon',
    name: 'Sunset Horizon',
    category: 'premium',
    description: 'Warm sunset colors',
    coinPrice: 750,
    type: 'animated',
    colors: ['#ff6b35', '#f7c59f', '#2e294e'],
    animation: { type: 'flow', speed: 12, intensity: 40 },
    preview: 'bg-gradient-to-b from-orange-500 via-amber-300 to-purple-900',
  },
  {
    id: 'starfield',
    name: 'Starfield',
    category: 'premium',
    description: 'Twinkling star particles',
    coinPrice: 1000,
    type: 'particle',
    colors: ['#ffffff', '#ffd700', '#87ceeb'],
    animation: { type: 'sparkle', speed: 3, intensity: 60 },
    preview: 'bg-dark-950',
  },
  {
    id: 'matrix_rain',
    name: 'Digital Rain',
    category: 'premium',
    description: 'Matrix-style code rain',
    coinPrice: 1100,
    type: 'animated',
    colors: ['#00ff00', '#003300'],
    animation: { type: 'rain', speed: 2, intensity: 70 },
    preview: 'bg-black',
  },
  {
    id: 'cosmic_dust',
    name: 'Cosmic Dust',
    category: 'premium',
    description: 'Floating space particles',
    coinPrice: 950,
    type: 'particle',
    colors: ['#8b5cf6', '#ec4899', '#3b82f6'],
    animation: { type: 'float', speed: 15, intensity: 40 },
    preview: 'bg-gradient-to-br from-purple-900 to-blue-900',
  },
  {
    id: 'lava_flow',
    name: 'Lava Flow',
    category: 'premium',
    description: 'Molten lava animation',
    coinPrice: 1200,
    type: 'animated',
    colors: ['#ff4400', '#ff8800', '#ffcc00'],
    animation: { type: 'flow', speed: 6, intensity: 80 },
    preview: 'bg-gradient-to-b from-red-600 via-orange-500 to-yellow-500',
  },
  {
    id: 'ocean_waves',
    name: 'Ocean Waves',
    category: 'premium',
    description: 'Calming wave motion',
    coinPrice: 850,
    type: 'animated',
    colors: ['#0077b6', '#00b4d8', '#90e0ef'],
    animation: { type: 'wave', speed: 10, intensity: 50 },
    preview: 'bg-gradient-to-b from-blue-600 via-cyan-500 to-sky-300',
  },
  {
    id: 'nebula_cloud',
    name: 'Nebula Cloud',
    category: 'premium',
    description: 'Swirling cosmic clouds',
    coinPrice: 1300,
    type: 'animated',
    colors: ['#4a0e4e', '#81007f', '#2d00f7'],
    animation: { type: 'rotate', speed: 30, intensity: 40 },
    preview: 'bg-gradient-to-br from-purple-900 via-pink-800 to-indigo-900',
  },

  // ==================== LEGENDARY BACKGROUNDS ====================
  {
    id: 'black_hole',
    name: 'Event Horizon',
    category: 'legendary',
    description: 'Gravitational distortion effect',
    coinPrice: 3000,
    type: 'animated',
    colors: ['#000000', '#1a0033', '#330066'],
    animation: { type: 'rotate', speed: 20, intensity: 100 },
    preview: 'bg-black',
  },
  {
    id: 'quantum_realm',
    name: 'Quantum Realm',
    category: 'legendary',
    description: 'Reality-bending visuals',
    coinPrice: 3500,
    type: 'particle',
    colors: ['#00ff00', '#ff00ff', '#00ffff', '#ffff00'],
    animation: { type: 'sparkle', speed: 1, intensity: 100 },
    preview: 'bg-dark-950',
  },
  {
    id: 'supernova',
    name: 'Supernova',
    category: 'legendary',
    description: 'Explosive stellar animation',
    coinPrice: 4000,
    type: 'animated',
    colors: ['#ffffff', '#ffff00', '#ff8800', '#ff0000', '#ff00ff'],
    animation: { type: 'pulse', speed: 2, intensity: 100 },
    preview: 'bg-gradient-radial from-white via-yellow-500 to-red-600',
  },
  {
    id: 'void_walker',
    name: 'Void Walker',
    category: 'legendary',
    description: 'Dark matter emanation',
    coinPrice: 4500,
    type: 'animated',
    colors: ['#0d0015', '#1a0033', '#000000'],
    animation: { type: 'flow', speed: 8, intensity: 90 },
    preview: 'bg-black',
  },
  {
    id: 'celestial_palace',
    name: 'Celestial Palace',
    category: 'legendary',
    description: 'Divine heavenly light',
    coinPrice: 5000,
    type: 'animated',
    colors: ['#ffd700', '#ffffff', '#87ceeb'],
    animation: { type: 'sparkle', speed: 4, intensity: 80 },
    preview: 'bg-gradient-to-b from-amber-200 via-white to-sky-200',
  },

  // ==================== SEASONAL BACKGROUNDS ====================
  {
    id: 'winter_snow',
    name: 'Winter Wonderland',
    category: 'seasonal',
    description: 'Gentle snowfall',
    coinPrice: 500,
    type: 'particle',
    colors: ['#ffffff', '#e0f0ff', '#b0d0ff'],
    animation: { type: 'snow', speed: 5, intensity: 60 },
    preview: 'bg-gradient-to-b from-slate-800 to-slate-900',
  },
  {
    id: 'autumn_leaves',
    name: 'Autumn Leaves',
    category: 'seasonal',
    description: 'Falling autumn foliage',
    coinPrice: 500,
    type: 'particle',
    colors: ['#ff6b35', '#f7931e', '#8b4513', '#228b22'],
    animation: { type: 'float', speed: 8, intensity: 50 },
    preview: 'bg-gradient-to-b from-orange-900 to-amber-950',
  },
  {
    id: 'spring_blossoms',
    name: 'Cherry Blossoms',
    category: 'seasonal',
    description: 'Floating sakura petals',
    coinPrice: 500,
    type: 'particle',
    colors: ['#ffb7c5', '#ffc0cb', '#ff69b4'],
    animation: { type: 'float', speed: 10, intensity: 40 },
    preview: 'bg-gradient-to-b from-pink-200 to-rose-300',
  },
  {
    id: 'summer_sunset',
    name: 'Summer Sunset',
    category: 'seasonal',
    description: 'Warm summer evening',
    coinPrice: 500,
    type: 'animated',
    colors: ['#ff7e5f', '#feb47b', '#ffedbc'],
    animation: { type: 'flow', speed: 15, intensity: 30 },
    preview: 'bg-gradient-to-b from-orange-400 via-amber-300 to-yellow-100',
  },
  {
    id: 'halloween_spooky',
    name: 'Haunted Night',
    category: 'seasonal',
    description: 'Spooky Halloween vibes',
    coinPrice: 600,
    type: 'particle',
    colors: ['#ff6600', '#8b00ff', '#000000'],
    animation: { type: 'float', speed: 6, intensity: 50 },
    preview: 'bg-gradient-to-b from-orange-600 via-purple-900 to-black',
  },
  {
    id: 'holiday_lights',
    name: 'Holiday Lights',
    category: 'seasonal',
    description: 'Twinkling festive lights',
    coinPrice: 600,
    type: 'particle',
    colors: ['#ff0000', '#00ff00', '#ffd700', '#ffffff'],
    animation: { type: 'sparkle', speed: 2, intensity: 70 },
    preview: 'bg-gradient-to-b from-red-900 via-green-900 to-dark-950',
  },
];

/**
 * Get backgrounds by category
 */
export function getBackgroundsByCategory(category: BackgroundCategory): ChatBackground[] {
  return CHAT_BACKGROUNDS.filter(bg => bg.category === category);
}

/**
 * Get background by ID
 */
export function getBackgroundById(id: string): ChatBackground | undefined {
  return CHAT_BACKGROUNDS.find(bg => bg.id === id);
}

/**
 * Get all free backgrounds
 */
export function getFreeBackgrounds(): ChatBackground[] {
  return CHAT_BACKGROUNDS.filter(bg => bg.coinPrice === 0);
}
