/**
 * NewMessagesBar — unread boundary divider in chat scroll.
 * @module chat/components/new-messages-bar
 */
import { cn } from '@/lib/utils';

interface NewMessagesBarProps {
  count?: number;
  onJump?: () => void;
  className?: string;
}

/**
 * Horizontal red accent bar marking the boundary between read and unread messages.
 */
export function NewMessagesBar({ count, onJump, className }: NewMessagesBarProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-[var(--z-sticky,10)] flex items-center gap-3 px-4 py-1',
        className
      )}
      role="separator"
      aria-label={`${count ?? 'New'} unread messages`}
    >
      <div className="h-px flex-1 bg-red-500/70" />
      <button
        type="button"
        onClick={onJump}
        className={cn(
          'flex-shrink-0 rounded-full px-2.5 py-0.5',
          'text-[11px] font-semibold text-red-400',
          'bg-red-500/10 hover:bg-red-500/20',
          'cursor-pointer transition-colors'
        )}
      >
        {count ? `${count} new message${count > 1 ? 's' : ''}` : 'New messages'}
      </button>
      <div className="h-px flex-1 bg-red-500/70" />
    </div>
  );
}

export default NewMessagesBar;
