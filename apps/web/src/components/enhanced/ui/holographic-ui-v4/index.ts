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
export { HoloProvider, useHolo } from './HoloProvider';

// Core components
export { HoloContainer } from './HoloContainer';
export { HoloText } from './HoloText';
export { HoloButton } from './HoloButton';
export { HoloCard } from './HoloCard';
export { HoloAvatar } from './HoloAvatar';
export { HoloInput } from './HoloInput';
export { HoloProgress } from './HoloProgress';

// Additional components
export { HoloBadge } from './HoloBadge';
export { HoloTabs } from './HoloTabs';
export { HoloDivider } from './HoloDivider';
export { HoloModal } from './HoloModal';
export { HoloNotification } from './HoloNotification';
export { HoloTooltip } from './HoloTooltip';

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
