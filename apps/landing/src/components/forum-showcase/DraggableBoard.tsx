/**
 * DraggableBoard Component
 * Draggable forum board item with stats and actions
 */

import { memo } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import type { DraggableBoardProps } from './types';

export const DraggableBoard = memo(function DraggableBoard({
  board,
  isDragging,
}: DraggableBoardProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={board}
      id={board.id}
      dragListener={false}
      dragControls={dragControls}
      className={`group relative flex items-center gap-4 rounded-xl border bg-gray-800/50 p-4 transition-all ${
        isDragging
          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
          : 'border-gray-700/50 hover:border-gray-600'
      }`}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      layout
    >
      <motion.div
        className="cursor-grab touch-none text-gray-500 hover:text-gray-300 active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </motion.div>

      <div
        className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
        style={{ backgroundColor: `${board.color}20` }}
      >
        {board.icon}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate font-semibold text-white">{board.name}</h4>
        <p className="truncate text-sm text-gray-400">{board.description}</p>
      </div>

      <div className="hidden items-center gap-4 text-sm text-gray-500 sm:flex">
        <div className="text-center">
          <div className="font-medium text-white">{board.threads}</div>
          <div className="text-xs">threads</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-white">{board.posts}</div>
          <div className="text-xs">posts</div>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </Reorder.Item>
  );
});
