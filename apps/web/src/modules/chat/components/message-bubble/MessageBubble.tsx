/**
 * Message Bubble - Main Component
 *
 * Memoized message display component.
 * Displays individual chat messages with all media types, reactions, and actions.
 */

import { useState, memo } from 'react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer';
import AdvancedVoiceVisualizer from '@/modules/chat/components/audio/AdvancedVoiceVisualizer';
import MessageReactions from '@/modules/chat/components/MessageReactions';
import RichMediaEmbed from '@/modules/chat/components/RichMediaEmbed';
import { GifMessage } from '@/modules/chat/components/GifMessage';
import { FileMessage } from '@/modules/chat/components/FileMessage';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import UserProfileCard from '@/modules/social/components/UserProfileCard';
import { aggregateReactions, handleRemoveReaction } from '@/lib/chat';

import type { MessageBubbleProps, ReadByEntry } from './types';
import { formatMessageTime, handleAddReaction, mapVisualizerTheme } from './utils';
import { ReplyIcon, FileIcon } from './icons';
import { ReadReceipts } from './ReadReceipts';
import { MessageEditForm } from './MessageEditForm';
import { MessageActionMenu } from './MessageActionMenu';

/**
 * MessageBubble - Memoized message display component
 * Displays individual chat messages with all media types, reactions, and actions
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

    return (
      <div
        className={`group flex animate-fade-in items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
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

            {/* Bubble */}
            <div
              className={`rounded-2xl px-4 py-2 transition-all duration-200 hover:shadow-lg ${
                isOwn
                  ? 'rounded-br-md bg-primary-600 text-white hover:bg-primary-500'
                  : 'rounded-bl-md bg-dark-700 text-white hover:bg-dark-600'
              }`}
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
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
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

          {/* Read Receipts */}
          {isOwn && message.metadata?.readBy && Array.isArray(message.metadata.readBy) && (
            <ReadReceipts readBy={message.metadata.readBy as ReadByEntry[]} />
          )}
        </div>
      </div>
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
      prevProps.editContent === nextProps.editContent
    );
  }
);

export default MessageBubble;
