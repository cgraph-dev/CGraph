/**
 * MessageInput Component
 *
 * Message input area with attachments, emoji picker, and reply preview.
 */

import { PaperAirplaneIcon, PaperClipIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import type { MessageInputProps } from './types';
import { getDisplayName } from './utils';

/**
 * unknown for the groups module.
 */
/**
 * Message Input component.
 */
export function MessageInput({
  channelName,
  messageInput,
  isSending,
  replyTo,
  onInputChange,
  onKeyDown,
  onSend,
  onCancelReply,
}: MessageInputProps) {
  return (
    <>
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center justify-between border-t border-dark-700 bg-dark-800 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 rounded-full bg-primary-500" />
            <div>
              <p className="text-xs text-primary-400">
                Replying to {getDisplayName(replyTo.author.username, replyTo.author.displayName)}
              </p>
              <p className="max-w-md truncate text-sm text-gray-400">{replyTo.content}</p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="rounded p-1 text-gray-400 hover:bg-dark-700 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-dark-700 p-4">
        <div className="flex items-end gap-2 rounded-lg bg-dark-700 px-4 py-2">
          <button className="p-1 text-gray-400 transition-colors hover:text-white">
            <PaperClipIcon className="h-5 w-5" />
          </button>

          <textarea
            value={messageInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Message #${channelName}`}
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent text-white placeholder-gray-500 focus:outline-none"
            style={{ minHeight: '24px' }}
          />

          <button className="p-1 text-gray-400 transition-colors hover:text-white">
            <FaceSmileIcon className="h-5 w-5" />
          </button>

          <button
            onClick={onSend}
            disabled={!messageInput.trim() || isSending}
            className="p-1 text-primary-400 transition-colors hover:text-primary-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Close icon SVG component
 */
function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
