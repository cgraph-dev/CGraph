/**
 * Enhanced UI Components - Index
 * 
 * Central export for all enhanced UI components.
 * 
 * @version 4.0.0
 * @since v0.7.36
 */

// Holographic UI v4.0
export {
  HoloProvider,
  useHolo,
  HoloContainer,
  HoloText,
  HoloButton,
  HoloCard,
  HoloAvatar,
  HoloInput,
  HoloProgress,
  HoloBadge,
  HoloTabs,
  HoloDivider,
  HoloModal,
  HoloNotification,
  HoloTooltip,
  HOLO_PRESETS,
  holoStyles,
} from './holographic-ui-v4/index';

export type {
  HoloTheme,
  HoloConfig,
  HoloPreset,
} from './holographic-ui-v4/index';

// Legacy Holographic UI v3.0 (for backwards compatibility)
export {
  HolographicContainer,
  HolographicText,
  HolographicButton,
  HolographicCard,
  HolographicAvatar,
  HolographicInput,
  HolographicProgress,
  HolographicNotification,
  HOLOGRAPHIC_THEMES,
  holographicStyles,
} from './holographic-ui';

export type {
  HolographicTheme,
  HolographicConfig,
} from './holographic-ui';
