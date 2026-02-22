/**
 * ConversationList module exports
 * @module modules/chat/components/conversation-list
 */

export { ConversationList, default } from './conversation-list';

// Components
export { ConversationListHeader } from './conversation-list-header';
export { ConversationItem } from './conversation-item';
export { ConversationMenu } from './conversation-menu';
export { EmptyState } from './empty-state';
export { NewChatModal } from './new-chat-modal';

// Hooks
export { useConversationList } from './useConversationList';

// Utils
export {
  getConversationName,
  getConversationAvatar,
  getConversationAvatarBorderId,
  getConversationOnlineStatus,
  formatMessageTime,
} from './utils';

// Types
export type {
  FilterType,
  ConversationListProps,
  ConversationItemProps,
  ConversationMenuProps,
  NewChatModalProps,
  MockUser,
  FilterOption,
  UseConversationListReturn,
} from './types';

// Constants
export { FILTER_OPTIONS, MOCK_USERS } from './constants';
