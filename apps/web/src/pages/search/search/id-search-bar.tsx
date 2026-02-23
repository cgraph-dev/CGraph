/**
 * ID Search Bar
 *
 * Quick-lookup by entity ID (user, group, forum).
 *
 * @module pages/search/search/IdSearchBar
 */

import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { IdSearchType } from './types';

/** Props for IdSearchBar */
export interface IdSearchBarProps {
  /** Current entity type */
  idSearchType: IdSearchType;
  /** Set entity type */
  setIdSearchType: (type: IdSearchType) => void;
  /** Current ID value */
  idSearchValue: string;
  /** Set ID value */
  setIdSearchValue: (value: string) => void;
  /** Execute search */
  onSearch: () => void;
}

/** ID-based quick search bar */
export function IdSearchBar({
  idSearchType,
  setIdSearchType,
  idSearchValue,
  setIdSearchValue,
  onSearch,
}: IdSearchBarProps) {
  return (
    <div className="relative z-10 border-b border-primary-500/20 bg-dark-900/30 px-6 py-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <GlassCard variant="default" className="p-4">
          <div className="flex items-center gap-3">
            <select
              value={idSearchType}
              onChange={(e) => setIdSearchType(e.target.value as IdSearchType)} // safe downcast – select event value
              className="rounded-lg border border-primary-500/30 bg-dark-700/50 px-3 py-2 text-sm text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="user">User ID</option>
              <option value="group">Group ID</option>
              <option value="forum">Forum ID</option>
            </select>
            <input
              type="text"
              value={idSearchValue}
              onChange={(e) => setIdSearchValue(e.target.value)}
              placeholder={`Enter ${idSearchType} ID...`}
              className="flex-1 rounded-lg border border-primary-500/30 bg-dark-700/50 px-4 py-2 text-sm text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <motion.button
              onClick={onSearch}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-4 py-2 text-sm font-medium transition-all hover:from-primary-500 hover:to-purple-500"
              style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
            >
              Go
              <ArrowRightIcon className="h-4 w-4" />
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
