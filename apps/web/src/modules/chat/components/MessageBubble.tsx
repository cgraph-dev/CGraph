import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { EllipsisVerticalIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, Message } from '@/stores/chatStore';
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer';
import AdvancedVoiceVisualizer from '@/components/audio/AdvancedVoiceVisualizer';
import MessageReactions from '@/modules/chat/components/MessageReactions';
import RichMediaEmbed from '@/modules/chat/components/RichMediaEmbed';
import { GifMessage } from '@/modules/chat/components/GifMessage';
import { FileMessage } from '@/modules/chat/components/FileMessage';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import UserProfileCard from '@/modules/social/components/UserProfileCard';
import { aggregateReactions, handleRemoveReaction } from '@/lib/chat';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MessageBubble');

// UI Preferences type
export interface UIPreferences {
  glassEffect: 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic';
  animationIntensity: 'low' | 'medium' | 'high';
  showParticles: boolean;
  enableGlow: boolean;
  enable3D: boolean;
  enableHaptic: boolean;
  voiceVisualizerTheme: 'matrix-green' | 'cyber-blue' | 'neon-pink' | 'amber';
  messageEntranceAnimation: 'slide' | 'scale' | 'fade' | 'bounce';
}

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
  uiPreferences: UIPreferences;
  onAvatarClick?: (userId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onForward?: () => void;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  isEditing?: boolean;
  editContent?: string;
  onEditContentChange?: (content: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

/**
 * Handles adding a reaction to a message.
 */
async function handleAddReaction(
  messageId: string,
  emoji: string,
  _conversationId?: string
): Promise<void> {
  try {
    const { addReaction } = useChatStore.getState();
    await addReaction(messageId, emoji);
  } catch (error) {
    logger.warn('Failed to add reaction:', error);
  }
}

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

    // Safe time formatter that handles invalid dates
    const formatMessageTime = (dateStr: string | undefined | null): string => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return format(date, 'h:mm a');
      } catch {
        return '';
      }
    };

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
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
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
                      theme={uiPreferences.voiceVisualizerTheme}
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

// ====== Sub-components ======

interface ReadByEntry {
  id?: string;
  userId?: string;
  readAt?: string;
  avatarUrl?: string;
  username?: string;
}

function ReadReceipts({ readBy }: { readBy: ReadByEntry[] }) {
  return (
    <motion.div
      className="mt-1 flex items-center gap-1 px-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex -space-x-1">
        {readBy.slice(0, 3).map((reader, idx) => (
          <motion.div
            key={reader.id || reader.userId}
            className="h-4 w-4 overflow-hidden rounded-full border border-dark-900 bg-gradient-to-br from-primary-500 to-purple-600"
            initial={{ scale: 0, x: -10 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            title={`Read by ${reader.username || 'User'}`}
          >
            {reader.avatarUrl ? (
              <img
                src={reader.avatarUrl}
                alt={reader.username || 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-white">
                {(reader.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
        ))}
      </div>
      {readBy.length > 3 && (
        <span className="text-[10px] font-medium text-gray-500">+{readBy.length - 3}</span>
      )}
      <span className="text-[10px] text-gray-500">Seen</span>
    </motion.div>
  );
}

interface MessageEditFormProps {
  editContent: string;
  onEditContentChange?: (content: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

function MessageEditForm({
  editContent,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
}: MessageEditFormProps) {
  return (
    <div className="space-y-2">
      <textarea
        value={editContent}
        onChange={(e) => onEditContentChange?.(e.target.value)}
        className="w-full rounded-lg border border-gray-600 bg-dark-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        rows={3}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={onSaveEdit}
          className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-500"
        >
          Save
        </button>
        <button
          onClick={onCancelEdit}
          className="rounded-lg bg-dark-600 px-3 py-1 text-xs font-medium text-gray-300 hover:bg-dark-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface MessageActionMenuProps {
  onReply: () => void;
  onEdit?: () => void;
  onPin?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  isOwn: boolean;
}

function MessageActionMenu({
  onReply,
  onEdit,
  onPin,
  onForward,
  onDelete,
  isMenuOpen,
  onToggleMenu,
}: MessageActionMenuProps) {
  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={onReply}
        className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
        title="Reply"
      >
        <ReplyIcon />
      </button>
      <button
        onClick={onToggleMenu}
        className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
        title="More"
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg bg-dark-800 py-1 shadow-lg ring-1 ring-white/10">
          <button
            onClick={onEdit}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-700"
          >
            <EditIcon />
            Edit
          </button>
          <button
            onClick={onPin}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-700"
          >
            <PinIcon />
            Pin
          </button>
          <button
            onClick={onForward}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-700"
          >
            <ForwardIcon />
            Forward
          </button>
          <button
            onClick={onDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-700"
          >
            <DeleteIcon />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// Icon components
function ReplyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export default MessageBubble;
