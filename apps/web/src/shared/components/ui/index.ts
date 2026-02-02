/**
 * Shared UI Components - Primitives
 *
 * Re-exports all UI primitives from @/components/ui.
 * Import from '@/shared/components/ui' for the new architecture.
 *
 * @module @shared/components/ui
 */

// Re-export all UI components from legacy location
export {
  // Avatar
  Avatar,
  AvatarGroup,
  // Badge
  Badge,
  NewBadge,
  HotBadge,
  NsfwBadge,
  PinnedBadge,
  PrivateBadge,
  PublicBadge,
  OwnerBadge,
  ModeratorBadge,
  MemberBadge,
  CountBadge,
  // Button
  Button,
  IconButton,
  // Card
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  // Skeleton
  Skeleton,
  PostCardSkeleton,
  ForumCardSkeleton,
  CommentSkeleton,
  // Error State
  ErrorState,
  NetworkError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  // Empty State
  EmptyState,
  NoPostsEmpty,
  NoCommentsEmpty,
  NoMembersEmpty,
  NoMessagesEmpty,
  NoFriendsEmpty,
  SearchNoResults,
  // Toast
  ToastContainer,
  toast,
  useToastStore,
  // Tooltip
  Tooltip,
  // Dialog
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  // Form
  Input,
  Label,
  Alert,
  AlertDescription,
  AlertTitle,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  // Animation
  TiltCard,
  MiniTiltCard,
  GlowText,
  FireText,
  ElectricText,
  RainbowText,
  AnimatedBorder,
  BadgeBorder,
  NeonBorder,
  GamingStatsGrid,
  AnimatedCounter,
  XPProgressBar,
  StatCard,
} from '@/components/ui';

// Re-export GlassCard variants and AnimatedAvatar
export {
  default as GlassCard,
  GlassCardNeon,
  GlassCardHolographic,
  GlassCardCrystal,
} from '@/components/ui/GlassCard';
export { default as AnimatedAvatar } from '@/components/ui/AnimatedAvatar';
