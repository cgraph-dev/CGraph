/**
 * Profile Themes Data
 * 
 * 18+ animated profile themes organized by category.
 * Each theme has background gradients, particle effects, overlays, and tier badges.
 */

export type ProfileThemeCategory = '8bit' | 'japanese' | 'anime' | 'cyberpunk' | 'gothic' | 'kawaii';
export type ProfileThemeTier = 'free' | 'premium' | 'elite';
export type ParticleType = 
  | 'none' | 'pixel' | 'petal' | 'energy' | 'neon' | 'smoke' 
  | 'stars' | 'hearts' | 'sparkles' | 'snow' | 'rain' | 'bubbles'
  | 'fire' | 'lightning' | 'leaves' | 'confetti';
export type OverlayType = 'none' | 'scanlines' | 'holographic' | 'noise' | 'vignette' | 'grid' | 'rays';

export interface ProfileThemeConfig {
  id: string;
  name: string;
  category: ProfileThemeCategory;
  tier: ProfileThemeTier;
  description: string;
  
  // Background
  backgroundGradient: string[];
  backgroundAnimation?: 'none' | 'shift' | 'pulse' | 'wave' | 'rotate';
  backgroundAnimationDuration?: number;
  
  // Particles
  particleType: ParticleType;
  particleCount?: number;
  particleColors?: string[];
  particleSpeed?: number;
  
  // Overlay effects
  overlayType: OverlayType;
  overlayOpacity?: number;
  
  // Glow & Lighting
  glowEnabled: boolean;
  glowColor?: string;
  glowIntensity?: number;
  
  // Accent colors for UI elements
  accentPrimary: string;
  accentSecondary: string;
  textColor: string;
  
  // Unlock info
  unlocked: boolean;
  unlockRequirement?: string;
  unlockLevel?: number;
  
  // Preview
  previewImage?: string;
}

export interface ProfileThemeCategoryInfo {
  id: ProfileThemeCategory;
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  themeCount: number;
}

// Theme Categories
export const PROFILE_THEME_CATEGORIES: ProfileThemeCategoryInfo[] = [
  {
    id: '8bit',
    name: '8-Bit',
    description: 'Retro gaming vibes',
    icon: '🎮',
    accentColor: '#39ff14',
    themeCount: 3,
  },
  {
    id: 'japanese',
    name: 'Japanese',
    description: 'Elegant traditions',
    icon: '🌸',
    accentColor: '#ff6b9d',
    themeCount: 3,
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Epic power moments',
    icon: '⚡',
    accentColor: '#ffcc00',
    themeCount: 3,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon dystopia',
    icon: '🤖',
    accentColor: '#00ffff',
    themeCount: 3,
  },
  {
    id: 'gothic',
    name: 'Gothic',
    description: 'Dark elegance',
    icon: '🦇',
    accentColor: '#8b00ff',
    themeCount: 3,
  },
  {
    id: 'kawaii',
    name: 'Kawaii',
    description: 'Cute overload',
    icon: '🌈',
    accentColor: '#ff69b4',
    themeCount: 3,
  },
];

