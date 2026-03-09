/**
 * CGraph Mobile UI Components
 *
 * A comprehensive, customizable component library for React Native.
 *
 * Design Philosophy:
 * - All components use the theme context for consistent styling
 * - Components are self-contained and easy to customize
 * - Import any component: import { Button, Avatar } from '@/components'
 *
 * Customization:
 * - Override styles via the `style` prop
 * - Extend components by wrapping them
 * - Theme colors are pulled from ThemeContext
 *
 * Adding new components:
 * 1. Create a new file in this directory
 * 2. Export it from this index file
 * 3. Follow the existing patterns for consistency
 */

export { default as AnimatedLogo, SplashScreen } from './animated-logo';
export { default as Avatar } from './avatar';
export { default as Button } from './button';
export { default as Card } from './card';
export { default as EmptyState } from './empty-state';
export { default as Input } from './input';
export { default as LoadingSpinner } from './loading-spinner';
export { default as StatusBadge } from './status-badge';
export { default as UserListItem } from './user-list-item';
export { default as Toast } from './toast';
export {
  default as Skeleton,
  ForumCardSkeleton,
  PostCardSkeleton,
  CommentSkeleton,
  UserCardSkeleton,
} from './skeleton';
export { default as Modal } from './modal';
export { default as Header } from './header';
export { default as IconButton } from './icon-button';
export { default as Tabs } from './tabs';
export { default as Switch } from './switch';
export { default as ProgressBar } from './progress-bar';
export { default as Select } from './select';

// Voice Messages
export { default as VoiceMessageRecorder } from './voice-message-recorder';
export { default as VoiceMessagePlayer } from './voice-message-player';

// Chat Components - Revolutionary Messaging System
export { default as RichMediaEmbed } from './chat/rich-media-embed';
export { default as SwipeableMessage } from './chat/swipeable-message';
export { default as MessageReactions } from './chat/message-reactions';
export { default as StickerPicker } from './chat/sticker-picker';
export { default as MorphingInputButton } from './chat/morphing-input-button';

// Conversation Components - Enhanced Animations
export { default as AnimatedReactionBubble } from './conversation/animated-reaction-bubble';
export { default as TypingIndicator } from './conversation/typing-indicator';

// UI Components - Premium Glassmorphism Design
export { default as GlassCard } from './ui/glass-card';
export { default as GlassCardV2 } from './ui/glass-card-v2';
export type {
  GlassVariant,
  GlassCardV2Props,
  BorderAnimationMode,
  PressAnimation,
} from './ui/glass-card-v2';
export { default as AnimatedAvatar } from './ui/animated-avatar';
export { default as BottomSheet } from './ui/bottom-sheet';
export type { BottomSheetProps, SnapPoint } from './ui/bottom-sheet';
export { default as ConfettiCelebration } from './ui/confetti-celebration';
export type { ConfettiCelebrationProps, ConfettiPattern } from './ui/confetti-celebration';
export { default as MarkdownRenderer } from './ui/markdown-renderer';
export type { MarkdownRendererProps } from './ui/markdown-renderer';
export { default as ParticleBackground } from './ui/particle-background';
export { default as Carousel, ParallaxImage, ScaleItem } from './ui/carousel';
export type { CarouselProps, CarouselItem } from './ui/carousel';

// Forum Components - Complete MyBB Feature Set
export { default as ThreadPrefixBadge } from './forums/thread-prefix-badge';
export { default as ThreadRatingDisplay } from './forums/thread-rating-display';
export { default as AttachmentList } from './forums/attachment-list';
export { default as PollWidget } from './forums/poll-widget';
export { default as EditHistoryModal } from './forums/edit-history-modal';

// Enhanced UI - Revolutionary Holographic Design System
export {
  HOLOGRAPHIC_THEMES,
  HolographicContainer,
  HolographicText,
  HolographicButton,
  HolographicCard,
  HolographicAvatar,
  HolographicInput,
  HolographicProgress,
  HolographicNotification,
} from './enhanced';
export type { HolographicTheme, HolographicConfig } from './enhanced';

// Advanced Components - Interactive UI Elements
export {
  SwipeableCard,
  SwipeToDelete,
  SwipeToArchive,
  MorphingButton,
  LoadingButton,
  SubmitButton,
  ActionButton,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  GhostButton,
  GradientButton,
  Carousel3D,
  FluidTabs,
  DynamicModal,
  PullToRefresh,
} from './advanced';
export type {
  SwipeableCardProps,
  SwipeAction,
  MorphingButtonProps,
  ButtonShape,
  ButtonState,
  ButtonSize,
  Carousel3DProps,
  FluidTabsProps,
  DynamicModalProps,
  PullToRefreshProps,
} from './advanced';

// Visualization Components - Data Display
export {
  LineChart,
  BarChart,
  PieChart,
  ProgressRing,
  StackedProgressRing,
  GaugeRing,
  StatCounter,
  StatGroup,
  ComparisonStat,
  Countdown,
  Heatmap,
} from './visualization';
export type {
  ChartProps,
  LineChartProps,
  BarChartProps,
  PieChartProps,
  DataPoint,
  ProgressRingProps,
  StackedProgressRingProps,
  GaugeRingProps,
  StatCounterProps,
  HeatmapProps,
} from './visualization';

// Input Components - User Input Elements
export { ColorPicker, Slider, RangeSlider, SliderGroup } from './inputs';
export type { ColorPickerProps, SliderProps, RangeSliderProps, SliderGroupProps } from './inputs';

// Attachment Picker
export { default as AttachmentPicker } from './attachment-picker';

// Error Boundaries - Production Stability
export {
  ErrorBoundary,
  ScreenErrorBoundary,
  ComponentErrorBoundary,
  withErrorBoundary,
} from './error';

// Animation Engine - Re-export for direct access
export * from '../lib/animations/animation-engine';
