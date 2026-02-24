/**
 * Forum category listing component.
 * @module
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: staggerConfigs.standard.staggerChildren },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};
void Link; // Reserved for forum navigation links
import {
  FolderIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  Cog6ToothIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
void ChevronDownIcon; // Reserved for category collapse animation
void EyeIcon; // Reserved for forum visibility indicator
import { GlassCard } from '@/shared/components/ui';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import type { ForumCategory, Forum } from '@/modules/forums/store';
import {
  useForumCategoryList,
  ForumRow,
  ForumCategoryCard,
  ForumCategoryEmptyState,
} from '@/modules/forums/components/forum-category-list/index';
import { tweens } from '@/lib/animation-presets';

/**
 * ForumCategoryList Component
 *
 * Displays forum categories with:
 * - Collapsible category sections
 * - Sub-category support
 * - Forum stats (posts, threads)
 * - Last post info
 * - Category icons and colors
 * - Admin controls for category management
 * - Visual hierarchy indicators
 */

interface ForumCategoryListProps {
  categories: ForumCategory[];
  forums?: Forum[];
  onCategoryClick?: (category: ForumCategory) => void;
  onForumClick?: (forum: Forum) => void;
  onCreateCategory?: () => void;
  onEditCategory?: (category: ForumCategory) => void;
  canManage?: boolean;
  showForumPreviews?: boolean;
  variant?: 'default' | 'compact' | 'cards';
  className?: string;
}

// Reserved for future forum preview feature
interface _ForumPreview {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  threadCount: number;
  postCount: number;
  lastPost?: {
    title: string;
    author: string;
    authorAvatarUrl: string | null;
    createdAt: string;
  };
  isPrivate: boolean;
  isNew?: boolean;
  isHot?: boolean;
}
void (0 as unknown as _ForumPreview); // Silence unused interface warning

export function ForumCategoryList({
  categories,
  forums = [],
  onCategoryClick,
  onForumClick,
  onCreateCategory,
  onEditCategory,
  canManage = false,
  showForumPreviews = true,
  variant = 'default',
  className = '',
}: ForumCategoryListProps) {
  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

  const { expandedCategories, forumsByCategory, toggleCategory } = useForumCategoryList(
    categories,
    forums
  );

  const renderCategoryHeader = (category: ForumCategory) => {
    const isExpanded = expandedCategories.has(category.id);

    return (
      <motion.div
        className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-dark-700/50"
        onClick={() => toggleCategory(category.id)}
        whileHover={{ x: 4 }}
      >
        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={tweens.fast}>
          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
        </motion.div>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: category.color ? `${category.color}20` : `${primaryColor}20` }}
        >
          <FolderIcon className="h-5 w-5" style={{ color: category.color || primaryColor }} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{category.name}</h3>
          {category.description && (
            <p className="truncate text-sm text-gray-400">{category.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <DocumentTextIcon className="h-4 w-4" />
            <span>{category.postCount.toLocaleString()}</span>
          </div>
        </div>

        {canManage && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onEditCategory?.(category);
            }}
            className="rounded-lg p-2 text-gray-400 hover:bg-dark-600 hover:text-white"
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </motion.button>
        )}
      </motion.div>
    );
  };

  const renderCompactCategory = (category: ForumCategory) => (
    <motion.button
      key={category.id}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onCategoryClick?.(category)}
      className="flex w-full items-center gap-3 rounded-lg bg-dark-700/50 p-3 text-left transition-colors hover:bg-dark-600/50"
    >
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: category.color ? `${category.color}20` : `${primaryColor}20` }}
      >
        <FolderIcon className="h-4 w-4" style={{ color: category.color || primaryColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate font-medium">{category.name}</span>
        <span className="text-xs text-gray-400">{category.postCount} posts</span>
      </div>
    </motion.button>
  );

  if (variant === 'compact') {
    return (
      <motion.div className={`space-y-2 ${className}`} variants={staggerContainer} initial="hidden" animate="show">
        {categories.map((category) => (
          <motion.div key={category.id} variants={staggerItem}>
            {renderCompactCategory(category)}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (variant === 'cards') {
    return (
      <motion.div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`} variants={staggerContainer} initial="hidden" animate="show">
        {categories.map((category, index) => (
          <motion.div key={category.id} variants={staggerItem}>
            <ForumCategoryCard
              category={category}
              index={index}
              primaryColor={primaryColor}
              onCategoryClick={onCategoryClick}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Create Category Button */}
      {canManage && onCreateCategory && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateCategory}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-600 p-4 text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
        >
          <PlusIcon className="h-5 w-5" />
          Create Category
        </motion.button>
      )}

      {/* Category List */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
      {categories
        .sort((a, b) => a.order - b.order)
        .map((category) => (
          <motion.div key={category.id} variants={staggerItem}>
          <GlassCard variant="frosted" className="overflow-hidden">
            {renderCategoryHeader(category)}

            <AnimatePresence>
              {expandedCategories.has(category.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {showForumPreviews && (forumsByCategory[category.id]?.length ?? 0) > 0 ? (
                    (forumsByCategory[category.id] ?? []).map((forum, index) => (
                      <ForumRow
                        key={forum.id}
                        forum={forum}
                        index={index}
                        primaryColor={primaryColor}
                        variant={variant}
                        onForumClick={onForumClick}
                      />
                    ))
                  ) : (
                    <div className="border-t border-dark-700/50 p-4 pl-14 text-sm text-gray-500">
                      No forums in this category yet
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {categories.length === 0 && (
        <ForumCategoryEmptyState
          primaryColor={primaryColor}
          canManage={canManage}
          onCreateCategory={onCreateCategory}
        />
      )}
    </div>
  );
}

export default ForumCategoryList;