// 8-Bit Themes
const THEMES_8BIT: ProfileThemeConfig[] = [
  {
    id: '8bit-arcade',
    name: 'Arcade Classic',
    category: '8bit',
    tier: 'free',
    description: 'Classic arcade cabinet vibes with pixel art aesthetics',
    backgroundGradient: ['#0a0a0a', '#1a1a2e', '#16213e'],
    backgroundAnimation: 'none',
    particleType: 'pixel',
    particleCount: 20,
    particleColors: ['#39ff14', '#00ffff', '#ff00ff'],
    overlayType: 'scanlines',
    overlayOpacity: 0.1,
    glowEnabled: true,
    glowColor: '#39ff14',
    glowIntensity: 0.5,
    accentPrimary: '#39ff14',
    accentSecondary: '#00ffff',
    textColor: '#ffffff',
    unlocked: true,
  },
  {
    id: '8bit-neon',
    name: 'Neon Nights',
    category: '8bit',
    tier: 'premium',
    description: 'Synthwave sunset with neon grid lines',
    backgroundGradient: ['#0f0c29', '#302b63', '#24243e'],
    backgroundAnimation: 'shift',
    backgroundAnimationDuration: 10,
    particleType: 'neon',
    particleCount: 15,
    particleColors: ['#ff00ff', '#00ffff', '#ffff00'],
    overlayType: 'grid',
    overlayOpacity: 0.15,
    glowEnabled: true,
    glowColor: '#ff00ff',
    glowIntensity: 0.8,
    accentPrimary: '#ff00ff',
    accentSecondary: '#00ffff',
    textColor: '#ffffff',
    unlocked: false,
    unlockRequirement: 'Reach Level 15',
    unlockLevel: 15,
  },
  {
    id: '8bit-dreams',
    name: 'Pixel Dreams',
    category: '8bit',
    tier: 'elite',
    description: 'Dreamy vaporwave pixel paradise',
    backgroundGradient: ['#667eea', '#764ba2', '#f093fb'],
    backgroundAnimation: 'wave',
    backgroundAnimationDuration: 8,
    particleType: 'sparkles',
    particleCount: 30,
    particleColors: ['#ffffff', '#ffd700', '#ff69b4'],
    overlayType: 'holographic',
    overlayOpacity: 0.2,
    glowEnabled: true,
    glowColor: '#f093fb',
    glowIntensity: 1.0,
    accentPrimary: '#f093fb',
    accentSecondary: '#667eea',
    textColor: '#ffffff',
    unlocked: false,
    unlockRequirement: 'Collect 50 retro achievements',
  },
];

// Japanese Themes
const THEMES_JAPANESE: ProfileThemeConfig[] = [
  {
    id: 'jp-zen',
    name: 'Zen Garden',
    category: 'japanese',
    tier: 'free',
    description: 'Tranquil minimalist garden with sand patterns',
    backgroundGradient: ['#1a1a2e', '#16213e', '#0f3460'],
    backgroundAnimation: 'none',
    particleType: 'leaves',
    particleCount: 8,
    particleColors: ['#228b22', '#90ee90'],
    overlayType: 'none',
    glowEnabled: false,
    accentPrimary: '#90ee90',
    accentSecondary: '#228b22',
    textColor: '#f5f5dc',
    unlocked: true,
  },
  {
    id: 'jp-sakura',
    name: 'Sakura Bloom',
    category: 'japanese',
    tier: 'premium',
    description: 'Cherry blossoms dancing in spring breeze',
    backgroundGradient: ['#2c1a4d', '#4a2c7a', '#6b3fa0'],
    backgroundAnimation: 'shift',
    backgroundAnimationDuration: 15,
    particleType: 'petal',
    particleCount: 25,
    particleColors: ['#ffb7c5', '#ff69b4', '#ffffff'],
    particleSpeed: 0.5,
    overlayType: 'none',
    glowEnabled: true,
    glowColor: '#ff69b4',
    glowIntensity: 0.6,
    accentPrimary: '#ff69b4',
    accentSecondary: '#ffb7c5',
    textColor: '#ffffff',
    unlocked: false,
    unlockRequirement: 'Reach Level 20',
    unlockLevel: 20,
  },
  {
    id: 'jp-wave',
    name: 'Great Wave',
    category: 'japanese',
    tier: 'elite',
    description: 'Hokusai-inspired crashing ocean waves',
    backgroundGradient: ['#0077be', '#1e90ff', '#87ceeb'],
    backgroundAnimation: 'wave',
    backgroundAnimationDuration: 6,
    particleType: 'bubbles',
    particleCount: 20,
    particleColors: ['#ffffff', '#87ceeb'],
    overlayType: 'none',
    glowEnabled: true,
    glowColor: '#00bfff',
    glowIntensity: 0.7,
    accentPrimary: '#00bfff',
    accentSecondary: '#1e90ff',
    textColor: '#ffffff',
    unlocked: false,
    unlockRequirement: 'Master the tides',
  },
];

