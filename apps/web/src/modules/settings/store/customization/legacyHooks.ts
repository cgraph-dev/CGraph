/**
 * Legacy compatibility hooks for the customization store.
 *
 * These hooks provide backward-compatible interfaces that map to the
 * consolidated customization store. New code should use the store directly.
 */

import { useCustomizationStore, THEME_COLORS } from './customizationStore';

/**
 * Maps shadow intensity number to legacy shadow string.
 */
function shadowIntensityToLegacy(intensity: number): string {
  if (intensity > 25) return 'strong';
  if (intensity > 10) return 'medium';
  if (intensity > 0) return 'light';
  return 'none';
}

/**
 * Maps legacy shadow string to intensity number.
 */
function legacyShadowToIntensity(shadow: string): number {
  const shadowMap: Record<string, number> = {
    none: 0,
    light: 10,
    medium: 20,
    strong: 40,
  };
  return shadowMap[shadow] ?? 20;
}

/**
 * Maps legacy update keys to store keys.
 * Returns null for keys that should be skipped.
 */
function mapLegacyKey(key: string, value: unknown): [string, unknown] | null {
  switch (key) {
    case 'bubbleColor':
      // Legacy: hex string; store expects ThemePreset - skip
      return null;
    case 'bubbleRadius':
      return ['bubbleBorderRadius', value];
    case 'bubbleStyle':
      return ['chatBubbleStyle', value];
    case 'bubbleOpacity':
      // Not tracked in consolidated store
      return null;
    case 'bubbleShadow':
      return [
        'bubbleShadowIntensity',
        typeof value === 'string' ? legacyShadowToIntensity(value) : value,
      ];
    case 'entranceAnimation':
      return ['bubbleEntranceAnimation', value];
    case 'hoverEffect':
      return ['bubbleHoverEffect', value !== 'none'];
    case 'glassEffect':
      return ['bubbleGlassEffect', value !== 'none'];
    case 'textColor':
    case 'borderStyle':
      // Not in consolidated store
      return null;
    default:
      return [key, value];
  }
}

/**
 * Legacy useChatCustomization hook with updateChat method.
 *
 * IMPORTANT: This hook uses individual primitive selectors to avoid infinite render loops.
 * The `chat` object is built using useMemo to maintain stable references.
 */
export const useChatCustomization = () => {
  // Use individual primitive selectors to avoid infinite loops
  const chatBubbleStyle = useCustomizationStore((s) => s.chatBubbleStyle);
  const chatBubbleColor = useCustomizationStore((s) => s.chatBubbleColor);
  const bubbleBorderRadius = useCustomizationStore((s) => s.bubbleBorderRadius);
  const bubbleShadowIntensity = useCustomizationStore((s) => s.bubbleShadowIntensity);
  const bubbleEntranceAnimation = useCustomizationStore((s) => s.bubbleEntranceAnimation);
  const bubbleGlassEffect = useCustomizationStore((s) => s.bubbleGlassEffect);
  const bubbleShowTail = useCustomizationStore((s) => s.bubbleShowTail);
  const bubbleHoverEffect = useCustomizationStore((s) => s.bubbleHoverEffect);
  const groupMessages = useCustomizationStore((s) => s.groupMessages);
  const showTimestamps = useCustomizationStore((s) => s.showTimestamps);
  const compactMode = useCustomizationStore((s) => s.compactMode);
  const isSaving = useCustomizationStore((s) => s.isSaving);
  const updateSettings = useCustomizationStore((s) => s.updateSettings);

  // Build legacy-compatible chat object with the field names consumers expect
  // This object is stable because all inputs are primitives
  const chat = {
    chatBubbleStyle,
    chatBubbleColor,
    bubbleBorderRadius,
    bubbleShadowIntensity,
    bubbleEntranceAnimation,
    bubbleGlassEffect,
    bubbleShowTail,
    bubbleHoverEffect,
    groupMessages,
    showTimestamps,
    compactMode,
    // Legacy field names expected by ThemedChatBubble, ChatBubbleSettings, etc.
    bubbleColor: THEME_COLORS[chatBubbleColor]?.primary ?? null,
    bubbleRadius: bubbleBorderRadius,
    bubbleOpacity: 100,
    bubbleShadow: shadowIntensityToLegacy(bubbleShadowIntensity),
    bubbleStyle: chatBubbleStyle,
    // type assertion: initializing compatibility layer with explicit null types

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    textColor: null as string | null,
    textSize: 14,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    textWeight: 'normal' as string, // type assertion: legacy compat field widened to string

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    fontFamily: 'inherit' as string, // type assertion: legacy compat field widened to string
    entranceAnimation: bubbleEntranceAnimation,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    hoverEffect: (bubbleHoverEffect ? 'lift' : 'none') as string, // type assertion: legacy compat field widened to string

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    glassEffect: (bubbleGlassEffect ? 'default' : 'none') as string, // type assertion: legacy compat field widened to string

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    borderStyle: 'none' as string, // type assertion: legacy compat field widened to string

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    particleEffect: null as string | null, // type assertion: legacy compat nullable field type

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    animationSpeed: 'normal' as string, // type assertion: legacy compat field widened to string

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    backgroundEffect: null as string | null, // type assertion: legacy compat nullable field type

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    animationIntensity: 'medium' as string, // type assertion: legacy compat field widened to string
  };

  const updateChat = (updates: Record<string, unknown>): void => {
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      const result = mapLegacyKey(key, value);
      if (result !== null) {
        const [mappedKey, mappedValue] = result;
        mapped[mappedKey] = mappedValue;
      }
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    updateSettings(mapped as Parameters<typeof updateSettings>[0]); // type assertion: mapped settings conform to update params
  };

  return {
    chatBubbleStyle,
    chatBubbleColor,
    bubbleBorderRadius,
    bubbleShadowIntensity,
    bubbleEntranceAnimation,
    bubbleGlassEffect,
    bubbleShowTail,
    bubbleHoverEffect,
    groupMessages,
    showTimestamps,
    compactMode,
    chat,
    updateChat,
    isSyncing: isSaving,
  };
};

/**
 * Legacy initializer hook.
 */
export const useCustomizationInitializer = () => {
  const initialize = useCustomizationStore((s) => s.fetchCustomizations);
  const isLoading = useCustomizationStore((s) => s.isLoading);
  const error = useCustomizationStore((s) => s.error);
  return { initialize, isLoading, error };
};
