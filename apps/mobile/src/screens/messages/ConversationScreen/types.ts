/**
 * ConversationScreen Types
 *
 * Type definitions for the conversation screen components.
 *
 * @module screens/messages/ConversationScreen
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type {
  MessagesStackParamList,
  Message,
  Conversation,
  ConversationParticipant,
  UserBasic,
} from '../../../types';
import type { ThemeColors } from '../../../contexts/theme-context';

// =============================================================================
// Navigation Types
// =============================================================================

export type ConversationScreenNavigationProp = NativeStackNavigationProp<
  MessagesStackParamList,
  'Conversation'
>;

export type ConversationScreenRouteProp = RouteProp<MessagesStackParamList, 'Conversation'>;

export interface ConversationScreenProps {
  navigation: ConversationScreenNavigationProp;
  route: ConversationScreenRouteProp;
}

// =============================================================================
// Component Props Types
// =============================================================================

export interface AnimatedMessageProps {
  children: React.ReactNode;
  isOwnMessage: boolean;
  index: number;
  isNew?: boolean;
}

export interface AnimatedReactionBubbleProps {
  reaction: {
    emoji: string;
    count: number;
    hasReacted: boolean;
  };
  isOwnMessage: boolean;
  onPress: () => void;
  colors: ThemeColors;
}

export interface VideoPlayerComponentProps {
  videoUrl: string;
  duration?: number;
  onClose: () => void;
}

export interface InlineVideoThumbnailProps {
  videoUrl: string;
}

export interface AttachmentVideoPreviewProps {
  uri: string;
  duration?: number;
}

export interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onLongPress: () => void;
  onReaction: (emoji: string) => void;
  onReply: () => void;
  onVideoPress?: (url: string) => void;
  colors: ThemeColors;
}

export interface MessageHeaderProps {
  participant?: ConversationParticipant;
  otherUser?: UserBasic;
  isOnline: boolean;
  onBackPress: () => void;
  onProfilePress: () => void;
  colors: ThemeColors;
}

export interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onVoice: () => void;
  isRecording: boolean;
  isSending: boolean;
  replyingTo?: Message | null;
  onCancelReply: () => void;
  colors: ThemeColors;
}

// =============================================================================
// Message Types (extended)
// =============================================================================

export interface ProcessedReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users: Array<{
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    status: 'online' | 'offline' | 'away' | 'busy';
  }>;
}

export interface ProcessedMessage extends Omit<Message, 'reactions'> {
  reactions?: ProcessedReaction[];
}

// =============================================================================
// Attachment Types
// =============================================================================

export interface PendingAttachment {
  uri: string;
  type: 'image' | 'video' | 'document' | 'voice';
  name?: string;
  mimeType?: string;
  duration?: number;
  size?: number;
}

// =============================================================================
// Re-export common types
// =============================================================================

export type { Message, Conversation, ConversationParticipant, UserBasic, MessagesStackParamList };
export type { ThemeColors };