// Anime Themes
const THEMES_ANIME: ProfileThemeConfig[] = [
  {
    id: 'anime-power',
    name: 'Power Up',
    category: 'anime',
    tier: 'free',
    description: 'Basic power aura for aspiring heroes',
    backgroundGradient: ['#1a1a2e', '#2d2d44', '#16213e'],
    backgroundAnimation: 'pulse',
    backgroundAnimationDuration: 3,
    particleType: 'energy',
    particleCount: 15,
    particleColors: ['#ffd700', '#ff8c00'],
    overlayType: 'none',
    glowEnabled: true,
    glowColor: '#ffd700',
    glowIntensity: 0.5,
    accentPrimary: '#ffd700',
    accentSecondary: '#ff8c00',
    textColor: '#ffffff',
    unlocked: true,
  },
  {
    id: 'anime-mystic',
    name: 'Mystic Arts',
    category: 'anime',
    tier: 'premium',
    description: 'Ancient magical energy flowing around you',
    backgroundGradient: ['#1a0a2e', '#2e1a4a', '#4a2c7a'],
    backgroundAnimation: 'rotate',
    backgroundAnimationDuration: 20,
    particleType: 'sparkles',
    particleCount: 25,
    particleColors: ['#9b30ff', '#ff69b4', '#00ffff'],
    overlayType: 'holographic',
    overlayOpacity: 0.1,
    glowEnabled: true,
    glowColor: '#9b30ff',
    glowIntensity: 0.8,
    accentPrimary: '#9b30ff',
    accentSecondary: '#ff69b4',
    textColor: '#ffffff',
    unlocked: false,
    unlockRequirement: 'Reach Level 25',
    unlockLevel: 25,
  },
  {
    id: 'anime-hero',
    name: 'Ultimate Hero',
    category: 'anime',
    tier: 'elite',
    description: 'Maximum power level achieved!',
    backgroundGradient: ['#ff4500', '#ff8c00', '#ffd700'],
    backgroundAnimation: 'pulse',
    backgroundAnimationDuration: 2,
    particleType: 'fire',
    particleCount: 40,
    particleColors: ['#ff4500', '#ffd700', '#ffffff'],
    particleSpeed: 1.5,
    overlayType: 'rays',
    overlayOpacity: 0.2,
    glowEnabled: true,
    glowColor: '#ffd700',
    glowIntensity: 1.2,
    accentPrimary: '#ffd700',
    accentSecondary: '#ff4500',
    textColor: '#ffffff',
    unlocked: false,
    unlockRequirement: 'Break your limits',
  },
];

// Cyberpunk Themes
const THEMES_CYBERPUNK: ProfileThemeConfig[] = [
  {
    id: 'cyber-city',
    name: 'Night City',
    category: 'cyberpunk',
    tier: 'free',
    description: 'Neon-lit streets of the digital metropolis',
    backgroundGradient: ['#0a0a0a', '#1a1a2e', '#0f0f23'],
    backgroundAnimation: 'none',
    particleType: 'neon',
    particleCount: 12,
    particleColors: ['#00ffff', '#ff00ff'],
    overlayType: 'scanlines',
    overlayOpacity: 0.08,
    glowEnabled: true,
    glowColor: '#00ffff',
    glowIntensity: 0.5,
    accentPrimary: '#00ffff',
    accentSecondary: '#ff00ff',
    textColor: '#ffffff',
    unlocked: true,
  },
  {
    id: 'cyber-matrix',
    name: 'The Matrix',
    category: 'cyberpunk',
    tier: 'premium',
    description: 'Digital rain cascading through reality',
    backgroundGradient: ['#000000', '#001a00', '#003300'],
    backgroundAnimation: 'shift',
    backgroundAnimationDuration: 5,
    particleType: 'rain',
    particleCount: 50,
    particleColors: ['#00ff00', '#39ff14'],
    particleSpeed: 2,
    overlayType: 'scanlines',
    overlayOpacity: 0.15,
    glowEnabled: true,
    glowColor: '#00ff00',
    glowIntensity: 0.7,
    accentPrimary: '#00ff00',
    accentSecondary: '#39ff14',
    textColor: '#00ff00',
    unlocked: false,
    unlockRequirement: 'Reach Level 20',
    unlockLevel: 20,
  },
  {
    id: 'cyber-pulse',
    name: 'Neural Pulse',
    category: 'cyberpunk',
    tier: 'elite',
    description: 'Connected to the global network consciousness',
    backgroundGradient: ['#0f0f1a', '#1a1a3e', '#2a2a5e'],
    backgroundAnimation: 'pulse',
    backgroundAnimationDuration: 3,
    particleType: 'lightning',
    particleCount: 8,
    particleColors: ['#00ffff', '#0080ff', '#ffffff'],
    overlayType: 'grid',
    overlayOpacity: 0.1,
    glowEnabled: true,
    glowColor: '#00ffff',
    glowIntensity: 1.0,
    accentPrimary: '#00ffff',
    accentSecondary: '#0080ff',
    textColor: '#ffffff',
    unlocked: false,
    unlockRequirement: 'Full neural integration',
  },
];

