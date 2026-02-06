/**
 * Channel List Module Types
 *
 * Type definitions for the group channel list components.
 *
 * @module modules/groups/components/channel-list
 */

import type { Channel } from '@/stores/groupStore';

/** Props for the main ChannelList component */
export interface ChannelListProps {
  /** Additional CSS classes */
  className?: string;
}

/** Props for the collapsible category section */
export interface CategorySectionProps {
  /** Channel category data */
  category: import('@/stores/groupStore').ChannelCategory;
  /** Whether this section is expanded */
  isExpanded: boolean;
  /** Currently active channel ID for highlighting */
  activeChannelId?: string;
  /** Toggle section expansion */
  onToggle: () => void;
  /** Open the create channel modal for this category */
  onCreateChannel: () => void;
}

/** Props for individual channel row */
export interface ChannelItemProps {
  /** Channel data */
  channel: Channel;
  /** Whether this channel is currently active */
  isActive: boolean;
}

/** Props for the create channel modal */
export interface CreateChannelModalProps {
  /** Group to create the channel in */
  groupId: string;
  /** Category to create the channel under */
  categoryId: string | null;
  /** Close the modal */
  onClose: () => void;
}

/** Channel type option for the type selector */
export interface ChannelTypeOption {
  /** Channel type value */
  value: Channel['type'];
  /** Display label */
  label: string;
  /** Icon component */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}
