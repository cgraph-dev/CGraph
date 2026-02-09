// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useCustomizationStore,
  DEFAULT_STATE,
  THEME_COLORS,
  AVATAR_BORDERS,
} from '../customizationStore';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

const { api } = await import('@/lib/api');
const mockedApi = vi.mocked(api);

beforeEach(() => {
  useCustomizationStore.setState({ ...DEFAULT_STATE });
  vi.clearAllMocks();
});

// =============================================================================
// Initial State
// =============================================================================

describe('customizationStore initial state', () => {
  it('has emerald theme preset', () => {
    expect(useCustomizationStore.getState().themePreset).toBe('emerald');
  });
  it('has glassmorphism effect', () => {
    expect(useCustomizationStore.getState().effectPreset).toBe('glassmorphism');
  });
  it('has normal animation speed', () => {
    expect(useCustomizationStore.getState().animationSpeed).toBe('normal');
  });
  it('has particles enabled', () => {
    expect(useCustomizationStore.getState().particlesEnabled).toBe(true);
  });
  it('has glow border type', () => {
    expect(useCustomizationStore.getState().avatarBorderType).toBe('glow');
  });
  it('is not dirty', () => {
    expect(useCustomizationStore.getState().isDirty).toBe(false);
  });
  it('has no error', () => {
    expect(useCustomizationStore.getState().error).toBeNull();
  });
});

// =============================================================================
// Theme Actions
// =============================================================================

describe('theme actions', () => {
  it('setTheme updates themePreset and marks dirty', () => {
    useCustomizationStore.getState().setTheme('purple');
    expect(useCustomizationStore.getState().themePreset).toBe('purple');
    expect(useCustomizationStore.getState().isDirty).toBe(true);
  });

  it('setEffect updates effectPreset', () => {
    useCustomizationStore.getState().setEffect('neon');
    expect(useCustomizationStore.getState().effectPreset).toBe('neon');
  });

  it('setAnimationSpeed updates speed', () => {
    useCustomizationStore.getState().setAnimationSpeed('fast');
    expect(useCustomizationStore.getState().animationSpeed).toBe('fast');
  });

  it('toggleParticles flips particlesEnabled', () => {
    useCustomizationStore.getState().toggleParticles();
    expect(useCustomizationStore.getState().particlesEnabled).toBe(false);
    useCustomizationStore.getState().toggleParticles();
    expect(useCustomizationStore.getState().particlesEnabled).toBe(true);
  });

  it('toggleGlow flips glowEnabled', () => {
    useCustomizationStore.getState().toggleGlow();
    expect(useCustomizationStore.getState().glowEnabled).toBe(false);
  });

  it('toggleBlur flips blurEnabled', () => {
    useCustomizationStore.getState().toggleBlur();
    expect(useCustomizationStore.getState().blurEnabled).toBe(false);
  });

  it('toggleAnimatedBackground', () => {
    useCustomizationStore.getState().toggleAnimatedBackground();
    expect(useCustomizationStore.getState().animatedBackground).toBe(true);
  });
});

// =============================================================================
// Avatar Actions
// =============================================================================

describe('avatar actions', () => {
  it('setAvatarBorder sets both type and alias', () => {
    useCustomizationStore.getState().setAvatarBorder('fire');
    expect(useCustomizationStore.getState().avatarBorderType).toBe('fire');
    expect(useCustomizationStore.getState().avatarBorder).toBe('fire');
  });

  it('setAvatarBorderColor', () => {
    useCustomizationStore.getState().setAvatarBorderColor('purple');
    expect(useCustomizationStore.getState().avatarBorderColor).toBe('purple');
  });

  it('setAvatarSize', () => {
    useCustomizationStore.getState().setAvatarSize('large');
    expect(useCustomizationStore.getState().avatarSize).toBe('large');
  });
});

// =============================================================================
// Chat Actions
// =============================================================================