// Gothic Themes
const THEMES_GOTHIC: ProfileThemeConfig[] = [
  {
    id: 'gothic-shadow',
    name: 'Shadow Realm',
    category: 'gothic',
    tier: 'free',
    description: 'Dark mysteries await in the shadows',
    backgroundGradient: ['#0a0a0a', '#1a1a1a', '#0d0d0d'],
    backgroundAnimation: 'none',
    particleType: 'smoke',
    particleCount: 10,
    particleColors: ['#333333', '#666666'],
    overlayType: 'vignette',
    overlayOpacity: 0.3,
    glowEnabled: false,
    accentPrimary: '#8b0000',
    accentSecondary: '#4b0082',
    textColor: '#c0c0c0',
    unlocked: true,
  },
  {
    id: 'gothic-blood',
    name: 'Blood Moon',
    category: 'gothic',
    tier: 'premium',
    description: 'Crimson night under the blood moon',
    backgroundGradient: ['#1a0a0a', '#2e1a1a', '#4a0a0a'],
    backgroundAnimation: 'pulse',
    backgroundAnimationDuration: 5,
    particleType: 'sparkles',
    particleCount: 15,
    particleColors: ['#8b0000', '#dc143c', '#ff4500'],
    overlayType: 'vignette',
    overlayOpacity: 0.4,
    glowEnabled: true,
    glowColor: '#8b0000',
    glowIntensity: 0.6,
    accentPrimary: '#dc143c',
    accentSecondary: '#8b0000',
    textColor: '#ffffff',
    unlocked: false,
    unlockRequirement: 'Reach Level 20',
    unlockLevel: 20,
  },
  {
    id: 'gothic-void',
    name: 'Abyssal Void',
    category: 'gothic',
    tier: 'elite',
    description: 'Stare into the abyss, and it stares back',
    backgroundGradient: ['#000000', '#0a0a1a', '#1a0a2e'],
    backgroundAnimation: 'shift',
    backgroundAnimationDuration: 8,
    particleType: 'smoke',
    particleCount: 20,
    particleColors: ['#4b0082', '#8b008b', '#000000'],
    overlayType: 'noise',
    overlayOpacity: 0.05,
    glowEnabled: true,
    glowColor: '#8b00ff',
    glowIntensity: 0.8,
    accentPrimary: '#8b00ff',
    accentSecondary: '#4b0082',
    textColor: '#e0e0e0',
    unlocked: false,
    unlockRequirement: 'Embrace the darkness',
  },
];

