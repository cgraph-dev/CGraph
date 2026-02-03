/**
 * Advanced Components Library
 *
 * Enhanced interactive components with advanced animations,
 * gestures, and visual effects.
 */

// Import for default export object
import { SwipeableCard, SwipeToDelete, SwipeToArchive } from './SwipeableCard';
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
} from './MorphingButton';
import { Carousel3D, ImageCarousel, CardCarousel } from './Carousel3D';
import { FluidTabs, SimpleTabs, IconTabs, SegmentedControl } from './FluidTabs';
import { DynamicModal, BottomSheet, ActionSheet, AlertModal } from './DynamicModal';
import { PullToRefresh, RefreshableList } from './PullToRefresh';

// ============================================================================
// SwipeableCard - Multi-action swipeable cards
// ============================================================================

export { SwipeableCard, SwipeToDelete, SwipeToArchive } from './SwipeableCard';

export type {
  SwipeableCardProps,
  SwipeAction,
  SwipeToDeleteProps,
  SwipeToArchiveProps,
} from './SwipeableCard';

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
} from './MorphingButton';

export type {
  MorphingButtonProps,
  LoadingButtonProps,
  SubmitButtonProps,
  ActionButtonProps,
  ButtonShape,
  ButtonState,
  ButtonSize,
} from './MorphingButton';

// ============================================================================
// Carousel3D - Perspective carousel with depth effects
// ============================================================================

export { Carousel3D, ImageCarousel, CardCarousel } from './Carousel3D';

export type {
  Carousel3DProps,
  CarouselLayout,
  ImageCarouselProps,
  CardCarouselProps,
} from './Carousel3D';

// ============================================================================
// FluidTabs - Animated tab bar with morphing indicator
// ============================================================================

export { FluidTabs, SimpleTabs, IconTabs, SegmentedControl } from './FluidTabs';

export type {
  FluidTabsProps,
  TabItem,
  IndicatorStyle,
  SimpleTabsProps,
  IconTabsProps,
  SegmentedControlProps,
} from './FluidTabs';

// ============================================================================
// DynamicModal - Morphing modal with multiple presentations
// ============================================================================

export { DynamicModal, BottomSheet, ActionSheet, AlertModal } from './DynamicModal';

export type {
  DynamicModalProps,
  ModalPresentation,
  SnapPoint,
  BottomSheetProps,
  ActionSheetProps,
  AlertModalProps,
} from './DynamicModal';

// ============================================================================
// PullToRefresh - Custom pull-to-refresh with physics
// ============================================================================

export { PullToRefresh, RefreshableList } from './PullToRefresh';

export type {
  PullToRefreshProps,
  RefreshIndicatorStyle,
  RefreshableListProps,
} from './PullToRefresh';

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
