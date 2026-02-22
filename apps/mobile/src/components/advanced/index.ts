/**
 * Advanced Components Library
 *
 * Enhanced interactive components with advanced animations,
 * gestures, and visual effects.
 */

// Import for default export object
import { SwipeableCard, SwipeToDelete, SwipeToArchive } from './swipeable-card';
import {
  MorphingButton,
  LoadingButton,
  SubmitButton,
  ActionButton,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  GhostButton,
  GradientButton,
} from './morphing-button';
import { Carousel3D, ImageCarousel, CardCarousel } from './carousel3-d';
import { FluidTabs, SimpleTabs, IconTabs, SegmentedControl } from './fluid-tabs';
import { DynamicModal, BottomSheet, ActionSheet, AlertModal } from './dynamic-modal';
import { PullToRefresh, RefreshableList } from './pull-to-refresh';

// ============================================================================
// SwipeableCard - Multi-action swipeable cards
// ============================================================================

export { SwipeableCard, SwipeToDelete, SwipeToArchive } from './swipeable-card';

export type {
  SwipeableCardProps,
  SwipeAction,
  SwipeToDeleteProps,
  SwipeToArchiveProps,
} from './swipeable-card';

// ============================================================================
// MorphingButton - Shape-shifting buttons with state transitions
// ============================================================================

export {
  MorphingButton,
  LoadingButton,
  SubmitButton,
  ActionButton,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  GhostButton,
  GradientButton,
} from './morphing-button';

export type {
  MorphingButtonProps,
  LoadingButtonProps,
  SubmitButtonProps,
  ActionButtonProps,
  ButtonShape,
  ButtonState,
  ButtonSize,
} from './morphing-button';

// ============================================================================
// Carousel3D - Perspective carousel with depth effects
// ============================================================================

export { Carousel3D, ImageCarousel, CardCarousel } from './carousel3-d';

export type {
  Carousel3DProps,
  CarouselLayout,
  ImageCarouselProps,
  CardCarouselProps,
} from './carousel3-d';

// ============================================================================
// FluidTabs - Animated tab bar with morphing indicator
// ============================================================================

export { FluidTabs, SimpleTabs, IconTabs, SegmentedControl } from './fluid-tabs';

export type {
  FluidTabsProps,
  TabItem,
  IndicatorStyle,
  SimpleTabsProps,
  IconTabsProps,
  SegmentedControlProps,
} from './fluid-tabs';

// ============================================================================
// DynamicModal - Morphing modal with multiple presentations
// ============================================================================

export { DynamicModal, BottomSheet, ActionSheet, AlertModal } from './dynamic-modal';

export type {
  DynamicModalProps,
  ModalPresentation,
  SnapPoint,
  BottomSheetProps,
  ActionSheetProps,
  AlertModalProps,
} from './dynamic-modal';

// ============================================================================
// PullToRefresh - Custom pull-to-refresh with physics
// ============================================================================

export { PullToRefresh, RefreshableList } from './pull-to-refresh';

export type {
  PullToRefreshProps,
  RefreshIndicatorStyle,
  RefreshableListProps,
} from './pull-to-refresh';

// ============================================================================
// Default Export
// ============================================================================

const AdvancedComponents = {
  // Swipeable
  SwipeableCard,
  SwipeToDelete,
  SwipeToArchive,

  // Buttons
  MorphingButton,
  LoadingButton,
  SubmitButton,
  ActionButton,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  GhostButton,
  GradientButton,

  // Carousels
  Carousel3D,
  ImageCarousel,
  CardCarousel,

  // Tabs
  FluidTabs,
  SimpleTabs,
  IconTabs,
  SegmentedControl,

  // Modals
  DynamicModal,
  BottomSheet,
  ActionSheet,
  AlertModal,

  // Refresh
  PullToRefresh,
  RefreshableList,
};

export default AdvancedComponents;
