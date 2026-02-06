/**
 * ModerationQueue constants
 * @module pages/forums/moderation-queue
 */

import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

export const ITEM_TYPE_ICONS: Record<string, React.ReactNode> = {
  thread: <DocumentTextIcon className="h-5 w-5" />,
  post: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
  comment: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
  user: <UserIcon className="h-5 w-5" />,
  attachment: <PhotoIcon className="h-5 w-5" />,
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-400 bg-gray-500/20',
  normal: 'text-blue-400 bg-blue-500/20',
  high: 'text-amber-400 bg-amber-500/20',
  critical: 'text-red-400 bg-red-500/20',
};

export const REASON_LABELS: Record<string, string> = {
  new_user: 'New User',
  flagged: 'Auto-Flagged',
  auto_spam: 'Spam Detection',
  reported: 'User Report',
  manual: 'Manual Review',
};

export const DEFAULT_FILTER_STATE = {
  status: 'pending' as const,
  itemType: 'all' as const,
  priority: 'all' as const,
  reason: 'all' as const,
  searchQuery: '',
};