describe('chat actions', () => {
  it('setChatBubbleStyle sets both style and alias', () => {
    useCustomizationStore.getState().setChatBubbleStyle('rounded');
    expect(useCustomizationStore.getState().chatBubbleStyle).toBe('rounded');
    expect(useCustomizationStore.getState().bubbleStyle).toBe('rounded');
  });

  it('setChatBubbleColor sets both color and chatTheme', () => {
    useCustomizationStore.getState().setChatBubbleColor('cyan');
    expect(useCustomizationStore.getState().chatBubbleColor).toBe('cyan');
    expect(useCustomizationStore.getState().chatTheme).toBe('cyan');
  });

  it('setBubbleBorderRadius', () => {
    useCustomizationStore.getState().setBubbleBorderRadius(24);
    expect(useCustomizationStore.getState().bubbleBorderRadius).toBe(24);
  });

  it('toggleBubbleGlass', () => {
    useCustomizationStore.getState().toggleBubbleGlass();
    expect(useCustomizationStore.getState().bubbleGlassEffect).toBe(false);
  });

  it('toggleGroupMessages', () => {
    useCustomizationStore.getState().toggleGroupMessages();
    expect(useCustomizationStore.getState().groupMessages).toBe(false);
  });

  it('toggleTimestamps', () => {
    useCustomizationStore.getState().toggleTimestamps();
    expect(useCustomizationStore.getState().showTimestamps).toBe(false);
  });

  it('toggleCompactMode', () => {
    useCustomizationStore.getState().toggleCompactMode();
    expect(useCustomizationStore.getState().compactMode).toBe(true);
  });
});

// =============================================================================
// Profile Actions
// =============================================================================

describe('profile actions', () => {
  it('setProfileCardStyle sets both style and alias', () => {
    useCustomizationStore.getState().setProfileCardStyle('gaming');
    expect(useCustomizationStore.getState().profileCardStyle).toBe('gaming');
    expect(useCustomizationStore.getState().profileLayout).toBe('gaming');
  });

  it('setEquippedTitle sets both title and alias', () => {
    useCustomizationStore.getState().setEquippedTitle('king');
    expect(useCustomizationStore.getState().equippedTitle).toBe('king');
    expect(useCustomizationStore.getState().title).toBe('king');
  });

  it('setEquippedBadges', () => {
    useCustomizationStore.getState().setEquippedBadges(['a', 'b']);
    expect(useCustomizationStore.getState().equippedBadges).toEqual(['a', 'b']);
  });

  it('toggleBadges', () => {
    useCustomizationStore.getState().toggleBadges();
    expect(useCustomizationStore.getState().showBadges).toBe(false);
  });
});

// =============================================================================
// Batch & Legacy
// =============================================================================

describe('batch and legacy actions', () => {
  it('updateSettings merges and marks dirty', () => {
    useCustomizationStore
      .getState()
      .updateSettings({ themePreset: 'gold', animationSpeed: 'fast' });
    expect(useCustomizationStore.getState().themePreset).toBe('gold');
    expect(useCustomizationStore.getState().animationSpeed).toBe('fast');
    expect(useCustomizationStore.getState().isDirty).toBe(true);
  });

  it('updateChatStyle sets a key', () => {
    useCustomizationStore.getState().updateChatStyle('chatBubbleStyle', 'cloud');
    expect(useCustomizationStore.getState().chatBubbleStyle).toBe('cloud');
  });

  it('resetToDefaults restores defaults and marks dirty', () => {
    useCustomizationStore.getState().setTheme('pink');
    useCustomizationStore.getState().resetToDefaults();
    expect(useCustomizationStore.getState().themePreset).toBe('emerald');
    expect(useCustomizationStore.getState().isDirty).toBe(true);
  });

  it('clearError clears error', () => {
    useCustomizationStore.setState({ error: 'some error' });
    useCustomizationStore.getState().clearError();
    expect(useCustomizationStore.getState().error).toBeNull();
  });
});

// =============================================================================
// Fetch & Save
// =============================================================================

describe('fetchCustomizations', () => {
  it('fetches and applies server data', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: { theme_preset: 'pink', effect_preset: 'neon' } },
    });
    await useCustomizationStore.getState().fetchCustomizations();
    expect(useCustomizationStore.getState().isLoading).toBe(false);
    expect(useCustomizationStore.getState().isDirty).toBe(false);
  });

  it('handles fetch failure', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('Network error'));
    await useCustomizationStore.getState().fetchCustomizations();
    expect(useCustomizationStore.getState().isLoading).toBe(false);
    expect(useCustomizationStore.getState().error).toBe('Network error');
  });
});

// =============================================================================
// Constants
// =============================================================================

describe('constants', () => {
  it('THEME_COLORS has emerald', () => {
    expect(THEME_COLORS.emerald).toBeDefined();
    expect(THEME_COLORS.emerald.primary).toBe('#10b981');
  });

  it('AVATAR_BORDERS has expected types', () => {
    expect(AVATAR_BORDERS.none).toBeDefined();
    expect(AVATAR_BORDERS.fire.premium).toBe(true);
    expect(AVATAR_BORDERS.legendary.rarity).toBe('Legendary');
  });
});
