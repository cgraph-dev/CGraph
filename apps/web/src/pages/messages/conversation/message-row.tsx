/**
 * MessageRow — renders a single message within the virtualized conversation list.
 *
 * Handles ownership detection, avatar visibility, and inline reactions.
 */

import { useNavigate } from 'react-router-dom';
import type { Message } from '@/modules/chat/store';
import { getMessageSenderId } from '@/lib/apiUtils';
import { AnimatedMessageWrapper } from '@/modules/chat/components';
import { MessageBubble } from '@/modules/chat/components';
import type { UIPreferences } from './types';

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

/**
 * unknown for the messages module.
 */
/**
 * Message Row component.
 */
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
  const messageSenderId =
    getMessageSenderId(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      message as unknown as Record<string, unknown> /* safe downcast – polymorphic message access */
    ) || '';
  const currentUserId = user?.id || '';

  const isOwn =
    messageSenderId.length > 0 && currentUserId.length > 0 && messageSenderId === currentUserId;

  const prevMessage = groupMessages[msgIndex - 1];
  const prevSenderId = prevMessage
    ? getMessageSenderId(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        prevMessage as unknown as Record<
          // safe downcast – structural boundary
          string,
          unknown
        > /* safe downcast – polymorphic message access */
      ) || ''
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
    </AnimatedMessageWrapper>
  );
}
