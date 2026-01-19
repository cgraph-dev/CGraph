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
import { useCustomizationStore } from '@/stores/customizationStore';
import { ThemeRegistry } from '@/themes/ThemeRegistry';

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
const ANIMATION_SPEEDS = {
  slow: '1.5',
  normal: '1',
  fast: '0.5',
};

/**
 * Hook to apply all customizations to the UI
 */
export function useCustomizationApplication() {
  const {
    profileTheme,
    chatTheme,
    forumTheme,
    appTheme,
    particleEffect,
    backgroundEffect,
    animationSpeed,
  } = useCustomizationStore();

  useEffect(() => {
    const root = document.documentElement;

    // Apply profile theme colors
    if (profileTheme && PROFILE_THEME_COLORS[profileTheme]) {
      const colors = PROFILE_THEME_COLORS[profileTheme];
      root.style.setProperty('--profile-primary', colors.primary);
      root.style.setProperty('--profile-secondary', colors.secondary);
      root.style.setProperty('--profile-accent', colors.accent);
      root.style.setProperty('--profile-background', colors.background);
      root.style.setProperty('--profile-text', colors.text);
    }

    // Apply app theme
    if (appTheme) {
      ThemeRegistry.applyTheme(appTheme === 'dark' ? 'default' : 'matrix');
    }

    // Apply animation speed
    const speedKey = animationSpeed as keyof typeof ANIMATION_SPEEDS;
    const speedMultiplier = ANIMATION_SPEEDS[speedKey] || '1';
    root.style.setProperty('--animation-speed', speedMultiplier);

    // Apply particle effect class
    document.body.classList.forEach((className) => {
      if (className.startsWith('particle-effect-')) {
        document.body.classList.remove(className);
      }
    });
    if (particleEffect && particleEffect !== 'none') {
      document.body.classList.add(`particle-effect-${particleEffect}`);
    }

    // Apply background effect class
    document.body.classList.forEach((className) => {
      if (className.startsWith('bg-effect-')) {
        document.body.classList.remove(className);
      }
    });
    if (backgroundEffect && backgroundEffect !== 'solid') {
      document.body.classList.add(`bg-effect-${backgroundEffect}`);
    }

    // Apply chat theme class
    document.body.classList.forEach((className) => {
      if (className.startsWith('chat-theme-')) {
        document.body.classList.remove(className);
      }
    });
    if (chatTheme) {
      document.body.classList.add(`chat-theme-${chatTheme}`);
    }

    // Apply forum theme class (if set)
    document.body.classList.forEach((className) => {
      if (className.startsWith('forum-theme-')) {
        document.body.classList.remove(className);
      }
    });
    if (forumTheme) {
      document.body.classList.add(`forum-theme-${forumTheme}`);
    }
  }, [
    profileTheme,
    chatTheme,
    forumTheme,
    appTheme,
    particleEffect,
    backgroundEffect,
    animationSpeed,
  ]);
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
