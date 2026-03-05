/**
 * MessageActionsBar — floating toolbar on message hover, Discord-style.
 * @module chat/components/message-actions-bar
 */
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui';

interface MessageActionsBarProps {
  onReact?: () => void;
  onReply?: () => void;
  onThread?: () => void;
  onMore?: () => void;
  className?: string;
}

const ICON_SIZE = 18;

function SmileIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function ThreadIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

const actions = [
  { key: 'react', icon: <SmileIcon />, label: 'Add Reaction', handler: 'onReact' },
  { key: 'reply', icon: <ReplyIcon />, label: 'Reply', handler: 'onReply' },
  { key: 'thread', icon: <ThreadIcon />, label: 'Create Thread', handler: 'onThread' },
  { key: 'more', icon: <MoreIcon />, label: 'More', handler: 'onMore' },
] as const;

/**
 * MessageActionsBar — appears top-right of message on hover.
 */
export function MessageActionsBar({
  onReact,
  onReply,
  onThread,
  onMore,
  className,
}: MessageActionsBarProps) {
  const handlers: Record<string, (() => void) | undefined> = {
    onReact,
    onReply,
    onThread,
    onMore,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.1 }}
      className={cn(
        'absolute -top-3 right-2 z-10 flex items-center gap-0.5',
        'rounded-md border border-white/[0.08] bg-[rgb(18,18,24)]/90 backdrop-blur-md shadow-lg',
        'px-0.5 py-0.5',
        className,
      )}
    >
      {actions.map(({ key, icon, label, handler }) => (
        <Tooltip key={key} content={label} side="top">
          <button
            type="button"
            onClick={handlers[handler]}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded text-white/40',
              'transition-colors hover:bg-white/[0.08] hover:text-white/80',
            )}
          >
            {icon}
          </button>
        </Tooltip>
      ))}
    </motion.div>
  );
}

export default MessageActionsBar;
