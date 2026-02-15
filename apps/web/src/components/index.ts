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
export { default as Button, IconButton } from './ui/Button';
export { default as Input, Textarea } from './ui/Input';
export { default as TextArea } from './ui/TextArea';
export { default as Select } from './ui/Select';
export { default as Modal, ConfirmDialog } from './ui/Modal';
export { default as Tooltip } from './ui/Tooltip';
export { default as Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
export {
  default as Skeleton,
  PostCardSkeleton,
  ForumCardSkeleton,
  CommentSkeleton,
} from './ui/Skeleton';
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
} from './ui/Badge';

// === Feedback ===
export { default as ErrorBoundary } from './feedback/ErrorBoundary';
export { LoadingSpinner } from './feedback/LoadingSpinner';
export { LoadingOverlay } from './feedback/Loading';
export { default as ToastProvider, useToast, toast } from './feedback/Toast';
export { default as ProgressBar } from './feedback/ProgressBar';
export {
  default as EmptyState,
  EmptyMessages,
  EmptyConversations,
  EmptyGroups,
  EmptyForums,
  EmptySearchResults,
  EmptyNotifications,
} from './feedback/EmptyState';

// === Media ===
export { Waveform, generatePlaceholderWaveform } from './media/Waveform';
export { VoiceMessagePlayer } from './media/VoiceMessagePlayer';
export { VoiceMessageRecorder } from './media/VoiceMessageRecorder';
export { default as FileUpload } from './media/FileUpload';

// === Content ===
export { default as MarkdownRenderer } from './content/MarkdownRenderer';
export { default as MarkdownEditor } from './content/MarkdownEditor';

// === User ===
export { default as Avatar, AvatarGroup } from './user/Avatar';

// === Navigation ===
export { default as Tabs, TabPanel } from './navigation/Tabs';
export { default as Switch } from './navigation/Switch';
export { default as Dropdown, DropdownItem, DropdownDivider } from './navigation/Dropdown';
export { default as TagInput } from './navigation/TagInput';

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
