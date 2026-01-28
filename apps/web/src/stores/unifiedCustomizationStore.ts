/**
 * @deprecated This file is deprecated. Import from '@/stores/customization' instead.
 *
 * This file re-exports from the consolidated customization store for backward compatibility.
 * All new code should import directly from '@/stores/customization'.
 *
 * @see /stores/customization/index.ts
 */

import { useCustomizationStore, useChatSettings, THEME_COLORS } from './customization';

export {
  useCustomizationStore,
  useThemeSettings as useProfileCustomization,
  type CustomizationState,
  type CustomizationStore,
} from './customization';

export default useCustomizationStore;

// Legacy hook names
export const useCustomizationInitializer = () => {
  const initialize = useCustomizationStore((s) => s.fetchCustomizations);
  const isLoading = useCustomizationStore((s) => s.isLoading);
  const error = useCustomizationStore((s) => s.error);
  return { initialize, isLoading, error };
};

/**
 * Legacy useChatCustomization hook with updateChat method.
 *
 * Provides a `chat` object with legacy field names (bubbleColor, bubbleRadius, etc.)
 * that consumers like ThemedChatBubble and ChatBubbleSettings expect.
 * The underlying store uses different field names (chatBubbleColor, bubbleBorderRadius, etc.)
 * so this wrapper maps between them.
 */
export const useChatCustomization = () => {
  const chatSettings = useChatSettings();
  const store = useCustomizationStore();

  // Build legacy-compatible chat object with the field names consumers expect
  const chat = {
    ...chatSettings,
    // Legacy field names expected by ThemedChatBubble, ChatBubbleSettings, etc.
    bubbleColor: THEME_COLORS[chatSettings.chatBubbleColor]?.primary ?? null,
    bubbleRadius: chatSettings.bubbleBorderRadius,
    bubbleOpacity: 100,
    bubbleShadow:
      chatSettings.bubbleShadowIntensity > 25
        ? 'strong'
        : chatSettings.bubbleShadowIntensity > 10
          ? 'medium'
          : chatSettings.bubbleShadowIntensity > 0
            ? 'light'
            : ('none' as string),
    bubbleStyle: chatSettings.chatBubbleStyle,
    textColor: null as string | null,
    textSize: 14,
    textWeight: 'normal' as string,
    fontFamily: 'inherit' as string,
    entranceAnimation: chatSettings.bubbleEntranceAnimation,
    hoverEffect: (chatSettings.bubbleHoverEffect ? 'lift' : 'none') as string,
    glassEffect: (chatSettings.bubbleGlassEffect ? 'default' : 'none') as string,
    borderStyle: 'none' as string,
    particleEffect: null as string | null,
    animationSpeed: 'normal' as string,
    backgroundEffect: null as string | null,
    animationIntensity: 'medium' as string,
  };

  return {
    ...chatSettings,
    chat,
    updateChat: (updates: Record<string, unknown>) => {
      // Map legacy field names back to actual store field names
      const mapped: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        switch (key) {
          case 'bubbleColor':
            // Legacy: hex string; store expects ThemePreset - skip mapping
            break;
          case 'bubbleRadius':
            mapped.bubbleBorderRadius = value;
            break;
          case 'bubbleStyle':
            mapped.chatBubbleStyle = value;
            break;
          case 'bubbleOpacity':
            // Not tracked separately in consolidated store
            break;
          case 'bubbleShadow': {
            const shadowMap: Record<string, number> = {
              none: 0,
              light: 10,
              medium: 20,
              strong: 40,
            };
            mapped.bubbleShadowIntensity =
              typeof value === 'string' ? (shadowMap[value] ?? 20) : value;
            break;
          }
          case 'entranceAnimation':
            mapped.bubbleEntranceAnimation = value;
            break;
          case 'hoverEffect':
            mapped.bubbleHoverEffect = value !== 'none';
            break;
          case 'glassEffect':
            mapped.bubbleGlassEffect = value !== 'none';
            break;
          case 'textColor':
          case 'borderStyle':
            // Not in consolidated store - silently skip
            break;
          default:
            mapped[key] = value;
            break;
        }
      }
      store.updateSettings(mapped as Parameters<typeof store.updateSettings>[0]);
    },
    isSyncing: store.isSaving,
  };
};
