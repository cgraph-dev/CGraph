/**
 * Message Bubble - Main Component
 *
 * Memoized message display component.
 * Displays individual chat messages with all media types, reactions, and actions.
 * Integrates with customization store for dynamic bubble styles, effects, and titles.
 */

import { useState, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaceSmileIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import {
  getMessageBubbleClass,
  getMessageEffectClass,
} from '@/modules/settings/hooks/useCustomizationApplication';
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer';
import AdvancedVoiceVisualizer from '@/modules/chat/components/audio/AdvancedVoiceVisualizer';
import MessageReactions from '@/modules/chat/components/MessageReactions';
import RichMediaEmbed from '@/modules/chat/components/RichMediaEmbed';
import { GifMessage } from '@/modules/chat/components/GifMessage';
import { FileMessage } from '@/modules/chat/components/FileMessage';
import { MarkdownContent } from '@/modules/chat/components/MarkdownContent';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import UserProfileCard from '@/modules/social/components/UserProfileCard';
import { TitleBadge } from '@/modules/gamification/components/TitleBadge';
import { aggregateReactions, handleRemoveReaction } from '@/lib/chat';
import { cn } from '@/lib/utils';

import type { MessageBubbleProps, ReadByEntry } from './types';
import type { Message } from '@/modules/chat/store';
import { formatMessageTime, handleAddReaction, mapVisualizerTheme } from './utils';
import { ReplyIcon, FileIcon } from './icons';
import { ReadReceipts } from './ReadReceipts';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { MessageEditForm } from './MessageEditForm';
import { MessageActionMenu } from './MessageActionMenu';
import { useThreadStore } from '@/modules/chat/store/threadStore';
import { springs } from '@/lib/animation-presets/presets';

/**
 * MessageBubble - Memoized message display component
 * Displays individual chat messages with all media types, reactions, and actions.
 * Own messages use YOUR customization store; others use sender's customization from API.
 */
export const MessageBubble = memo(
  function MessageBubble({
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

    // Own customization from Zustand store
    const ownBubbleStyle = useCustomizationStore((s) => s.chatBubbleStyle);
    const ownBubbleRadius = useCustomizationStore((s) => s.bubbleBorderRadius);
    const ownMessageEffect = useCustomizationStore((s) => s.messageEffect);
    const ownEquippedTitle = useCustomizationStore((s) => s.equippedTitle);

    // Resolve customization: own messages use store, others use sender data from API
    const bubbleStyle = isOwn ? ownBubbleStyle : (message.sender?.bubbleStyle ?? 'default');
    const bubbleColor = isOwn ? null : (message.sender?.bubbleColor ?? null); // Own color handled by CSS class + theme
    const bubbleRadius = isOwn ? ownBubbleRadius : (message.sender?.bubbleRadius ?? null);
    const messageEffect = isOwn
      ? (ownMessageEffect ?? 'none')
      : (message.sender?.messageEffect ?? 'none');
    const equippedTitleId = isOwn ? ownEquippedTitle : (message.sender?.equippedTitleId ?? null);

    // Compute CSS classes from customization helpers
    const bubbleCssClass = useMemo(() => getMessageBubbleClass(bubbleStyle), [bubbleStyle]);
    const effectCssClass = useMemo(
      () => getMessageEffectClass(messageEffect ?? 'none'),
      [messageEffect]
    );

    // Inline style overrides for custom colors and radius
    const bubbleInlineStyle = useMemo(() => {
      const style: React.CSSProperties = {};
      if (bubbleColor) {
        style.backgroundColor = bubbleColor;
      }
      if (bubbleRadius != null) {
        style.borderRadius = `${bubbleRadius}px`;
      }
      return style;
    }, [bubbleColor, bubbleRadius]);

    // Message entrance animation variants — directional slide (own→right, others→left)
    const bubbleVariants = useMemo(
      () => ({
        initial: { opacity: 0, x: isOwn ? 16 : -16, y: 8, scale: 0.97 },
        animate: { opacity: 1, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
      }),
      [isOwn]
    );

    return (
      <motion.div
        variants={bubbleVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ ...springs.snappy, mass: 0.8 }}
        layout="position"
        className={cn(
          'group flex items-end gap-2',
          effectCssClass,
          isOwn ? 'flex-row-reverse' : ''
        )}
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
              {equippedTitleId && <TitleBadge title={equippedTitleId} size="xs" animated={false} />}
            </div>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div
              className={`mb-1 rounded-lg bg-dark-700/50 px-3 py-1.5 text-xs ${isOwn ? 'text-right' : ''}`}
            >
              <span className="text-primary-400">
                {message.replyTo.sender?.username || 'Unknown'}
              </span>
              <p className="max-w-xs truncate text-gray-400">{message.replyTo.content}</p>
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
              />
            )}

            {/* Bubble — dynamic styling from customization */}
            <div
              className={cn(
                'px-4 py-2 transition-all duration-200 hover:shadow-lg',
                bubbleCssClass,
                isOwn ? 'is-own text-white' : 'text-white',
                // Fallback Tailwind classes only when no custom bubble CSS class applies
                !bubbleColor &&
                  bubbleStyle === 'default' &&
                  (isOwn
                    ? 'rounded-2xl rounded-br-md bg-primary-600 hover:bg-primary-500'
                    : 'rounded-2xl rounded-bl-md bg-dark-700 hover:bg-dark-600')
              )}
              style={bubbleInlineStyle}
            >
              {/* Image/Media messages */}
              {message.messageType === 'image' && message.metadata?.url && (
                <img
                  src={message.metadata.url as string}
                  alt="Shared image"
                  className="mb-2 max-w-xs cursor-pointer rounded-lg transition-opacity hover:opacity-90"
                  onClick={() => window.open(message.metadata.url as string, '_blank')}
                />
              )}
              {message.messageType === 'video' && message.metadata?.url && (
                <video
                  src={message.metadata.url as string}
                  controls
                  className="mb-2 max-w-xs rounded-lg"
                />
              )}
              {message.messageType === 'file' && message.metadata?.url && (
                <a
                  href={message.metadata.url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-2 flex items-center gap-2 rounded-lg bg-dark-600/50 p-2 transition-colors hover:bg-dark-600"
                >
                  <FileIcon />
                  <span className="truncate text-sm">
                    {(message.metadata.filename as string) || 'File'}
                  </span>
                </a>
              )}

              {/* Voice/Audio messages with Advanced Visualizer */}
              {(message.messageType === 'voice' || message.messageType === 'audio') &&
                message.metadata?.url && (
                  <div className="min-w-[280px] space-y-2">
                    <AdvancedVoiceVisualizer
                      audioUrl={message.metadata.url as string}
                      variant="spectrum"
                      theme={mapVisualizerTheme(uiPreferences.voiceVisualizerTheme)}
                      height={120}
                      width={280}
                      className="rounded-xl"
                    />
                    <VoiceMessagePlayer
                      messageId={message.id}
                      audioUrl={message.metadata.url as string}
                      duration={(message.metadata.duration as number) || 0}
                      waveformData={message.metadata.waveform as number[] | undefined}
                      className={isOwn ? 'voice-player-own' : ''}
                    />
                  </div>
                )}

              {/* GIF Message */}
              {message.messageType === 'gif' && (
                <GifMessage message={message} isOwnMessage={isOwn} className="mb-2" />
              )}

              {/* File Message */}
              {message.messageType === 'file' && (
                <FileMessage message={message} isOwnMessage={isOwn} className="mb-2" />
              )}

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
                        <MarkdownContent content={message.content} />
                        <RichMediaEmbed content={message.content} isOwnMessage={isOwn} />
                      </>
                    )}
                  </>
                )}

              <div
                className={`mt-1 flex items-center gap-1 text-xs ${isOwn ? 'text-primary-200' : 'text-gray-500'}`}
              >
                <span>{formatMessageTime(message.createdAt)}</span>
                {message.isEdited && <span>(edited)</span>}
                {!!(message as unknown as Record<string, unknown>).expiresAt && (
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
                      (message.metadata?.readBy as ReadByEntry[] | undefined)?.length
                        ? 'read'
                        : message.metadata?.deliveredAt
                          ? 'delivered'
                          : 'sent'
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
                  className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
                  title="Reply"
                >
                  <ReplyIcon />
                </button>
                <button
                  className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
                  title="React"
                >
                  <FaceSmileIcon className="h-4 w-4" />
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
            />
          </div>

          {/* Thread replies indicator */}
          <ThreadReplyBadge
            messageId={message.id}
            conversationId={message.conversationId}
            message={message}
          />

          {/* Read Receipts */}
          {isOwn && message.metadata?.readBy && Array.isArray(message.metadata.readBy) && (
            <ReadReceipts readBy={message.metadata.readBy as ReadByEntry[]} />
          )}
        </div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.isEdited === nextProps.message.isEdited &&
      prevProps.message.reactions.length === nextProps.message.reactions.length &&
      prevProps.message.isPinned === nextProps.message.isPinned &&
      prevProps.isOwn === nextProps.isOwn &&
      prevProps.showAvatar === nextProps.showAvatar &&
      prevProps.isMenuOpen === nextProps.isMenuOpen &&
      prevProps.isEditing === nextProps.isEditing &&
      prevProps.editContent === nextProps.editContent &&
      // Customization fields — must track all sender rendering fields
      prevProps.uiPreferences === nextProps.uiPreferences &&
      prevProps.message.sender?.bubbleStyle === nextProps.message.sender?.bubbleStyle &&
      prevProps.message.sender?.bubbleColor === nextProps.message.sender?.bubbleColor &&
      prevProps.message.sender?.bubbleRadius === nextProps.message.sender?.bubbleRadius &&
      prevProps.message.sender?.messageEffect === nextProps.message.sender?.messageEffect &&
      prevProps.message.sender?.equippedTitleId === nextProps.message.sender?.equippedTitleId &&
      prevProps.message.sender?.avatarBorderId === nextProps.message.sender?.avatarBorderId
    );
  }
);

export default MessageBubble;

/** Inline thread reply count badge — opens ThreadPanel on click */
function ThreadReplyBadge({
  messageId,
  conversationId,
  message,
}: {
  messageId: string;
  conversationId: string;
  message: Message;
}) {
  const replyCount = useThreadStore((s) => s.replyCounts[messageId]);
  const openThread = useThreadStore((s) => s.openThread);

  if (!replyCount || replyCount <= 0) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs text-primary-400 transition-colors hover:bg-dark-700/60"
      onClick={() => openThread(conversationId, message)}
      title="View thread"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 8.25h9m-9 3H12m-6.75 3.75L3 21l3.75-3.75h10.5A2.25 2.25 0 0019.5 15V5.25A2.25 2.25 0 0017.25 3H6.75A2.25 2.25 0 004.5 5.25V15a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
      <span className="font-medium">
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      </span>
    </motion.button>
  );
}
