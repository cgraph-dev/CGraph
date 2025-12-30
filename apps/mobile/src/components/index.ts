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
