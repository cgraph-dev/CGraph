/**
 * Pagination controls for leaderboard
 * @module pages/leaderboard/sections
 */

import { motion } from 'motion/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import type { PaginationProps } from './types';

/**
 * unknown for the leaderboard module.
 */
/**
 * Pagination component.
 */
export function Pagination({ page, totalPages, onPageChange, currentCategory }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 border-t border-white/[0.06]/50 bg-[rgb(30,32,40)]/30 p-4">
      <motion.button
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        className="rounded-lg bg-white/[0.06] p-2 text-gray-400 transition-all hover:bg-white/[0.10] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <ChevronLeftIcon className="-ml-3 h-4 w-4" />
      </motion.button>
      <motion.button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-lg bg-white/[0.06] p-2 text-gray-400 transition-all hover:bg-white/[0.10] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </motion.button>

      <div className="flex items-center gap-1 px-2">
        {[...Array(Math.min(5, totalPages))].map((_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }

          return (
            <motion.button
              key={i}
              onClick={() => onPageChange(pageNum)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${
                page === pageNum
                  ? `bg-gradient-to-r ${currentCategory.gradient} text-white`
                  : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10] hover:text-white'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {pageNum}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg bg-white/[0.06] p-2 text-gray-400 transition-all hover:bg-white/[0.10] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </motion.button>
      <motion.button
        onClick={() => onPageChange(totalPages)}
        disabled={page >= totalPages}
        className="rounded-lg bg-white/[0.06] p-2 text-gray-400 transition-all hover:bg-white/[0.10] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRightIcon className="h-4 w-4" />
        <ChevronRightIcon className="-ml-3 h-4 w-4" />
      </motion.button>

      <span className="ml-2 hidden text-sm text-gray-500 sm:inline">
        of {totalPages.toLocaleString()} pages
      </span>
    </div>
  );
}
