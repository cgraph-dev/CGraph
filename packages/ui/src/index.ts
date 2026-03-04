/**
 * @cgraph/ui — Liquid Glass Component Library
 *
 * Barrel export for all shared Liquid Glass components.
 */

// Shared utilities & constants
export {
  cn,
  springPreset,
  springSnap,
  springGentle,
  glassSurface,
  glassSurfaceElevated,
  glowColors,
  prefersReducedMotion,
  type GlowColor,
} from './shared';

// Components — Phase 1
export { LiquidButton, buttonVariants, type LiquidButtonProps } from './components/liquid-button';
export { LiquidCard, cardVariants, type LiquidCardProps } from './components/liquid-card';
export { LiquidModal, type LiquidModalProps } from './components/liquid-modal';

// Components — Phase 2
export { LiquidInput, inputVariants, type LiquidInputProps } from './components/liquid-input';
export { LiquidSearch, type LiquidSearchProps } from './components/liquid-search';
export {
  LiquidSelect,
  type LiquidSelectProps,
  type LiquidSelectOption,
} from './components/liquid-select';
export { LiquidToggle, type LiquidToggleProps } from './components/liquid-toggle';
export { LiquidCheckbox, type LiquidCheckboxProps } from './components/liquid-checkbox';
export { LiquidTabs, type LiquidTabsProps, type LiquidTab } from './components/liquid-tabs';
export {
  LiquidToastContainer,
  type LiquidToastContainerProps,
  toast,
  dismissToast,
  clearAllToasts,
  useToast,
  type Toast,
  type ToastVariant,
} from './components/liquid-toast';
export {
  LiquidUserCard,
  userCardVariants,
  type LiquidUserCardProps,
  LiquidAvatar,
  type LiquidAvatarProps,
} from './components/liquid-user-card';
