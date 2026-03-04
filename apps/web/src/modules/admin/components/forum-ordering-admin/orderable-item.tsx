/**
 * OrderableItem component
 * @module modules/admin/components/forum-ordering-admin
 */

import { memo } from 'react';
import { motion, Reorder, useDragControls } from 'motion/react';
import {
  Bars3Icon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import type { OrderableItemProps } from './types';
import { ITEM_TYPE_ICONS, ITEM_TYPE_COLORS } from './constants';

export const OrderableItem = memo(function OrderableItem({
  item,
  isExpanded,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  depth = 0,
}: OrderableItemProps) {
  const dragControls = useDragControls();
  const Icon = ITEM_TYPE_ICONS[item.type];
  const hasChildren = item.children && item.children.length > 0;

  return (
    <Reorder.Item value={item} dragListener={false} dragControls={dragControls} className="mb-2">
      <motion.div
        layout
        className={`group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-white/[0.08] ${item.is_hidden ? 'opacity-50' : ''} `}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Drag handle */}
        <motion.div
          className="cursor-grab rounded p-1 hover:bg-gray-100 active:cursor-grabbing dark:hover:bg-white/[0.06]"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <Bars3Icon className="h-5 w-5 text-gray-400" />
        </motion.div>

        {/* Expand/collapse button for nested items */}
        {hasChildren ? (
          <button
            onClick={onToggleExpand}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Icon */}
        <div className={`rounded-lg p-2 ${ITEM_TYPE_COLORS[item.type]}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Name and info */}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-gray-900 dark:text-white">{item.name}</div>
          {item.description && (
            <div className="truncate text-sm text-gray-500 dark:text-gray-400">
              {item.description}
            </div>
          )}
        </div>

        {/* Order indicator */}
        <div className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-400 dark:bg-white/[0.06]">
          #{item.display_order + 1}
        </div>

        {/* Move buttons */}
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className={`rounded p-1.5 transition-colors ${
              canMoveUp
                ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]'
                : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
            }`}
            title="Move up"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className={`rounded p-1.5 transition-colors ${
              canMoveDown
                ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]'
                : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
            }`}
            title="Move down"
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </Reorder.Item>
  );
});
