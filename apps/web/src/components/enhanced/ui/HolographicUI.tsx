/**
 * Holographic UI Component System v3
 *
 * Re-export from modular v4 structure with v3-compatible API
 *
 * @see ./holographic-ui/ for the modular implementation
 * @version 3.0.0
 * @deprecated Use the v4 API from ./holographic-ui directly
 */

// Re-export v4 components with v3 names for backward compatibility
export {
  HoloContainer as HolographicContainer,
  HoloText as HolographicText,
  HoloButton as HolographicButton,
  HoloCard as HolographicCard,
  HoloAvatar as HolographicAvatar,
  HoloInput as HolographicInput,
  HoloProgress as HolographicProgress,
  HoloNotification as HolographicNotification,
  HOLO_PRESETS as HOLOGRAPHIC_THEMES,
  holoStyles as holographicStyles,
} from './holographic-ui';

// Re-export types with v3 names
export type {
  HoloTheme as HolographicTheme,
  HoloConfig as HolographicConfig,
} from './holographic-ui';
