/**
 * Notifications Constants
 *
 * Icon and color mappings for notification types.
 */

import {
  BellIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  UserGroupIcon,
  AtSymbolIcon,
  ChatBubbleBottomCenterTextIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export const TYPE_ICONS: Record<string, typeof BellIcon> = {
  message: ChatBubbleLeftIcon,
  friend_request: UserPlusIcon,
  group_invite: UserGroupIcon,
  mention: AtSymbolIcon,
  forum_reply: ChatBubbleBottomCenterTextIcon,
  system: Cog6ToothIcon,
};

export const TYPE_COLORS: Record<string, string> = {
  message: 'bg-blue-500',
  friend_request: 'bg-green-500',
  group_invite: 'bg-purple-500',
  mention: 'bg-yellow-500',
  forum_reply: 'bg-orange-500',
  system: 'bg-gray-500',
};

export const DEFAULT_ICON = BellIcon;
export const DEFAULT_COLOR = 'bg-gray-500';
