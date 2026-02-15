/**
 * MessageRow — renders a single message within the virtualized conversation list.
 *
 * Handles ownership detection, avatar visibility, and inline reactions.
 */

import { useNavigate } from 'react-router-dom';
import type { Message } from '@/modules/chat/store';
import { getMessageSenderId } from '@/lib/apiUtils';
import { handleAddReaction } from '@/lib/chat/reactionUtils';
import { createLogger } from '@/lib/logger';
import { AnimatedMessageWrapper, AnimatedReactionBubble } from '@/modules/chat/components';
import { MessageBubble } from '@/modules/chat/components';
import type { UIPreferences } from './types';

const logger = createLogger('MessageRow');

interface MessageRowProps {
  message: Message;
  groupMessages: Message[];
  msgIndex: number;
  user: { id: string } | null;
  uiPreferences: UIPreferences;
  isNew: boolean;
  activeMessageMenu: string | null;
  editingMessageId: string | null;
  editContent: string;
  onReply: (message: Message) => void;
  onStartEdit: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onOpenForward: (message: Message) => void;
  onToggleMessageMenu: (messageId: string) => void;
  onEditContentChange: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export function MessageRow({
  message,
  groupMessages,
  msgIndex,
  user,
  uiPreferences,
  isNew,
  activeMessageMenu,
  editingMessageId,
  editContent,
  onReply,
  onStartEdit,
  onDeleteMessage,
  onPinMessage,
  onOpenForward,
  onToggleMessageMenu,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
}: MessageRowProps) {
  const navigate = useNavigate();
  const messageSenderId = getMessageSenderId(message as unknown as Record<string, unknown>) || '';
  const currentUserId = user?.id || '';

  if (import.meta.env.DEV && msgIndex === 0) {
    logger.debug('Web] First message debug:', {
      messageId: message.id,
      messageSenderId,
      currentUserId,
      isEqual: messageSenderId === currentUserId,
    });
  }

  const isOwn =
    messageSenderId.length > 0 && currentUserId.length > 0 && messageSenderId === currentUserId;

  const prevMessage = groupMessages[msgIndex - 1];
  const prevSenderId = prevMessage
    ? getMessageSenderId(prevMessage as unknown as Record<string, unknown>) || ''
    : '';
  const showAvatar = !isOwn && (msgIndex === 0 || prevSenderId !== messageSenderId);

  return (
    <AnimatedMessageWrapper
      isOwnMessage={isOwn}
      index={msgIndex}
      isNew={isNew}
      messageId={message.id}
      onSwipeReply={() => onReply(message)}
      enableGestures={true}
    >
      <MessageBubble
        message={message}
        isOwn={isOwn}
        showAvatar={showAvatar}
        onReply={() => onReply(message)}
        uiPreferences={uiPreferences}
        onAvatarClick={(avatarUserId) => navigate(`/user/${avatarUserId}`)}
        onEdit={() => onStartEdit(message)}
        onDelete={() => onDeleteMessage(message.id)}
        onPin={() => onPinMessage(message.id)}
        onForward={() => onOpenForward(message)}
        isMenuOpen={activeMessageMenu === message.id}
        onToggleMenu={() => onToggleMessageMenu(message.id)}
        isEditing={editingMessageId === message.id}
        editContent={editContent}
        onEditContentChange={onEditContentChange}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
      />
      {message.reactions && message.reactions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(
            message.reactions.reduce<Record<string, { count: number; hasReacted: boolean }>>(
              (acc, r) => {
                const entry = (acc[r.emoji] ??= { count: 0, hasReacted: false });
                entry.count++;
                if (user && r.userId === user.id) entry.hasReacted = true;
                return acc;
              },
              {}
            )
          ).map(([emoji, { count, hasReacted }]) => (
            <AnimatedReactionBubble
              key={emoji}
              reaction={{ emoji, count, hasReacted }}
              isOwnMessage={isOwn}
              onPress={() => handleAddReaction(message.id, emoji)}
            />
          ))}
        </div>
      )}
    </AnimatedMessageWrapper>
  );
}
