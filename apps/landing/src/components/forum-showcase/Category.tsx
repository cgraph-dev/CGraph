/**
 * Category Component
 * Collapsible category with reorderable boards
 */

import { memo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { DraggableBoard } from './DraggableBoard';
import { ForumNeonIcon } from './ForumNeonIcon';
import type { CategoryProps } from './types';

export const Category = memo(function Category({
  category,
  onToggle,
  onReorderBoards,
  draggingBoardId,
}: CategoryProps) {
  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50"
    >
      <button
        className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-gray-800/50"
        onClick={onToggle}
      >
        <ForumNeonIcon variant={category.icon} className="h-6 w-6" />
        <span className="flex-1 text-left font-semibold text-white">{category.name}</span>
        <span className="text-sm text-gray-500">{category.boards.length} boards</span>
        <motion.svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: category.collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {!category.collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Reorder.Group
              axis="y"
              values={category.boards}
              onReorder={onReorderBoards}
              className="space-y-2 p-4 pt-0"
            >
              {category.boards.map((board) => (
                <DraggableBoard
                  key={board.id}
                  board={board}
                  isDragging={draggingBoardId === board.id}
                />
              ))}
            </Reorder.Group>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