// Kawaii Themes
const THEMES_KAWAII: ProfileThemeConfig[] = [
  {
    id: 'kawaii-pastel',
    name: 'Pastel Dream',
    category: 'kawaii',
    tier: 'free',
    description: 'Soft pastel colors for a gentle aesthetic',
    backgroundGradient: ['#ffe4e6', '#fce7f3', '#f3e8ff'],
    backgroundAnimation: 'none',
    particleType: 'hearts',
    particleCount: 12,
    particleColors: ['#ff69b4', '#ffb6c1', '#ff1493'],
    overlayType: 'none',
    glowEnabled: true,
    glowColor: '#ff69b4',
    glowIntensity: 0.4,
    accentPrimary: '#ff69b4',
    accentSecondary: '#ffb6c1',
    textColor: '#4a4a4a',
    unlocked: true,
  },
  {
    id: 'kawaii-candy',
    name: 'Candy Pop',
    category: 'kawaii',
    tier: 'premium',
    description: 'Sweet and colorful candy explosion',
    backgroundGradient: ['#ff9a9e', '#fecfef', '#fecfef', '#a18cd1'],
    backgroundAnimation: 'shift',
    backgroundAnimationDuration: 8,
    particleType: 'confetti',
    particleCount: 25,
    particleColors: ['#ff69b4', '#ffff00', '#00ffff', '#ff00ff'],
    overlayType: 'none',
    glowEnabled: true,
    glowColor: '#ff69b4',
    glowIntensity: 0.6,
    accentPrimary: '#ff69b4',
    accentSecondary: '#a18cd1',
    textColor: '#ffffff',
    unlocked: false,
    unlockRequirement: 'Reach Level 15',
    unlockLevel: 15,
  },
  {
    id: 'kawaii-rainbow',
    name: 'Rainbow Magic',
    category: 'kawaii',
    tier: 'elite',
    description: 'All the colors of happiness combined',
    backgroundGradient: ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ff9ff3', '#a29bfe'],
    backgroundAnimation: 'rotate',
    backgroundAnimationDuration: 15,
    particleType: 'stars',
    particleCount: 35,
    particleColors: ['#ffffff', '#ffd700', '#ff69b4'],
    overlayType: 'holographic',
    overlayOpacity: 0.15,
    glowEnabled: true,
    glowColor: '#ff69b4',
    glowIntensity: 1.0,
    accentPrimary: '#ff69b4',
    accentSecondary: '#a29bfe',
    textColor: '#ffffff',
    unlocked: false,
    unlockRequirement: 'Spread maximum joy',
  },
];

// Combine all themes
export const ALL_PROFILE_THEMES: ProfileThemeConfig[] = [
  ...THEMES_8BIT,
  ...THEMES_JAPANESE,
  ...THEMES_ANIME,
  ...THEMES_CYBERPUNK,
  ...THEMES_GOTHIC,
  ...THEMES_KAWAII,
];

// Get themes by category
export const getThemesByCategory = (category: ProfileThemeCategory): ProfileThemeConfig[] => {
  return ALL_PROFILE_THEMES.filter(theme => theme.category === category);
};

// Get theme by ID
export const getThemeById = (id: string): ProfileThemeConfig | undefined => {
  return ALL_PROFILE_THEMES.find(theme => theme.id === id);
};

// Tier badge colors
export const TIER_COLORS: Record<ProfileThemeTier, { bg: string; text: string; border: string; glow: string }> = {
  free: { bg: 'bg-gray-600/80', text: 'text-gray-200', border: 'border-gray-500', glow: 'rgba(107,114,128,0.3)' },
  premium: { bg: 'bg-gradient-to-r from-purple-600 to-pink-500', text: 'text-white', border: 'border-purple-400', glow: 'rgba(139,92,246,0.5)' },
  elite: { bg: 'bg-gradient-to-r from-yellow-500 to-orange-500', text: 'text-white', border: 'border-yellow-400', glow: 'rgba(234,179,8,0.6)' },
};

// Animation keyframes for profile theme backgrounds
export const BACKGROUND_ANIMATIONS = {
  none: {},
  shift: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
  },
  pulse: {
    opacity: [0.8, 1, 0.8],
    scale: [1, 1.02, 1],
  },
  wave: {
    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
  },
  rotate: {
    rotate: [0, 360],
  },
};

