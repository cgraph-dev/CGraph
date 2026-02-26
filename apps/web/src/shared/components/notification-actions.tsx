/**
 * NotificationActions - Inline action buttons for notifications
 * Quick reply, accept/decline, join/ignore
 */

import { useState } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

interface NotificationActionsProps {
  type: 'friend_request' | 'message' | 'group_invite' | 'mention';
  notificationId: string;
  sourceId: string; // friend request ID, conversation ID, etc.
  onAction?: (action: string) => void;
}

/**
 * Notification Actions component.
 */
export function NotificationActions({
  type,
  notificationId,
  sourceId,
  onAction,
}: NotificationActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [replied, setReplied] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const handleAction = async (action: string, endpoint: string, method = 'POST', body?: object) => {
    setLoading(action);
    try {
      if (method === 'DELETE') {
        await api.delete(endpoint);
      } else if (method === 'PUT') {
        await api.put(endpoint, body);
      } else if (method === 'PATCH') {
        await api.patch(endpoint, body);
      } else {
        await api.post(endpoint, body);
      }
      onAction?.(action);
    } catch {
      // noop
    } finally {
      setLoading(null);
    }
  };

  if (type === 'friend_request') {
    return (
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => handleAction('accept', `/api/v1/friends/requests/${sourceId}/accept`)}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
        >
          <CheckIcon className="h-3.5 w-3.5" />
          {loading === 'accept' ? '...' : 'Accept'}
        </button>
        <button
          onClick={() => handleAction('decline', `/api/v1/friends/requests/${sourceId}/decline`)}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/20 disabled:opacity-50"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
          {loading === 'decline' ? '...' : 'Decline'}
        </button>
      </div>
    );
  }

  if (type === 'group_invite') {
    return (
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => handleAction('join', `/api/v1/groups/${sourceId}/join`)}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-500 disabled:opacity-50"
        >
          <UserPlusIcon className="h-3.5 w-3.5" />
          {loading === 'join' ? '...' : 'Join'}
        </button>
        <button
          onClick={() => handleAction('ignore', `/api/v1/notifications/${notificationId}/dismiss`)}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/20 disabled:opacity-50"
        >
          {loading === 'ignore' ? '...' : 'Ignore'}
        </button>
      </div>
    );
  }

  if (type === 'message' || type === 'mention') {
    return (
      <div className="mt-2">
        {showReply ? (
          <div className="flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Quick reply..."
              className="flex-1 rounded-lg border border-white/10 bg-dark-700 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && replyText.trim()) {
                  handleAction('reply', `/api/v1/conversations/${sourceId}/messages`, 'POST', {
                    content: replyText.trim(),
                  });
                  setReplied(true);
                  setShowReply(false);
                }
                if (e.key === 'Escape') setShowReply(false);
              }}
            />
          </div>
        ) : replied ? (
          <span className="text-xs text-green-400">Replied ✓</span>
        ) : (
          <button
            onClick={() => setShowReply(true)}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/20"
          >
            <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
            Quick Reply
          </button>
        )}
      </div>
    );
  }

  return null;
}
