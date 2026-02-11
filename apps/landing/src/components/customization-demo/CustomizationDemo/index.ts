/**
 * CustomizationDemo Module
 *
 * Interactive demo showcasing the app's extensive customization capabilities.
 *
 * @module components/landing/CustomizationDemo
 */

// Types
export type {
  ThemePreset,
  EffectPreset,
  AnimationSpeed,
  AvatarBorderType,
  ChatBubbleStyle,
  ProfileCardStyle,
  DemoPanel,
  DemoState,
  ThemeColorConfig,
  AvatarBorderConfig,
  AnimatedAvatarProps,
  ProfileThemeShowcaseProps,
  ProfileThemeConfig,
} from './types';

// Constants
export { themeColors, avatarBorders, rarityColors } from './constants';

// Profile Theme Data
export {
  profileThemesByCategory,
  getProfileThemeConfig,
  getThemesByCategory,
} from './profileThemes';

// Components - Core
export { AnimatedAvatar } from './AnimatedAvatar';
export { ProfileThemeCard } from './ProfileThemeCard';
export { ProfileThemeShowcase } from './ProfileThemeShowcase';

// Components - Previews
export { AvatarPreview } from './AvatarPreview';
export { ChatPreview } from './ChatPreview';
export { ProfilePreview } from './ProfilePreview';

// Components - Control Panels
export { ThemeControlPanel } from './ThemeControlPanel';
export { AvatarControlPanel } from './AvatarControlPanel';
export { ChatControlPanel } from './ChatControlPanel';
export { ProfileControlPanel } from './ProfileControlPanel';
