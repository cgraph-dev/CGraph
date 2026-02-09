/**
 * ThreadReplyCount - Shows reply count badge on parent messages
 * Clicking opens the ThreadPanel side panel
 */

import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface ThreadReplyCountProps {
  replyCount: number;
  lastReplyAt?: string;
  onClick: () => void;
}

export function ThreadReplyCount({ replyCount, lastReplyAt, onClick }: ThreadReplyCountProps) {
  if (replyCount <= 0) return null;

  const timeAgo = lastReplyAt ? formatRelative(new Date(lastReplyAt)) : '';

  return (
    <button
      onClick={onClick}
      className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-primary-400 hover:bg-primary-500/10 hover:text-primary-300 transition-colors"
    >
      <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
      <span className="font-medium">
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      </span>
      {timeAgo && <span className="text-white/30">· {timeAgo}</span>}
    </button>
  );
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
