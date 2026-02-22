/**
 * Channel List Module
 *
 * Group channel sidebar with categorized channels, collapsible sections,
 * channel type icons, and a modal for creating new channels.
 *
 * @module modules/groups/components/channel-list
 */

// Main component
export { ChannelList, default } from './channel-list';

// Sub-components
export { ChannelItem } from './channel-item';
export { CategorySection } from './channel-category';
export { CreateChannelModal } from './create-channel-modal';

// Hooks
export { useChannelListState } from './hooks';

// Types
export type {
  ChannelListProps,
  ChannelItemProps,
  CategorySectionProps,
  CreateChannelModalProps,
  ChannelTypeOption,
} from './types';

// Constants
export { channelTypeIcons, channelTypeColors, channelTypes } from './constants';
