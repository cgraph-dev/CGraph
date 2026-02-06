import type { Channel } from '@/stores/groupStore';

export interface ChannelListProps {
  className?: string;
}

export interface CategorySectionProps {
  category: import('@/stores/groupStore').ChannelCategory;
  isExpanded: boolean;
  activeChannelId?: string;
  onToggle: () => void;
  onCreateChannel: () => void;
}

export interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
}

export interface CreateChannelModalProps {
  groupId: string;
  categoryId: string | null;
  onClose: () => void;
}

export interface ChannelTypeOption {
  value: Channel['type'];
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}
