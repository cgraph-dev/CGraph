/**
 * HolographicUI - Sci-fi themed holographic component system
 *
 * A collection of animated React Native components with holographic effects
 * including glows, scanlines, flicker animations, and customizable color themes.
 *
 * @example
 * ```tsx
 * import {
 *   HolographicContainer,
 *   HolographicText,
 *   HolographicButton,
 * } from './HolographicUI';
 *
 * <HolographicContainer colorTheme="cyan" intensity="medium">
 *   <HolographicText variant="title">Welcome</HolographicText>
 *   <HolographicButton onPress={() => {}} variant="primary">
 *     Enter
 *   </HolographicButton>
 * </HolographicContainer>
 * ```
 */

// Types and configuration
export {
  type HolographicTheme,
  type HolographicConfig,
  HOLOGRAPHIC_THEMES,
  getTheme,
  getIntensityMultiplier,
} from './types';

// Components
export {
  CornerDecoration,
  Scanlines,
  HolographicContainer,
  HolographicText,
  HolographicButton,
  HolographicCard,
  HolographicAvatar,
  HolographicInput,
  HolographicProgress,
  HolographicNotification,
} from './components';
