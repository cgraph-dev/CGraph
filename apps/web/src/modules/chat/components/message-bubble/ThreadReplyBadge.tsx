/**
 * Thread Reply Badge
 *
 * Shows thread reply count badge below a message.
 * Opens ThreadPanel on click.
 */

import { motion } from 'framer-motion';
import { useThreadStore } from '@/modules/chat/store/threadStore';
import type { Message } from '@/modules/chat/store';

interface ThreadReplyBadgeProps {
  messageId: string;
  conversationId: string;
  message: Message;
}

export function ThreadReplyBadge({ messageId, conversationId, message }: ThreadReplyBadgeProps) {
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
