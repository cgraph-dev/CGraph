/**
 * Groups page type definitions
 * @module pages/groups
 */

import type { Group, Channel } from '@/modules/groups/store';

export interface ServerIconProps {
  group: Group;
  isActive: boolean;
}

export interface ChannelItemProps {
  channel: Channel;
  groupId: string;
  isActive: boolean;
}

export interface CategorySectionProps {
  category: {
    id: string;
    name: string;
    channels?: Channel[];
  };
  groupId: string;
  channelId?: string;
  isExpanded: boolean;
  onToggle: () => void;
  animationDelay: number;
}

export interface ServerListProps {
  groups: Group[];
  activeGroupId?: string;
}

export interface ChannelListProps {
  activeGroup: Group | undefined;
  channelId?: string;
  expandedCategories: Set<string>;
  toggleCategory: (id: string) => void;
}

export interface ContentAreaProps {
  activeGroup: Group | undefined;
  groupId?: string;
  channelId?: string;
}
