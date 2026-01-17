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

export { default as AnimatedLogo, SplashScreen } from './AnimatedLogo';
export { default as Avatar } from './Avatar';
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as EmptyState } from './EmptyState';
export { default as Input } from './Input';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as StatusBadge } from './StatusBadge';
export { default as UserListItem } from './UserListItem';
export { default as Toast } from './Toast';
export {
  default as Skeleton,
  ForumCardSkeleton,
  PostCardSkeleton,
  CommentSkeleton,
  UserCardSkeleton,
} from './Skeleton';
export { default as Modal } from './Modal';
export { default as Header } from './Header';
export { default as IconButton } from './IconButton';
export { default as Tabs } from './Tabs';
export { default as Switch } from './Switch';
export { default as ProgressBar } from './ProgressBar';
export { default as Select } from './Select';

// Voice Messages
export { default as VoiceMessageRecorder } from './VoiceMessageRecorder';
export { default as VoiceMessagePlayer } from './VoiceMessagePlayer';

// Chat Components - Revolutionary Messaging System
export { default as RichMediaEmbed } from './chat/RichMediaEmbed';
export { default as SwipeableMessage } from './chat/SwipeableMessage';
export { default as MessageReactions } from './chat/MessageReactions';
export { default as StickerPicker } from './chat/StickerPicker';
export { default as MorphingInputButton } from './chat/MorphingInputButton';

// Conversation Components - Enhanced Animations
export { default as AnimatedReactionBubble } from './conversation/AnimatedReactionBubble';
export { default as TypingIndicator } from './conversation/TypingIndicator';

// UI Components - Premium Glassmorphism Design
export { default as GlassCard } from './ui/GlassCard';
export { default as GlassCardV2 } from './ui/GlassCardV2';
export type { GlassVariant, GlassCardV2Props, BorderAnimationMode, PressAnimation } from './ui/GlassCardV2';
export { default as AnimatedAvatar } from './ui/AnimatedAvatar';
export { default as BottomSheet } from './ui/BottomSheet';
export type { BottomSheetProps, SnapPoint } from './ui/BottomSheet';
export { default as ConfettiCelebration } from './ui/ConfettiCelebration';
export type { ConfettiCelebrationProps, ConfettiPattern } from './ui/ConfettiCelebration';
export { default as MarkdownRenderer } from './ui/MarkdownRenderer';
export type { MarkdownRendererProps } from './ui/MarkdownRenderer';
export { default as ParticleBackground } from './ui/ParticleBackground';
export { default as Carousel, ParallaxImage, ScaleItem } from './ui/Carousel';
export type { CarouselProps, CarouselItem } from './ui/Carousel';

// Gamification Components - Full Engagement System
export { default as TitleBadge } from './gamification/TitleBadge';
export { default as LevelUpModal } from './gamification/LevelUpModal';
export { default as AchievementNotification } from './gamification/AchievementNotification';
export { default as LevelProgress } from './gamification/LevelProgress';
export { default as QuestPanel } from './gamification/QuestPanel';
export type { Achievement, AchievementRarity } from './gamification/AchievementNotification';
export type { Quest, QuestType, QuestStatus, QuestReward } from './gamification/QuestPanel';

// Forum Components - Complete MyBB Feature Set
export { default as ThreadPrefixBadge } from './forums/ThreadPrefixBadge';
export { default as ThreadRatingDisplay } from './forums/ThreadRatingDisplay';
export { default as AttachmentList } from './forums/AttachmentList';
export { default as PollWidget } from './forums/PollWidget';
export { default as EditHistoryModal } from './forums/EditHistoryModal';

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
export {
  ColorPicker,
  Slider,
  RangeSlider,
  SliderGroup,
} from './inputs';
export type {
  ColorPickerProps,
  SliderProps,
  RangeSliderProps,
  SliderGroupProps,
} from './inputs';

// Attachment Picker
export { default as TelegramAttachmentPicker } from './TelegramAttachmentPicker';

// Error Boundaries - Production Stability
export {
  ErrorBoundary,
  ScreenErrorBoundary,
  ComponentErrorBoundary,
  withErrorBoundary,
} from './error';

// Animation Engine - Re-export for direct access
export * from '../lib/animations/AnimationEngine';
