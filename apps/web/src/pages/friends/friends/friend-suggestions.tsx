/**
 * FriendSuggestions - "People You May Know" card carousel
 * @module pages/friends
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlusIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { api } from '@/lib/api';

interface Suggestion {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  mutual_friends: number;
  shared_groups: number;
  score: number;
}

/**
 * unknown for the friends module.
 */
/**
 * Friend Suggestions component.
 */
export function FriendSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/api/v1/friends/suggestions', { params: { limit: 10 } });
      setSuggestions(res.data.data || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      await api.post('/api/v1/friends', { user_id: userId });
      setDismissed((prev) => new Set(prev).add(userId));
    } catch {
      // handled by api interceptor
    }
  };

  const handleDismiss = (userId: string) => {
    setDismissed((prev) => new Set(prev).add(userId));
  };

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (loading || visible.length === 0) return null;

  return (
    <GlassCard className="mb-6 p-4">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon className="h-5 w-5 text-primary-400" />
        <h3 className="text-sm font-semibold text-white">People You May Know</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        <AnimatePresence>
          {visible.map((suggestion) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: durations.normal.ms / 1000 } }}
              className="relative flex w-40 shrink-0 flex-col items-center rounded-xl bg-dark-800 p-4 ring-1 ring-gray-700/50"
            >
              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(suggestion.id)}
                className="absolute right-1.5 top-1.5 rounded-full p-1 text-gray-500 hover:bg-dark-700 hover:text-gray-300"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>

              {/* Avatar */}
              <div className="mb-2 h-14 w-14 overflow-hidden rounded-full bg-dark-600">
                {suggestion.avatar_url ? (
                  <img
                    src={suggestion.avatar_url}
                    alt={suggestion.display_name || suggestion.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                    {(suggestion.display_name || suggestion.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="mb-0.5 max-w-full truncate text-sm font-medium text-white">
                {suggestion.display_name || suggestion.username}
              </p>

              {/* Mutual info */}
              <p className="mb-3 text-xs text-gray-500">
                {suggestion.mutual_friends > 0 && (
                  <span>{suggestion.mutual_friends} mutual friend{suggestion.mutual_friends > 1 ? 's' : ''}</span>
                )}
                {suggestion.mutual_friends > 0 && suggestion.shared_groups > 0 && ' · '}
                {suggestion.shared_groups > 0 && (
                  <span>{suggestion.shared_groups} shared group{suggestion.shared_groups > 1 ? 's' : ''}</span>
                )}
              </p>

              {/* Add button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddFriend(suggestion.id)}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-500"
              >
                <UserPlusIcon className="h-3.5 w-3.5" />
                Add Friend
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
