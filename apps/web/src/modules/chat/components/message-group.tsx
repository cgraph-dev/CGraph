/**
 * MessageGroup — Discord cozy-mode grouping of consecutive messages by same author.
 * @module chat/components/message-group
 */
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';

interface MessageGroupProps {
  /** Author info */
  author: {
    id: string;
    name: string;
    avatar?: string | null;
    roleColor?: string;
  };
  /** Timestamp of first message in group */
  timestamp: Date;
  children: ReactNode;
  className?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatFullTimestamp(date: Date): string {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return `Today at ${formatTime(date)}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${formatTime(date)}`;
  return `${date.toLocaleDateString()} ${formatTime(date)}`;
}

/**
 * MessageGroup — wraps consecutive messages from the same author.
 * First message shows avatar + name + timestamp; subsequent show only content.
 */
export function MessageGroup({ author, timestamp, children, className }: MessageGroupProps) {
  return (
    <div
      className={cn(
        'group relative flex gap-4 px-4 py-0.5 transition-colors',
        'hover:bg-white/[0.02]',
        className,
      )}
    >
      {/* Avatar column — fixed 40px */}
      <div className="flex w-10 shrink-0 items-start pt-0.5">
        <Avatar
          src={author.avatar}
          name={author.name}
          size="lg"
          status="online"
        />
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        {/* Header: name + timestamp */}
        <div className="flex items-baseline gap-2">
          <span
            className="text-sm font-semibold leading-snug hover:underline cursor-pointer"
            style={{ color: author.roleColor ?? '#ffffff' }}
          >
            {author.name}
          </span>
          <span className="text-[11px] leading-snug text-white/30">
            {formatFullTimestamp(timestamp)}
          </span>
        </div>

        {/* Messages */}
        {children}
      </div>
    </div>
  );
}

/** Compact continuation message within a group — no avatar, just content */
interface GroupedMessageProps {
  timestamp: Date;
  children: ReactNode;
  className?: string;
}

export function GroupedMessage({ timestamp, children, className }: GroupedMessageProps) {
  return (
    <div
      className={cn(
        'group/msg relative flex gap-4 px-4 py-px transition-colors',
        'hover:bg-white/[0.02]',
        className,
      )}
    >
      {/* Timestamp revealed on hover (in avatar column space) */}
      <div className="flex w-10 shrink-0 items-center justify-end">
        <span className="text-[10px] text-white/0 transition-colors group-hover/msg:text-white/30">
          {formatTime(timestamp)}
        </span>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default MessageGroup;
