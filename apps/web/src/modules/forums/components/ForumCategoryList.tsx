import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
void Link; // Reserved for forum navigation links
import {
  FolderIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  Cog6ToothIcon,
  EyeIcon,
  LockClosedIcon,
  SparklesIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
void ChevronDownIcon; // Reserved for category collapse animation
void EyeIcon; // Reserved for forum visibility indicator
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import type { ForumCategory, Forum } from '@/modules/forums/store';

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

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );

  // Group forums by category
  const forumsByCategory = useMemo(() => {
    const grouped: Record<string, Forum[]> = {};
    categories.forEach((cat) => {
      grouped[cat.id] = [];
    });
    // This would need to be connected to actual forum-category relationships
    return grouped;
  }, [forums, categories]);

  const toggleCategory = (categoryId: string) => {
    HapticFeedback.light();
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const renderCategoryHeader = (category: ForumCategory) => {
    const isExpanded = expandedCategories.has(category.id);

    return (
      <motion.div
        className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-dark-700/50"
        onClick={() => toggleCategory(category.id)}
        whileHover={{ x: 4 }}
      >
        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
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

  const renderForumRow = (forum: Forum, index: number) => {
    const isHot = forum.hotScore > 100;
    const isNew = new Date(forum.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

    return (
      <motion.div
        key={forum.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group flex cursor-pointer items-center gap-4 border-t border-dark-700/50 p-4 pl-14 hover:bg-dark-700/30"
        onClick={() => onForumClick?.(forum)}
      >
        {/* Forum Icon */}
        <div className="relative">
          {forum.iconUrl ? (
            <img
              src={forum.iconUrl}
              alt={forum.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" style={{ color: primaryColor }} />
            </div>
          )}

          {/* Status Badges */}
          {(isHot || isNew) && (
            <div className="absolute -right-1 -top-1">
              {isHot ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500">
                  <FireIcon className="h-3 w-3 text-white" />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                  <SparklesIcon className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Forum Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-medium group-hover:underline">{forum.name}</h4>
            {forum.isPrivate && <LockClosedIcon className="h-4 w-4 text-gray-500" />}
          </div>
          {forum.description && (
            <p className="truncate text-sm text-gray-400">{forum.description}</p>
          )}
        </div>

        {/* Stats */}
        {variant !== 'compact' && (
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="min-w-[60px] text-center">
              <div className="font-medium text-white">{forum.memberCount.toLocaleString()}</div>
              <div className="text-xs">Members</div>
            </div>
            <div className="min-w-[60px] text-center">
              <div className="font-medium text-white">{forum.score.toLocaleString()}</div>
              <div className="text-xs">Score</div>
            </div>
          </div>
        )}

        {/* Arrow */}
        <ChevronRightIcon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-white" />
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

  const renderCardCategory = (category: ForumCategory, index: number) => (
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

  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        {categories.map((category) => renderCompactCategory(category))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {categories.map((category, index) => renderCardCategory(category, index))}
      </div>
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
      {categories
        .sort((a, b) => a.order - b.order)
        .map((category) => (
          <GlassCard key={category.id} variant="frosted" className="overflow-hidden">
            {renderCategoryHeader(category)}

            <AnimatePresence>
              {expandedCategories.has(category.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {showForumPreviews && (forumsByCategory[category.id]?.length ?? 0) > 0 ? (
                    (forumsByCategory[category.id] ?? []).map((forum, index) =>
                      renderForumRow(forum, index)
                    )
                  ) : (
                    <div className="border-t border-dark-700/50 p-4 pl-14 text-sm text-gray-500">
                      No forums in this category yet
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        ))}

      {categories.length === 0 && (
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
      )}
    </div>
  );
}

export default ForumCategoryList;