// Particle animation configs
export const PARTICLE_CONFIGS: Record<ParticleType, {
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'custom';
  size: { min: number; max: number };
  velocity: { x: { min: number; max: number }; y: { min: number; max: number } };
  opacity: { min: number; max: number };
  rotation?: boolean;
  trail?: boolean;
}> = {
  none: { shape: 'circle', size: { min: 0, max: 0 }, velocity: { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }, opacity: { min: 0, max: 0 } },
  pixel: { shape: 'square', size: { min: 2, max: 4 }, velocity: { x: { min: -0.5, max: 0.5 }, y: { min: -1, max: -0.5 } }, opacity: { min: 0.5, max: 1 } },
  petal: { shape: 'custom', size: { min: 8, max: 16 }, velocity: { x: { min: -1, max: 1 }, y: { min: 0.5, max: 1.5 } }, opacity: { min: 0.6, max: 1 }, rotation: true },
  energy: { shape: 'circle', size: { min: 2, max: 6 }, velocity: { x: { min: -2, max: 2 }, y: { min: -3, max: -1 } }, opacity: { min: 0.3, max: 0.8 }, trail: true },
  neon: { shape: 'circle', size: { min: 1, max: 3 }, velocity: { x: { min: -0.3, max: 0.3 }, y: { min: -0.5, max: 0.5 } }, opacity: { min: 0.5, max: 1 } },
  smoke: { shape: 'circle', size: { min: 20, max: 50 }, velocity: { x: { min: -0.2, max: 0.2 }, y: { min: -0.5, max: -0.1 } }, opacity: { min: 0.1, max: 0.3 } },
  stars: { shape: 'star', size: { min: 3, max: 8 }, velocity: { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }, opacity: { min: 0.3, max: 1 }, rotation: true },
  hearts: { shape: 'heart', size: { min: 8, max: 16 }, velocity: { x: { min: -0.5, max: 0.5 }, y: { min: -1, max: -0.3 } }, opacity: { min: 0.5, max: 1 } },
  sparkles: { shape: 'star', size: { min: 2, max: 6 }, velocity: { x: { min: -1, max: 1 }, y: { min: -1, max: 1 } }, opacity: { min: 0.4, max: 1 } },
  snow: { shape: 'circle', size: { min: 2, max: 6 }, velocity: { x: { min: -0.3, max: 0.3 }, y: { min: 0.5, max: 1.5 } }, opacity: { min: 0.5, max: 1 } },
  rain: { shape: 'custom', size: { min: 1, max: 2 }, velocity: { x: { min: -0.1, max: 0.1 }, y: { min: 5, max: 10 } }, opacity: { min: 0.3, max: 0.6 }, trail: true },
  bubbles: { shape: 'circle', size: { min: 4, max: 12 }, velocity: { x: { min: -0.3, max: 0.3 }, y: { min: -1, max: -0.3 } }, opacity: { min: 0.2, max: 0.5 } },
  fire: { shape: 'circle', size: { min: 3, max: 10 }, velocity: { x: { min: -0.5, max: 0.5 }, y: { min: -3, max: -1 } }, opacity: { min: 0.5, max: 1 }, trail: true },
  lightning: { shape: 'custom', size: { min: 1, max: 2 }, velocity: { x: { min: -5, max: 5 }, y: { min: -5, max: 5 } }, opacity: { min: 0.8, max: 1 }, trail: true },
  leaves: { shape: 'custom', size: { min: 8, max: 16 }, velocity: { x: { min: -1, max: 1 }, y: { min: 0.3, max: 1 } }, opacity: { min: 0.6, max: 1 }, rotation: true },
  confetti: { shape: 'square', size: { min: 4, max: 8 }, velocity: { x: { min: -2, max: 2 }, y: { min: 1, max: 3 } }, opacity: { min: 0.7, max: 1 }, rotation: true },
};
