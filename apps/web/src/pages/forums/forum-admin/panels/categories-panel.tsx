/**
 * Forum admin categories management panel.
 * @module
 */
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ForumCategory } from '@/modules/forums/store';

interface CategoriesPanelProps {
  categories: ForumCategory[];
  newCategoryName: string;
  editingCategory: string | null;
  onNewCategoryNameChange: (name: string) => void;
  onAddCategory: () => void;
  onEditCategory: (categoryId: string | null) => void;
  onUpdateCategory: (index: number, category: ForumCategory) => void;
  onRemoveCategory: (categoryId: string) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Categories Panel component.
 */
export function CategoriesPanel({
  categories,
  newCategoryName,
  editingCategory,
  onNewCategoryNameChange,
  onAddCategory,
  onEditCategory,
  onUpdateCategory,
  onRemoveCategory,
}: CategoriesPanelProps) {
  return (
    <motion.div
      key="categories"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Categories</h2>
        <p className="text-gray-400">Organize posts into categories/subforums.</p>
      </div>

      <GlassCard className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => onNewCategoryNameChange(e.target.value)}
            placeholder="New category name..."
            className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-4 py-2.5 text-white"
            onKeyDown={(e) => e.key === 'Enter' && onAddCategory()}
          />
          <motion.button
            onClick={onAddCategory}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-white hover:bg-primary-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-5 w-5" />
            Add
          </motion.button>
        </div>

        {categories.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <FolderIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No categories yet. Add one to organize your posts.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex items-center gap-3 rounded-lg bg-dark-700/50 p-3"
              >
                <div className="cursor-move text-gray-500">
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </div>
                <FolderIcon className="h-5 w-5 text-primary-400" />
                {editingCategory === category.id ? (
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => {
                      onUpdateCategory(index, { ...category, name: e.target.value });
                    }}
                    onBlur={() => onEditCategory(null)}
                    onKeyDown={(e) => e.key === 'Enter' && onEditCategory(null)}
                    className="flex-1 rounded border border-dark-500 bg-dark-600 px-2 py-1 text-white"
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-white">{category.name}</span>
                )}
                <span className="text-sm text-gray-500">{category.postCount || 0} posts</span>
                <button
                  onClick={() => onEditCategory(category.id)}
                  className="p-1 text-gray-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onRemoveCategory(category.id)}
                  className="p-1 text-gray-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
