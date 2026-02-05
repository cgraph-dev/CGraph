/**
 * Holographic UI System v4
 *
 * A comprehensive holographic-themed UI component library with multiple presets,
 * animations, and accessibility features.
 *
 * @module components/enhanced/ui/holographic-ui
 *
 * @example
 * ```tsx
 * import { HoloProvider, HoloContainer, HoloText, HoloButton } from '@/components/enhanced/ui/holographic-ui';
 *
 * function App() {
 *   return (
 *     <HoloProvider preset="cyan" intensity="medium">
 *       <HoloContainer>
 *         <HoloText variant="title">Hello, World!</HoloText>
 *         <HoloButton onClick={() => console.log('clicked')}>Click Me</HoloButton>
 *       </HoloContainer>
 *     </HoloProvider>
 *   );
 * }
 * ```
 */

// Types
export type {
  HoloTheme,
  HoloConfig,
  HoloPreset,
  HoloProviderProps,
  HoloContainerProps,
  HoloTextProps,
  HoloButtonProps,
  HoloCardProps,
  HoloAvatarProps,
  HoloInputProps,
  HoloProgressProps,
  HoloBadgeProps,
  HoloTab,
  HoloTabsProps,
  HoloDividerProps,
  HoloModalProps,
  HoloNotificationProps,
  HoloTooltipProps,
} from './types';

// Presets and utilities
export { HOLO_PRESETS, getTheme, getIntensityMultiplier, holoStyles } from './presets';

// Context and provider
export { HoloContext, useHolo, HoloProvider } from './context';

// Components
export {
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
} from './components';
