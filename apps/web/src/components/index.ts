/**
 * CGraph UI Component Library
 *
 * A collection of reusable, accessible React components
 * designed for the CGraph web application.
 *
 * All components support:
 * - Dark mode via Tailwind CSS
 * - Keyboard navigation
 * - Screen reader accessibility
 * - Responsive design
 *
 * Components are organized by domain:
 * - ui/         — Basic primitives (Button, Input, Modal, Select, etc.)
 * - feedback/   — Loading, errors, toasts, empty states
 * - media/      — Voice messages, waveform, file uploads
 * - content/    — Markdown & BBCode rendering
 * - user/       — Avatar, user badges
 * - navigation/ — Tabs, Switch, Dropdown, TagInput
 * - enhanced/   — Holographic UI system
 * - layout/     — Page layouts
 */

// === UI Primitives ===
export { default as Button, IconButton } from './ui/button';
export { default as Input, Textarea } from './ui/input';
export { default as TextArea } from './ui/text-area';
export { default as Select } from './ui/select';
export { default as Modal, ConfirmDialog } from './ui/modal';
export { default as Tooltip } from './ui/tooltip';
export { default as Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
export {
  default as Skeleton,
  PostCardSkeleton,
  ForumCardSkeleton,
  CommentSkeleton,
} from './ui/skeleton';
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
} from './ui/badge';

// === Feedback ===
export { default as ErrorBoundary } from './feedback/error-boundary';
export { LoadingSpinner } from './feedback/loading-spinner';
export { LoadingOverlay } from './feedback/loading';
export { default as ToastProvider, useToast, toast } from './feedback/toast';
export { default as ProgressBar } from './feedback/progress-bar';
export {
  default as EmptyState,
  EmptyMessages,
  EmptyConversations,
  EmptyGroups,
  EmptyForums,
  EmptySearchResults,
  EmptyNotifications,
} from './feedback/empty-state';

// === Media ===
export { Waveform, generatePlaceholderWaveform } from './media/waveform';
export { VoiceMessagePlayer } from './media/voice-message-player';
export { VoiceMessageRecorder } from './media/voice-message-recorder';
export { default as FileUpload } from './media/file-upload';

// === Content ===
export { default as MarkdownRenderer } from './content/markdown-renderer';
export { default as MarkdownEditor } from './content/markdown-editor';

// === User ===
export { default as Avatar, AvatarGroup } from './user/avatar';

// === Navigation ===
export { default as Tabs, TabPanel } from './navigation/tabs';
export { default as Switch } from './navigation/switch';
export { default as Dropdown, DropdownItem, DropdownDivider } from './navigation/dropdown';
export { default as TagInput } from './navigation/tag-input';

// === Enhanced Holographic UI System v4 ===
export {
  HoloProvider,
  useHolo,
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
  HOLO_PRESETS,
  holoStyles,
} from './enhanced/ui';
