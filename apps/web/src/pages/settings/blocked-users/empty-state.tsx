/**
 * Empty state shown when no blocked users match the current filter
 */

import { motion } from 'framer-motion';

interface EmptyStateProps {
  hasSearchQuery: boolean;
}

/**
 * unknown for the settings module.
 */
/**
 * Empty State — fallback UI for empty data states.
 */
export function EmptyState({ hasSearchQuery }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-16 text-center"
    >
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-dark-800 text-gray-500">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-white">
        {hasSearchQuery ? 'No users found' : 'No blocked users'}
      </h3>
      <p className="text-gray-400">
        {hasSearchQuery ? 'Try a different search term' : "You haven't blocked anyone yet"}
      </p>
    </motion.div>
  );
}
