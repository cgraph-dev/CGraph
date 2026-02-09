/**
 * useCustomizationApplication Hook
 *
 * Applies user customizations to the UI in real-time.
 * Listens to customizationStore and updates CSS variables, body classes,
 * and DOM elements to reflect selected themes, effects, and animations.
 *
 * @version 1.0.0
 * @since 2026-01-19
 */

import { useEffect } from 'react';
import { useCustomizationStore } from '@/modules/settings/store/customization';

/**
 * Profile Theme Color Mappings
 * Maps theme IDs to CSS variable color schemes
 */
const PROFILE_THEME_COLORS: Record<
  string,
  {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  }
> = {
  'classic-purple': {
    primary: '#9333ea',
    secondary: '#a855f7',
    accent: '#c084fc',
    background: '#1e1b2e',
    text: '#ffffff',
  },
  'neon-blue': {
    primary: '#0ea5e9',
    secondary: '#38bdf8',
    accent: '#7dd3fc',
    background: '#0c1429',
    text: '#e0f2fe',
  },
  cyberpunk: {
    primary: '#ec4899',
    secondary: '#f43f5e',
    accent: '#fbbf24',
    background: '#18181b',
    text: '#fef3c7',
  },
  'forest-green': {
    primary: '#10b981',
    secondary: '#34d399',
    accent: '#6ee7b7',
    background: '#064e3b',
    text: '#d1fae5',
  },
  'sunset-orange': {
    primary: '#f97316',
    secondary: '#fb923c',
    accent: '#fdba74',
    background: '#431407',
    text: '#ffedd5',
  },
  'royal-gold': {
    primary: '#eab308',
    secondary: '#fbbf24',
    accent: '#fcd34d',
    background: '#422006',
    text: '#fef3c7',
  },
};

/**
 * Animation Speed Mappings
 */
const ANIMATION_SPEEDS: Record<string, string> = {
  slow: '1.5',
  normal: '1',
  fast: '0.5',
};

/**
 * Replaces body classes matching a prefix with a new class
 */
function updateBodyClass(prefix: string, newValue: string | null): void {
  document.body.classList.forEach((className) => {
    if (className.startsWith(prefix)) {
      document.body.classList.remove(className);
    }
  });
  if (newValue) {
    document.body.classList.add(`${prefix}${newValue}`);
  }
}

/**
 * Hook to apply user customizations to the UI via CSS variables and body classes.
 * Uses individual Zustand selectors to prevent infinite re-render loops.
 */
export function useCustomizationApplication(): void {
  // Individual selectors ensure stable references (object selectors create new refs each render)
  const profileTheme = useCustomizationStore((s) => s.profileTheme);
  const selectedProfileThemeId = useCustomizationStore((s) => s.selectedProfileThemeId);
  const chatTheme = useCustomizationStore((s) => s.chatTheme);
  const particleEffect = useCustomizationStore((s) => s.particleEffect);
  const backgroundEffect = useCustomizationStore((s) => s.backgroundEffect);
  const animationSpeed = useCustomizationStore((s) => s.animationSpeed);

  const effectiveProfileTheme = profileTheme ?? selectedProfileThemeId;

  useEffect(() => {
    const root = document.documentElement;

    // Apply profile theme CSS variables
    const colors = effectiveProfileTheme ? PROFILE_THEME_COLORS[effectiveProfileTheme] : null;
    if (colors) {
      root.style.setProperty('--profile-primary', colors.primary);
      root.style.setProperty('--profile-secondary', colors.secondary);
      root.style.setProperty('--profile-accent', colors.accent);
      root.style.setProperty('--profile-background', colors.background);
      root.style.setProperty('--profile-text', colors.text);
    }

    // Apply animation speed multiplier
    const speedMultiplier = ANIMATION_SPEEDS[animationSpeed] ?? '1';
    root.style.setProperty('--animation-speed', speedMultiplier);

    // Apply body classes for effects and themes
    updateBodyClass('particle-effect-', particleEffect !== 'none' ? particleEffect : null);
    updateBodyClass('bg-effect-', backgroundEffect !== 'solid' ? backgroundEffect : null);
    updateBodyClass('chat-theme-', chatTheme);
  }, [effectiveProfileTheme, chatTheme, particleEffect, backgroundEffect, animationSpeed]);
}

/**
 * Get avatar border CSS class and styles
 */
export function getAvatarBorderStyle(borderId: string | null): {
  className: string;
  style?: React.CSSProperties;
} {
  if (!borderId || borderId === 'none') {
    return { className: '' };
  }

  // Map border IDs to CSS classes
  const borderClassMap: Record<string, string> = {
    static: 'avatar-border-static',
    'simple-glow': 'avatar-border-glow',
    'gentle-pulse': 'avatar-border-pulse',
    'rotating-ring': 'avatar-border-rotating',
    'dual-ring': 'avatar-border-dual-ring',
    'rainbow-spin': 'avatar-border-rainbow',
    'particle-orbit': 'avatar-border-particles',
    'electric-arc': 'avatar-border-electric',
    'flame-ring': 'avatar-border-flame',
    'ice-crystal': 'avatar-border-ice',
    'toxic-glow': 'avatar-border-toxic',
    'holy-light': 'avatar-border-holy',
    'shadow-wisp': 'avatar-border-shadow',
    'cosmic-drift': 'avatar-border-cosmic',
  };

  return {
    className: borderClassMap[borderId] || '',
  };
}

/**
 * Get message bubble CSS class based on bubble style
 */
export function getMessageBubbleClass(bubbleStyle: string): string {
  const bubbleClassMap: Record<string, string> = {
    default: 'bubble-default',
    rounded: 'bubble-rounded',
    sharp: 'bubble-sharp',
    cloud: 'bubble-cloud',
    modern: 'bubble-modern',
    minimal: 'bubble-minimal',
    glass: 'bubble-glass',
    neon: 'bubble-neon',
    retro: 'bubble-retro',
    '3d': 'bubble-3d',
    outline: 'bubble-outline',
  };

  return bubbleClassMap[bubbleStyle] || 'bubble-default';
}

/**
 * Get message effect class
 */
export function getMessageEffectClass(messageEffect: string): string {
  if (!messageEffect || messageEffect === 'none') return '';

  const effectClassMap: Record<string, string> = {
    slide: 'message-effect-slide',
    fade: 'message-effect-fade',
    bounce: 'message-effect-bounce',
    typewriter: 'message-effect-typewriter',
    glitch: 'message-effect-glitch',
    sparkle: 'message-effect-sparkle',
    confetti: 'message-effect-confetti',
    ripple: 'message-effect-ripple',
  };

  return effectClassMap[messageEffect] || '';
}

/**
 * Get reaction style class
 */
export function getReactionStyleClass(reactionStyle: string): string {
  const reactionClassMap: Record<string, string> = {
    bounce: 'reaction-bounce',
    pop: 'reaction-pop',
    float: 'reaction-float',
    spin: 'reaction-spin',
    pulse: 'reaction-pulse',
    shake: 'reaction-shake',
    zoom: 'reaction-zoom',
  };

  return reactionClassMap[reactionStyle] || 'reaction-bounce';
}
