/**
 * NewChatModal component
 * @module modules/chat/components/conversation-list
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useChatStore } from '@/modules/chat/store';
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { getAvatarBorderId } from '@/lib/utils';
import type { NewChatModalProps, MockUser } from './types';

const logger = createLogger('NewChatModal');

/**
 * unknown for the chat module.
 */
/**
 * New Chat Modal dialog component.
 */
export function NewChatModal({ onClose }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [_isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { createConversation } = useChatStore();

  // Search users from API with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.get('/api/v1/users/search', {
          params: { q: searchQuery, limit: 20 },
        });
        const results = response.data?.users || response.data?.data || [];
        setUsers(
          results.map((u: Record<string, unknown>) => ({
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            id: u.id as string,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            username: (u.username as string) || '',
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            displayName: (u.display_name as string) || (u.username as string) || '',
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            avatarUrl: (u.avatar_url as string) || null,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            status: (u.status as 'online' | 'offline') || 'offline',
          }))
        );
      } catch (error) {
        logger.error('Failed to search users:', error);
        setUsers([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const filteredUsers = users;

  const handleStartChat = async () => {
    if (selectedUsers.length === 0) return;
    setIsStarting(true);
    try {
      const conversation = await createConversation(selectedUsers);
      HapticFeedback.success();
      onClose();
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      logger.error('Failed to create conversation:', error);
      HapticFeedback.error();
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="crystal" glow className="p-6">
          <h2 className="mb-4 text-xl font-bold text-white">New Conversation</h2>

          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-4 text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedUsers.map((userId) => {
                const user = users.find((u) => u.id === userId);
                if (!user) return null;
                return (
                  <motion.div
                    key={userId}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 rounded-full bg-primary-600/20 px-2 py-1 text-sm text-primary-400"
                  >
                    <span>{user.displayName}</span>
                    <button
                      onClick={() => setSelectedUsers((prev) => prev.filter((id) => id !== userId))}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* User List */}
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {filteredUsers.map((user) => (
              <motion.button
                key={user.id}
                whileHover={{ x: 2 }}
                onClick={() => {
                  setSelectedUsers((prev) =>
                    prev.includes(user.id)
                      ? prev.filter((id) => id !== user.id)
                      : [...prev, user.id]
                  );
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  selectedUsers.includes(user.id) ? 'bg-primary-600/20' : 'hover:bg-white/[0.08]'
                }`}
              >
                <div className="relative">
                  <ThemedAvatar
                    src={user.avatarUrl}
                    alt={user.displayName}
                    size="small"
                    avatarBorderId={getAvatarBorderId(user)}
                  />
                  {user.status === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-dark-900 bg-green-500" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-white">{user.displayName}</p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
                {selectedUsers.includes(user.id) && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600">
                    <span className="text-xs text-white">✓</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/[0.06] py-2 text-gray-300 hover:bg-white/[0.10]"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartChat}
              disabled={selectedUsers.length === 0 || isStarting}
              className="flex-1 rounded-xl bg-primary-600 py-2 font-semibold text-white disabled:opacity-50"
            >
              {isStarting
                ? 'Creating...'
                : selectedUsers.length > 1
                  ? 'Create Group'
                  : 'Start Chat'}
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
