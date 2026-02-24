/** ForumCategoryCard — displays a forum category with topic/post counts and description. */
import { motion } from 'framer-motion';
import { FolderIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ForumCategory } from '@/modules/forums/store';

interface ForumCategoryCardProps {
  category: ForumCategory;
  index: number;
  primaryColor: string;
  onCategoryClick?: (category: ForumCategory) => void;
}

/**
 * Card-variant rendering of a single forum category.
 */
export function ForumCategoryCard({
  category,
  index,
  primaryColor,
  onCategoryClick,
}: ForumCategoryCardProps) {
  return (
    <motion.div
      key={category.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard
        variant="frosted"
        className="cursor-pointer p-6 transition-transform hover:scale-[1.02]"
        onClick={() => onCategoryClick?.(category)}
      >
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: category.color ? `${category.color}20` : `${primaryColor}20` }}
        >
          <FolderIcon className="h-8 w-8" style={{ color: category.color || primaryColor }} />
        </div>
        <h3 className="mb-1 text-lg font-semibold">{category.name}</h3>
        {category.description && (
          <p className="mb-3 line-clamp-2 text-sm text-gray-400">{category.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <DocumentTextIcon className="h-4 w-4" />
            {category.postCount} posts
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
}
