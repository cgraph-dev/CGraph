/**
 * PinnedMessages — list of pinned messages in chat info panel.
 * @module modules/chat/components/chat-info-panel/pinned-messages
 */
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';

interface PinnedMessage {
  id: string;
  content: string;
  authorName: string;
  authorAvatarUrl?: string;
  pinnedAt: string;
  jumpToMessage?: () => void;
}

interface PinnedMessagesProps {
  messages: PinnedMessage[];
  onUnpin?: (messageId: string) => void;
  canUnpin?: boolean;
  className?: string;
}

/**
 * PinnedMessages — scrollable list of pinned messages with jump + unpin.
 */
export function PinnedMessages({
  messages,
  onUnpin,
  canUnpin = false,
  className,
}: PinnedMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className={cn('px-3 py-8 text-center', className)}>
        <p className="text-xs text-white/20">No pinned messages</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1 px-3', className)}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/30">
        Pinned Messages — {messages.length}
      </p>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            'group flex items-start gap-2 rounded-md px-2 py-2',
            'transition-colors hover:bg-white/[0.04]'
          )}
        >
          <Avatar size="xs" name={msg.authorName} src={msg.authorAvatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className="text-xs font-medium text-white/80">{msg.authorName}</span>
              <span className="text-[10px] text-white/20">{msg.pinnedAt}</span>
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-white/50">{msg.content}</p>
            <div className="mt-1 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={msg.jumpToMessage}
                className="text-[10px] font-medium text-[#00AFF4] hover:underline"
              >
                Jump
              </button>
              {canUnpin && (
                <button
                  type="button"
                  onClick={() => onUnpin?.(msg.id)}
                  className="text-[10px] font-medium text-red-400 hover:underline"
                >
                  Unpin
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PinnedMessages;
