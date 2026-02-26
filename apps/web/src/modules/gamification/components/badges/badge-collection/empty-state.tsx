/**
 * EmptyState - displayed when no achievements match filters
 */

import { motion } from 'framer-motion';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  onClearFilters: () => void;
}

/**
 * unknown for the gamification module.
 */
/**
 * Empty State — fallback UI for empty data states.
 */
export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <motion.div className="py-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <QuestionMarkCircleIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
      <p className="text-gray-400">No achievements match your filters</p>
      <button
        className="mt-2 text-sm text-primary-400 hover:text-primary-300"
        onClick={onClearFilters}
      >
        Clear filters
      </button>
    </motion.div>
  );
}
