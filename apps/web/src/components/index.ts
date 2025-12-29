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
export { default as Input, Textarea, Select } from './Input';

// Display
export { default as Avatar, AvatarGroup } from './Avatar';
