/**
 * MentionAutocomplete component - user mention suggestions
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import type { MentionUser } from './types';

interface MentionAutocompleteProps {
  query: string;
  onSelect: (username: string) => void;
  onClose: () => void;
}

// Mock users for fallback
const MOCK_USERS = [
  { id: '1', username: 'alice', displayName: 'Alice' },
  { id: '2', username: 'bob', displayName: 'Bob' },
  { id: '3', username: 'charlie', displayName: 'Charlie' },
  { id: '4', username: 'david', displayName: 'David' },
  { id: '5', username: 'emma', displayName: 'Emma' },
];

export function MentionAutocomplete({
  query,
  onSelect,
  onClose: _onClose,
}: MentionAutocompleteProps) {
  void _onClose; // Reserved for dismissing on outside click

  const [users, setUsers] = useState<MentionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/v1/users/search', {
          params: { q: query, limit: 10 },
        });

        if (response.data?.users) {
          setUsers(
            response.data.users.map(
              (u: {
                id: string;
                username: string;
                display_name?: string;
                avatar_url?: string;
                avatar_border_id?: string;
                avatarBorderId?: string;
              }) => ({
                id: u.id,
                username: u.username,
                displayName: u.display_name || u.username,
                avatarUrl: u.avatar_url,
                avatarBorderId: u.avatar_border_id || u.avatarBorderId || null,
              })
            )
          );
        } else {
          // Fallback to mock data
          setUsers(filterMockUsers(query));
        }
      } catch {
        // Fallback to mock data on error
        setUsers(filterMockUsers(query));
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  if (users.length === 0 && !isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-2 max-h-40 overflow-y-auto rounded-xl border border-gray-700 bg-dark-800 p-2 shadow-xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent"
          />
        </div>
      ) : (
        users.map((user) => (
          <motion.button
            key={user.id}
            whileHover={{ x: 2 }}
            onClick={() => onSelect(user.username)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-dark-700"
          >
            {user.avatarUrl ? (
              <ThemedAvatar
                src={user.avatarUrl}
                alt={user.displayName}
                size="small"
                avatarBorderId={user.avatarBorderId ?? user.avatar_border_id ?? null}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600">
                <span className="text-sm font-bold text-white">{user.displayName[0]}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white">{user.displayName}</p>
              <p className="text-xs text-gray-400">@{user.username}</p>
            </div>
          </motion.button>
        ))
      )}
    </motion.div>
  );
}

function filterMockUsers(query: string): MentionUser[] {
  return MOCK_USERS.filter(
    (u) =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.displayName.toLowerCase().includes(query.toLowerCase())
  );
}
