/**
 * Forum Sidebar — Board categories with unread counts
 *
 * Features:
 * - Collapsible category sections
 * - Board: icon + name + unread count badge
 * - Active board highlight
 * - "Create Thread" button at top
 * - Board description on hover
 * - Search boards
 *
 * @module modules/forums/components/forum-sidebar
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router-dom';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { ScrollArea } from '@/components/ui/scroll-area';
import Tooltip from '@/components/ui/tooltip';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface Board {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  unreadCount?: number;
  threadCount?: number;
}

interface BoardCategory {
  id: string;
  name: string;
  boards: Board[];
}

interface ForumSidebarProps {
  categories?: BoardCategory[];
  activeBoardId?: string;
  onCreateThread?: () => void;
  className?: string;
}

// ── Board Item ─────────────────────────────────────────────────────────

function BoardItem({ board, isActive }: { board: Board; isActive: boolean }) {
  const content = (
    <NavLink to={`/forums/boards/${board.id}`} className="block">
      <motion.div
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
          isActive && 'bg-white/[0.08] text-white'
        )}
      >
        <span className="text-sm text-gray-500">{board.icon ?? '#'}</span>
        <span
          className={cn(
            'flex-1 truncate text-sm',
            isActive ? 'font-semibold text-white' : 'text-gray-400',
            (board.unreadCount ?? 0) > 0 && !isActive && 'font-medium text-gray-200'
          )}
        >
          {board.name}
        </span>
        {(board.unreadCount ?? 0) > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600/20 px-1.5 text-[10px] font-bold text-primary-400">
            {board.unreadCount}
          </span>
        )}
      </motion.div>
    </NavLink>
  );

  if (board.description) {
    return (
      <Tooltip content={board.description} side="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}

// ── Category Section ───────────────────────────────────────────────────

function CategorySection({
  category,
  activeBoardId,
}: {
  category: BoardCategory;
  activeBoardId?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="px-2">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="group flex w-full items-center py-1.5 text-left"
      >
        <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={springs.snappy}>
          <ChevronDownIcon className="mr-1 h-2.5 w-2.5 text-gray-600" />
        </motion.div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 group-hover:text-gray-400">
          {category.name}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.snappy}
            className="overflow-hidden"
          >
            {category.boards.map((board) => (
              <BoardItem key={board.id} board={board} isActive={board.id === activeBoardId} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

/** Description. */
/** Forum Sidebar component. */
export function ForumSidebar({
  categories = [],
  activeBoardId,
  onCreateThread,
  className,
}: ForumSidebarProps) {
  const [search, setSearch] = useState('');

  const filteredCategories = search
    ? categories
        .map((cat) => ({
          ...cat,
          boards: cat.boards.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())),
        }))
        .filter((cat) => cat.boards.length > 0)
    : categories;

  return (
    <div className={cn('flex h-full w-60 flex-col bg-[#2b2d31]', className)}>
      {/* Header */}
      <div className="border-b border-white/[0.06] p-3">
        <h2 className="mb-2 text-sm font-bold text-white">Forums</h2>

        {/* Create thread button */}
        {onCreateThread && (
          <motion.button
            onClick={onCreateThread}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-500"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Create Thread
          </motion.button>
        )}

        {/* Search */}
        <div className="relative mt-2">
          <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search boards..."
            className="w-full rounded-md bg-white/[0.04] py-1.5 pl-7 pr-2 text-xs text-gray-300 placeholder-gray-600 outline-none focus:bg-white/[0.06]"
          />
        </div>
      </div>

      {/* Board list */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 py-2">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <CategorySection key={cat.id} category={cat} activeBoardId={activeBoardId} />
            ))
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <ChatBubbleLeftRightIcon className="mb-2 h-8 w-8 text-gray-600" />
              <p className="text-xs text-gray-500">
                {search ? 'No boards match your search' : 'No boards yet'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ForumSidebar;
