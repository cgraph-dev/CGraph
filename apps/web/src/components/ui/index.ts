/**
 * UI components module exports.
 * @module
 */
// UI Components
export { default as Avatar, AvatarGroup } from './avatar';
export {
  default as Badge,
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
} from './badge';
export { default as Button, IconButton } from './button';
export {
  default as Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from './card';
export {
  default as Skeleton,
  PostCardSkeleton,
  ForumCardSkeleton,
  CommentSkeleton,
} from './skeleton';
export {
  default as ErrorState,
  NetworkError,
  NotFoundError,
  PermissionError,
  RateLimitError,
} from './error-state';
export {
  default as EmptyState,
  NoPostsEmpty,
  NoCommentsEmpty,
  NoMembersEmpty,
  NoMessagesEmpty,
  NoFriendsEmpty,
  SearchNoResults,
} from './empty-state';
export { default as ToastContainer, toast, useToastStore } from './toast';
export { default as Tooltip } from './tooltip';

// Form components
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
export { Input } from './input';
export { Label } from './label';
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Popover, PopoverTrigger, PopoverContent } from './popover';
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
export { Switch } from './switch';
export { Separator } from './separator';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// Enhanced Animation Components
export { default as TiltCard, MiniTiltCard } from './tilt-card';
export { default as GlowText, FireText, ElectricText, RainbowText } from './glow-text';
export { default as AnimatedBorder, BadgeBorder, NeonBorder } from './animated-border';
export {
  default as GamingStatsGrid,
  AnimatedCounter,
  XPProgressBar,
  StatCard,
} from './gaming-stats-grid';
