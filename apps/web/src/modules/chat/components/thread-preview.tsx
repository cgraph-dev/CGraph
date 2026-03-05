/**
 * ThreadPreview — compact pill showing thread metadata below a message.
 * @module chat/components/thread-preview
 */
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';

interface ThreadUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface ThreadPreviewProps {
  replyCount: number;
  lastReplyAt?: string;
  participants: ThreadUser[];
  maxAvatars?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Compact clickable thread pill — shows reply count, avatar stack, and last activity.
 */
export function ThreadPreview({
  replyCount,
  lastReplyAt,
  participants,
  maxAvatars = 3,
  onClick,
  className,
}: ThreadPreviewProps) {
  if (replyCount === 0) return null;

  const visible = participants.slice(0, maxAvatars);
  const formattedTime = lastReplyAt ? formatRelative(lastReplyAt) : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group mt-1 inline-flex items-center gap-2 rounded-md px-2 py-1',
        'text-xs text-[#00AFF4] hover:text-white',
        'bg-transparent hover:bg-white/[0.04]',
        'cursor-pointer transition-colors',
        className,
      )}
    >
      {/* Thread icon */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="flex-shrink-0 opacity-60"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>

      {/* Avatar stack */}
      <div className="flex -space-x-1.5">
        {visible.map((user) => (
          <Avatar
            key={user.id}
            size="xs"
            name={user.name}
            src={user.avatarUrl}
            className="ring-1 ring-[rgb(18,18,24)]"
          />
        ))}
      </div>

      {/* Reply count */}
      <span className="font-medium">
        {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
      </span>

      {/* Last activity */}
      {formattedTime && (
        <span className="text-white/30 group-hover:text-white/50">
          {formattedTime}
        </span>
      )}

      {/* Hover arrow */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="ml-auto opacity-0 transition-opacity group-hover:opacity-60"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

/** Simple relative time formatter */
function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default ThreadPreview;
