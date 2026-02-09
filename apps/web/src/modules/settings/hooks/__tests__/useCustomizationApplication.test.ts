import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// ── Hoisted mocks ────────────────────────────────────────────────────

const { mockState } = vi.hoisted(() => ({
  mockState: {
    profileTheme: null as string | null,
    selectedProfileThemeId: 'classic-purple',
    chatTheme: 'default',
    particleEffect: 'none',
    backgroundEffect: 'solid',
    animationSpeed: 'normal',
  },
}));

vi.mock('@/modules/settings/store/customization', () => ({
  useCustomizationStore: vi.fn((selector: (s: typeof mockState) => unknown) => selector(mockState)),
}));

import {
  useCustomizationApplication,
  getAvatarBorderStyle,
  getMessageBubbleClass,
  getMessageEffectClass,
  getReactionStyleClass,
} from '../useCustomizationApplication';

// ═══════════════════════════════════════════════════════════════════
// getAvatarBorderStyle — pure function
// ═══════════════════════════════════════════════════════════════════

describe('getAvatarBorderStyle', () => {
  it('returns empty className for null', () => {
    expect(getAvatarBorderStyle(null)).toEqual({ className: '' });
  });

  it('returns empty className for "none"', () => {
    expect(getAvatarBorderStyle('none')).toEqual({ className: '' });
  });

  it('returns correct class for static border', () => {
    expect(getAvatarBorderStyle('static').className).toBe('avatar-border-static');
  });

  it('returns correct class for simple-glow', () => {
    expect(getAvatarBorderStyle('simple-glow').className).toBe('avatar-border-glow');
  });

  it('returns correct class for gentle-pulse', () => {
    expect(getAvatarBorderStyle('gentle-pulse').className).toBe('avatar-border-pulse');
  });

  it('returns correct class for rotating-ring', () => {
    expect(getAvatarBorderStyle('rotating-ring').className).toBe('avatar-border-rotating');
  });

  it('returns correct class for dual-ring', () => {
    expect(getAvatarBorderStyle('dual-ring').className).toBe('avatar-border-dual-ring');
  });

  it('returns correct class for rainbow-spin', () => {
    expect(getAvatarBorderStyle('rainbow-spin').className).toBe('avatar-border-rainbow');
  });

  it('returns correct class for particle-orbit', () => {
    expect(getAvatarBorderStyle('particle-orbit').className).toBe('avatar-border-particles');
  });

  it('returns correct class for electric-arc', () => {
    expect(getAvatarBorderStyle('electric-arc').className).toBe('avatar-border-electric');
  });

  it('returns correct class for flame-ring', () => {
    expect(getAvatarBorderStyle('flame-ring').className).toBe('avatar-border-flame');
  });

  it('returns correct class for cosmic-drift', () => {
    expect(getAvatarBorderStyle('cosmic-drift').className).toBe('avatar-border-cosmic');
  });

  it('returns empty className for unknown border id', () => {
    expect(getAvatarBorderStyle('unknown-border').className).toBe('');
  });

  it('returns empty className for empty string', () => {
    expect(getAvatarBorderStyle('').className).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════
// getMessageBubbleClass
// ═══════════════════════════════════════════════════════════════════

describe('getMessageBubbleClass', () => {
  it('returns bubble-default for "default"', () => {
    expect(getMessageBubbleClass('default')).toBe('bubble-default');
  });

  it('returns bubble-rounded for "rounded"', () => {
    expect(getMessageBubbleClass('rounded')).toBe('bubble-rounded');
  });

  it('returns bubble-glass for "glass"', () => {
    expect(getMessageBubbleClass('glass')).toBe('bubble-glass');
  });

  it('returns bubble-neon for "neon"', () => {
    expect(getMessageBubbleClass('neon')).toBe('bubble-neon');
  });

  it('returns bubble-3d for "3d"', () => {
    expect(getMessageBubbleClass('3d')).toBe('bubble-3d');
  });

  it('returns bubble-default for unknown style', () => {
    expect(getMessageBubbleClass('unknown')).toBe('bubble-default');
  });

  it('returns bubble-default for empty string', () => {
    expect(getMessageBubbleClass('')).toBe('bubble-default');
  });
});

// ═══════════════════════════════════════════════════════════════════
// getMessageEffectClass
// ═══════════════════════════════════════════════════════════════════

describe('getMessageEffectClass', () => {
  it('returns empty string for "none"', () => {
    expect(getMessageEffectClass('none')).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(getMessageEffectClass('')).toBe('');
  });

  it('returns message-effect-slide for "slide"', () => {
    expect(getMessageEffectClass('slide')).toBe('message-effect-slide');
  });

  it('returns message-effect-fade for "fade"', () => {
    expect(getMessageEffectClass('fade')).toBe('message-effect-fade');
  });

  it('returns message-effect-bounce for "bounce"', () => {
    expect(getMessageEffectClass('bounce')).toBe('message-effect-bounce');
  });

  it('returns message-effect-glitch for "glitch"', () => {
    expect(getMessageEffectClass('glitch')).toBe('message-effect-glitch');
  });

  it('returns message-effect-confetti for "confetti"', () => {
    expect(getMessageEffectClass('confetti')).toBe('message-effect-confetti');
  });

  it('returns empty string for unknown effect', () => {
    expect(getMessageEffectClass('unknown')).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════
// getReactionStyleClass
// ═══════════════════════════════════════════════════════════════════

describe('getReactionStyleClass', () => {
  it('returns reaction-bounce for "bounce"', () => {
    expect(getReactionStyleClass('bounce')).toBe('reaction-bounce');
  });

  it('returns reaction-pop for "pop"', () => {
    expect(getReactionStyleClass('pop')).toBe('reaction-pop');
  });

  it('returns reaction-float for "float"', () => {
    expect(getReactionStyleClass('float')).toBe('reaction-float');
  });

  it('returns reaction-spin for "spin"', () => {
    expect(getReactionStyleClass('spin')).toBe('reaction-spin');
  });

  it('returns reaction-shake for "shake"', () => {
    expect(getReactionStyleClass('shake')).toBe('reaction-shake');
  });

  it('returns reaction-zoom for "zoom"', () => {
    expect(getReactionStyleClass('zoom')).toBe('reaction-zoom');
  });

  it('returns reaction-bounce as default for unknown style', () => {
    expect(getReactionStyleClass('unknown')).toBe('reaction-bounce');
  });
});

// ═══════════════════════════════════════════════════════════════════
// useCustomizationApplication hook — CSS variable injection
// ═══════════════════════════════════════════════════════════════════

describe('useCustomizationApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.style.cssText = '';
    document.body.className = '';
    mockState.profileTheme = null;
    mockState.selectedProfileThemeId = 'classic-purple';
    mockState.chatTheme = 'default';
    mockState.particleEffect = 'none';
    mockState.backgroundEffect = 'solid';
    mockState.animationSpeed = 'normal';
  });

  it('applies classic-purple CSS variables by default', () => {
    renderHook(() => useCustomizationApplication());
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--profile-primary')).toBe('#9333ea');
  });

  it('sets animation speed to 1 for normal', () => {
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('1');
  });

  it('sets animation speed to 1.5 for slow', () => {
    mockState.animationSpeed = 'slow';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('1.5');
  });

  it('sets animation speed to 0.5 for fast', () => {
    mockState.animationSpeed = 'fast';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('0.5');
  });

  it('falls back to 1 for unknown animation speed', () => {
    mockState.animationSpeed = 'ludicrous';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('1');
  });

  it('applies neon-blue theme colors', () => {
    mockState.selectedProfileThemeId = 'neon-blue';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--profile-primary')).toBe('#0ea5e9');
  });

  it('applies cyberpunk theme colors', () => {
    mockState.selectedProfileThemeId = 'cyberpunk';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--profile-primary')).toBe('#ec4899');
  });

  it('profileTheme overrides selectedProfileThemeId', () => {
    mockState.profileTheme = 'forest-green';
    mockState.selectedProfileThemeId = 'classic-purple';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--profile-primary')).toBe('#10b981');
  });

  it('adds chat-theme body class', () => {
    mockState.chatTheme = 'retro';
    renderHook(() => useCustomizationApplication());
    expect(document.body.classList.contains('chat-theme-retro')).toBe(true);
  });

  it('does not add particle class when effect is none', () => {
    renderHook(() => useCustomizationApplication());
    const hasParticle = Array.from(document.body.classList).some((c) =>
      c.startsWith('particle-effect-')
    );
    expect(hasParticle).toBe(false);
  });

  it('adds particle effect body class', () => {
    mockState.particleEffect = 'snow';
    renderHook(() => useCustomizationApplication());
    expect(document.body.classList.contains('particle-effect-snow')).toBe(true);
  });

  it('does not add bg-effect class when solid', () => {
    renderHook(() => useCustomizationApplication());
    const hasBg = Array.from(document.body.classList).some((c) => c.startsWith('bg-effect-'));
    expect(hasBg).toBe(false);
  });

  it('adds background effect body class', () => {
    mockState.backgroundEffect = 'gradient';
    renderHook(() => useCustomizationApplication());
    expect(document.body.classList.contains('bg-effect-gradient')).toBe(true);
  });
});
