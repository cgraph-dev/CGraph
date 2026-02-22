/**
 * Holographic UI Component System v4.0
 *
 * Next-generation holographic user interface with:
 * - Full theme engine integration
 * - Advanced particle systems
 * - Depth-based parallax layers
 * - Holographic distortion effects
 * - Haptic feedback simulation
 * - Accessibility-first design
 * - Performance-optimized animations
 *
 * @version 4.0.0
 * @since v0.7.36
 */

// Types and configuration
export {
  type HoloTheme,
  type HoloConfig,
  type HoloPreset,
  HOLO_PRESETS,
  DEFAULT_CONFIG,
  getTheme,
  getIntensityMultiplier,
} from './types';

// Provider and hook
export { HoloProvider, useHolo } from './holo-provider';

// Core components
export { HoloContainer } from './holo-container';
export { HoloText } from './holo-text';
export { HoloButton } from './holo-button';
export { HoloCard } from './holo-card';
export { HoloAvatar } from './holo-avatar';
export { HoloInput } from './holo-input';
export { HoloProgress } from './holo-progress';

// Additional components
export { HoloBadge } from './holo-badge';
export { HoloTabs } from './holo-tabs';
export { HoloDivider } from './holo-divider';
export { HoloModal } from './holo-modal';
export { HoloNotification } from './holo-notification';
export { HoloTooltip } from './holo-tooltip';

// CSS keyframes
export const holoStyles = `
  @keyframes holoShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes holoScanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  
  @keyframes holoGlitch {
    0%, 100% { transform: translate(0); filter: none; }
    25% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
    50% { transform: translate(2px, -1px); filter: hue-rotate(-90deg); }
    75% { transform: translate(-1px, -1px); }
  }
  
  @keyframes holoPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;
