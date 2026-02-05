/**
 * DiscoverTab Component
 * Search and discover users, forums, and groups
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { getSearchResultIcon } from './utils';
import type { DiscoverTabProps } from './types';

export function DiscoverTab({ searchQuery, searchResults, onSearchChange }: DiscoverTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search users, forums, and groups..."
          className="w-full rounded-lg border border-white/10 bg-white/5 py-4 pl-14 pr-4 text-lg text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          autoFocus
        />
      </div>

      {/* Search Results */}
      {searchQuery.length === 0 ? (
        <GlassCard variant="frosted" className="p-12 text-center">
          <MagnifyingGlassIcon className="mx-auto mb-4 h-16 w-16 text-white/40" />
          <h3 className="mb-2 text-xl font-bold text-white">Discover CGraph</h3>
          <p className="text-white/60">Search for users, forums, and groups to connect with</p>
        </GlassCard>
      ) : searchResults.length === 0 ? (
        <GlassCard variant="frosted" className="p-8 text-center">
          <p className="text-white/60">No results found for "{searchQuery}"</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          <h3 className="mb-3 text-lg font-bold text-white">{searchResults.length} Results</h3>
          {searchResults.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <GlassCard
                variant="crystal"
                className="cursor-pointer p-4 transition-transform hover:scale-[1.01]"
                onClick={() => {
                  if (result.type === 'user') {
                    navigate(`/user/${result.id}`);
                  } else if (result.type === 'forum') {
                    navigate(`/forums/${result.id}`);
                  } else if (result.type === 'group') {
                    navigate(`/groups/${result.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 text-3xl">{getSearchResultIcon(result.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{result.name}</h4>
                    <p className="text-sm text-white/60">{result.description}</p>
                    {result.memberCount && (
                      <p className="mt-1 text-xs text-white/40">
                        {result.memberCount.toLocaleString()} members
                      </p>
                    )}
                  </div>
                  {result.type !== 'user' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        HapticFeedback.medium();
                      }}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        result.isJoined
                          ? 'bg-white/10 text-white hover:bg-white/20'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {result.isJoined ? 'Joined' : 'Join'}
                    </motion.button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
