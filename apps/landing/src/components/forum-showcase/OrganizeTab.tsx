/**
 * OrganizeTab Component
 * Tab content for organizing forum boards
 */

import { motion, Reorder } from 'framer-motion';
import { Category } from './Category';
import type { ForumCategory, ForumBoard } from './types';

interface OrganizeTabProps {
  categories: ForumCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ForumCategory[]>>;
  toggleCategory: (categoryId: string) => void;
  reorderBoards: (categoryId: string, boards: ForumBoard[]) => void;
  draggingBoardId: string | null;
}

export function OrganizeTab({
  categories,
  setCategories,
  toggleCategory,
  reorderBoards,
  draggingBoardId,
}: OrganizeTabProps) {
  return (
    <motion.div
      key="organize"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <p className="mb-4 text-sm text-gray-400">
        👆 Try dragging boards to reorder them within categories
      </p>
      <Reorder.Group axis="y" values={categories} onReorder={setCategories} className="space-y-4">
        {categories.map((category) => (
          <Reorder.Item key={category.id} value={category} dragListener={false}>
            <Category
              category={category}
              onToggle={() => toggleCategory(category.id)}
              onReorderBoards={(boards) => reorderBoards(category.id, boards)}
              draggingBoardId={draggingBoardId}
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </motion.div>
  );
}
