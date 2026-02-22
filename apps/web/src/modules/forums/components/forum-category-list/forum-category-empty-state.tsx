import { motion } from 'framer-motion';
import { FolderIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';

interface ForumCategoryEmptyStateProps {
  primaryColor: string;
  canManage: boolean;
  onCreateCategory?: () => void;
}

/**
 * Empty state shown when there are no categories.
 */
export function ForumCategoryEmptyState({
  primaryColor,
  canManage,
  onCreateCategory,
}: ForumCategoryEmptyStateProps) {
  return (
    <GlassCard variant="frosted" className="p-8 text-center">
      <FolderIcon className="mx-auto mb-3 h-12 w-12 text-gray-500" />
      <p className="text-gray-400">No categories found</p>
      {canManage && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateCategory}
          className="mt-4 rounded-lg px-4 py-2 font-medium"
          style={{ backgroundColor: primaryColor }}
        >
          Create First Category
        </motion.button>
      )}
    </GlassCard>
  );
}
