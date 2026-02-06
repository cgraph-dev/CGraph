/**
 * ConversationList module exports
 * @module modules/chat/components/conversation-list
 */

export { ConversationList, default } from './ConversationList';

// Components
export { ConversationListHeader } from './ConversationListHeader';
export { ConversationItem } from './ConversationItem';
export { ConversationMenu } from './ConversationMenu';
export { EmptyState } from './EmptyState';
export { NewChatModal } from './NewChatModal';

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
