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
 */

// Layout & Feedback
export { default as ErrorBoundary } from './ErrorBoundary';
export { LoadingSpinner as Loading, LoadingOverlay } from './Loading';
export { default as Modal, ConfirmDialog } from './Modal';
export { 
  default as ToastProvider,
  useToast,
  toast,
} from './Toast';

// Empty States
export { 
  default as EmptyState,
  EmptyMessages,
  EmptyConversations,
  EmptyGroups,
  EmptyForums,
  EmptySearchResults,
  EmptyNotifications,
} from './EmptyState';

// Form Controls
export { default as Button, IconButton } from './Button';
export { default as Input, Textarea } from './Input';
export { default as TextArea } from './TextArea';
export { default as Select } from './Select';
export { default as Switch } from './Switch';
export { default as TagInput } from './TagInput';
export { default as FileUpload } from './FileUpload';

// Display
export { default as Avatar, AvatarGroup } from './Avatar';
export { default as ProgressBar } from './ProgressBar';
export { default as Tabs, TabPanel } from './Tabs';
export { default as Tooltip } from './Tooltip';
export { default as Dropdown, DropdownItem, DropdownDivider } from './Dropdown';
