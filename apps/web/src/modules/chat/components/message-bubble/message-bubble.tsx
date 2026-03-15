/** Message Bubble — memoized message display with media, reactions, and actions. */

import { useState, memo, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Lock, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import {
  getMessageBubbleClass,
  getMessageEffectClass,
} from '@/modules/settings/hooks/useCustomizationApplication';
import MessageReactions from '@/modules/chat/components/message-reactions';
import RichMediaEmbed from '@/modules/chat/components/rich-media-embed';
import { MarkdownContent } from '@/modules/chat/components/markdown-content';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import UserProfileCard from '@/modules/social/components/user-profile-card';
import { aggregateReactions, handleRemoveReaction } from '@/lib/chat';
import { cn } from '@/lib/utils';

import type { MessageBubbleProps, ReadByEntry } from './types';
import { formatMessageTime, handleAddReaction, areMessageBubblePropsEqual } from './utils';
import { ReplyIcon } from './icons';
import { ReadReceipts } from './read-receipts';
import { MessageStatusIndicator } from './message-status-indicator';
import { MessageEditForm } from './message-edit-form';
import { EditHistoryViewer } from './edit-history-viewer';
import { MessageActionMenu } from './message-action-menu';
import { MessageMediaContent } from './message-media-content';
import { ThreadReplyBadge } from './thread-reply-badge';
import { InlineTitle } from '@/shared/components/ui';
import { springs, tweens } from '@/lib/animation-presets';

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onReply,
  uiPreferences,
  onEdit,
  onDelete,
  onPin,
  onForward,
  isMenuOpen,
  onToggleMenu,
  isEditing,
  editContent,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);

  const toggleEditHistory = useCallback(() => {
    setShowEditHistory((prev) => !prev);
  }, []);

  const ownBubbleStyle = useCustomizationStore((s) => s.chatBubbleStyle);
  const ownBubbleRadius = useCustomizationStore((s) => s.bubbleBorderRadius);
  const ownMessageEffect = useCustomizationStore((s) => s.messageEffect);
  const ownEquippedTitle = useCustomizationStore((s) => s.equippedTitle);

  const bubbleStyle = isOwn ? ownBubbleStyle : (message.sender?.bubbleStyle ?? 'default');
  const bubbleColor = isOwn ? null : (message.sender?.bubbleColor ?? null);
  const bubbleRadius = isOwn ? ownBubbleRadius : (message.sender?.bubbleRadius ?? null);
  const messageEffect = isOwn
    ? (ownMessageEffect ?? 'none')
    : (message.sender?.messageEffect ?? 'none');
  const equippedTitleId = isOwn ? ownEquippedTitle : (message.sender?.equippedTitleId ?? null);

  const bubbleCssClass = useMemo(() => getMessageBubbleClass(bubbleStyle), [bubbleStyle]);
  const effectCssClass = useMemo(
    () => getMessageEffectClass(messageEffect ?? 'none'),
    [messageEffect]
  );

  const bubbleInlineStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (bubbleColor) style.backgroundColor = bubbleColor;
    if (bubbleRadius != null) style.borderRadius = `${bubbleRadius}px`;
    return style;
  }, [bubbleColor, bubbleRadius]);
  const bubbleVariants = useMemo(
    () => ({
      initial: { opacity: 0, x: isOwn ? 16 : -16, y: 8, scale: 0.97 },
      animate: { opacity: 1, x: 0, y: 0, scale: 1 },
      exit: { opacity: 0, scale: 0.95, transition: tweens.quickFade },
    }),
    [isOwn]
  );

  // Soft-deleted messages: render a non-interactive placeholder
  if (message.deletedAt) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('group flex items-end gap-2', isOwn ? 'flex-row-reverse' : '')}
      >
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
          <div className="rounded-2xl border border-transparent bg-white/[0.04] px-4 py-2 backdrop-blur-[8px] dark:border-white/[0.04] dark:bg-white/[0.05]">
            <p className="text-sm italic text-gray-500 dark:text-gray-500">
              [This message was deleted]
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ ...springs.snappy, mass: 0.8 }}
      layout="position"
      className={cn('group flex items-end gap-2', effectCssClass, isOwn ? 'flex-row-reverse' : '')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && message.sender?.id && (
            <UserProfileCard userId={message.sender.id} trigger="both" className="cursor-pointer">
              <ThemedAvatar
                src={message.sender?.avatarUrl}
                alt={message.sender?.displayName || message.sender?.username || 'User'}
                size="small"
                avatarBorderId={message.sender?.avatarBorderId}
              />
            </UserProfileCard>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Sender name + title badge (for other users' messages) */}
        {!isOwn && showAvatar && (
          <div className="mb-0.5 flex items-center gap-1.5 px-1">
            <span className="text-xs font-medium text-gray-400">
              {message.sender?.displayName || message.sender?.username}
            </span>
            {equippedTitleId && <InlineTitle titleId={equippedTitleId} size="xs" />}
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={`mb-1 rounded-lg border border-transparent bg-white/[0.06] px-3 py-1.5 text-xs backdrop-blur-[8px] dark:border-white/[0.04] dark:bg-white/[0.06] ${isOwn ? 'text-right' : ''}`}
          >
            <span className="text-primary-400">
              {message.replyTo.sender?.username || 'Unknown'}
            </span>
            <p className="max-w-xs truncate text-gray-400">{message.replyTo.content}</p>
          </div>
        )}

        {/* Forwarded message attribution */}
        {message.forwardedFromUserId && (
          <div
            className={`mb-1 flex items-center gap-1 px-1 text-xs text-gray-400 ${isOwn ? 'justify-end' : ''}`}
          >
            <span>↪</span>
            <span className="italic">
              {message.forwardedFromUserName
                ? `Forwarded from ${message.forwardedFromUserName}`
                : 'Forwarded'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Actions (for own messages, show on left) */}
          {isOwn && showActions && (
            <MessageActionMenu
              onReply={onReply}
              onEdit={onEdit}
              onPin={onPin}
              onForward={onForward}
              onDelete={onDelete}
              isMenuOpen={isMenuOpen}
              onToggleMenu={onToggleMenu}
              isOwn={true}
              messageId={message.id}
            />
          )}

          {/* Bubble — dynamic styling from customization + liquid glass */}
          <div
            className={cn(
              'px-4 py-2 transition-all duration-200',
              'backdrop-blur-[12px] backdrop-saturate-[1.4]',
              bubbleCssClass,
              isOwn ? 'is-own text-white' : 'text-white',
              // Fallback Tailwind classes only when no custom bubble CSS class applies
              !bubbleColor &&
                bubbleStyle === 'default' &&
                (isOwn
                  ? 'rounded-2xl rounded-br-md bg-primary-600/90 shadow-[0_2px_8px_rgba(16,185,129,0.15)] hover:bg-primary-500/90'
                  : 'rounded-2xl rounded-bl-md border border-transparent bg-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-white/[0.12] dark:border-white/[0.06] dark:bg-white/[0.08] dark:hover:bg-white/[0.12]')
            )}
            style={bubbleInlineStyle}
          >
            <MessageMediaContent
              message={message}
              isOwn={isOwn}
              voiceVisualizerTheme={uiPreferences.voiceVisualizerTheme}
            />

            {/* Text content */}
            {message.content &&
              message.messageType !== 'voice' &&
              message.messageType !== 'audio' &&
              message.messageType !== 'gif' &&
              message.messageType !== 'file' && (
                <>
                  {isEditing ? (
                    <MessageEditForm
                      editContent={editContent || ''}
                      onEditContentChange={onEditContentChange}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                    />
                  ) : (
                    <>
                      {message.decryptionFailed ? (
                        <p className="text-sm italic text-gray-500">
                          {message.content || 'Unable to decrypt message'}
                        </p>
                      ) : (
                        <>
                          <MarkdownContent content={message.content} />
                          <RichMediaEmbed content={message.content} isOwnMessage={isOwn} />
                        </>
                      )}
                    </>
                  )}
                </>
              )}

            <div
              className={`mt-1 flex items-center gap-1 text-xs ${isOwn ? 'text-primary-200' : 'text-gray-500'}`}
            >
              <span>{formatMessageTime(message.createdAt)}</span>
              {message.isEdited && (
                <span className="relative">
                  {message.edits && message.edits.length > 0 ? (
                    <>
                      <button
                        onClick={toggleEditHistory}
                        className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-white"
                      >
                        (edited)
                      </button>
                      <EditHistoryViewer
                        edits={message.edits}
                        currentContent={message.content}
                        isOpen={showEditHistory}
                        onClose={() => setShowEditHistory(false)}
                      />
                    </>
                  ) : (
                    <span>(edited)</span>
                  )}
                </span>
              )}
              {message.decryptionFailed && (
                <span
                  className="flex items-center gap-0.5 text-amber-400/70"
                  title="This message could not be decrypted"
                >
                  <ShieldAlert className="h-3 w-3" />
                </span>
              )}
              {message.isEncrypted && !message.decryptionFailed && (
                <span
                  className="flex items-center gap-0.5 text-gray-500/60"
                  title="End-to-end encrypted"
                >
                  <Lock className="h-3 w-3" />
                </span>
              )}
              {'expiresAt' in message && !!message.expiresAt && (
                <span
                  className="flex items-center gap-0.5 text-amber-400/70"
                  title="Disappearing message"
                >
                  <ClockIcon className="h-3 w-3" />
                </span>
              )}
              {isOwn && (
                <MessageStatusIndicator
                  status={
                    message.deliveryStatus ??  
                    ((message.metadata?.readBy as ReadByEntry[] | undefined)?.length // type assertion: metadata readBy field type
                      ? /* safe downcast – metadata field */
                        'read'
                      : message.metadata?.deliveredAt
                        ? 'delivered'
                        : 'sent')
                  }
                />
              )}
            </div>
          </div>

          {/* Actions (for other messages, show on right) */}
          {!isOwn && showActions && (
            <div className="flex items-center gap-1">
              <button
                onClick={onReply}
                className="rounded p-1 text-gray-500 transition-colors hover:bg-white/[0.08] hover:text-white dark:hover:bg-white/[0.10]"
                title="Reply"
              >
                <ReplyIcon />
              </button>
            </div>
          )}
        </div>

        {/* Reactions */}
        <div className="mt-1">
          <MessageReactions
            messageId={message.id}
            reactions={aggregateReactions(message.reactions)}
            onAddReaction={handleAddReaction}
            onRemoveReaction={handleRemoveReaction}
            currentUserId={useAuthStore.getState().user?.id || ''}
            disabled={false}
            isOwn={isOwn}
          />
        </div>

        {/* Thread replies indicator */}
        <ThreadReplyBadge
          messageId={message.id}
          conversationId={message.conversationId}
          message={message}
        />
        {isOwn && message.metadata?.readBy && Array.isArray(message.metadata.readBy) && (
          <ReadReceipts
            readBy={
               
              message.metadata
                .readBy as ReadByEntry[] /* safe downcast – guarded by Array.isArray */
            }
          />
        )}
      </div>
    </motion.div>
  );
}, areMessageBubblePropsEqual);

export default MessageBubble;
