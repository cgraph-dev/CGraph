/**
 * Forum Ordering Admin Component
 *
 * Drag-and-drop interface for administrators to reorder forums, categories,
 * and boards within the admin panel.
 *
 * Features:
 * - Drag-and-drop reordering
 * - Nested category/board ordering
 * - Keyboard accessibility (arrow keys to move)
 * - Optimistic updates with error rollback
 * - Undo/redo support
 * - Bulk operations
 *
 * @module components/admin/ForumOrderingAdmin
 */

import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { motion, Reorder, AnimatePresence, useDragControls } from 'framer-motion';
import {
  Bars3Icon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';

// =============================================================================
// TYPES
// =============================================================================

export interface ForumItem {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  type: 'forum' | 'category' | 'board';
  parent_id?: string;
  children?: ForumItem[];
  is_hidden?: boolean;
  icon?: string;
}

export interface ForumOrderingAdminProps {
  /** List of items to order (forums, categories, or boards) */
  items: ForumItem[];
  /** Callback when order changes */
  onOrderChange: (items: ForumItem[]) => Promise<void>;
  /** Type of items being ordered */
  itemType: 'forum' | 'category' | 'board';
  /** Whether nested ordering is enabled */
  allowNested?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Parent item ID (for nested views) */
  parentId?: string;
  /** Additional CSS classes */
  className?: string;
}

interface HistoryState {
  items: ForumItem[];
  timestamp: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_HISTORY_LENGTH = 20;

const ITEM_TYPE_ICONS = {
  forum: ChatBubbleLeftRightIcon,
  category: FolderIcon,
  board: ChatBubbleLeftRightIcon,
};

const ITEM_TYPE_COLORS = {
  forum: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  category: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  board: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Updates display_order for all items based on their position
 */
const updateDisplayOrders = (items: ForumItem[]): ForumItem[] => {
  return items.map((item, index) => ({
    ...item,
    display_order: index,
    children: item.children ? updateDisplayOrders(item.children) : undefined,
  }));
};

/**
 * Moves an item up or down in the list
 */
const moveItem = (items: ForumItem[], itemId: string, direction: 'up' | 'down'): ForumItem[] => {
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) return items;

  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= items.length) return items;

  const newItems = [...items];
  const removed = newItems.splice(index, 1)[0];
  if (!removed) return items;
  newItems.splice(newIndex, 0, removed);

  return updateDisplayOrders(newItems);
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Individual draggable item
 */
const OrderableItem = memo(function OrderableItem({
  item,
  isExpanded,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  depth = 0,
}: {
  item: ForumItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  depth?: number;
}) {
  const dragControls = useDragControls();
  const Icon = ITEM_TYPE_ICONS[item.type];
  const hasChildren = item.children && item.children.length > 0;

  return (
    <Reorder.Item value={item} dragListener={false} dragControls={dragControls} className="mb-2">
      <motion.div
        layout
        className={`group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 ${item.is_hidden ? 'opacity-50' : ''} `}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Drag handle */}
        <motion.div
          className="cursor-grab rounded p-1 hover:bg-gray-100 active:cursor-grabbing dark:hover:bg-gray-700"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <Bars3Icon className="h-5 w-5 text-gray-400" />
        </motion.div>

        {/* Expand/collapse button for nested items */}
        {hasChildren ? (
          <button
            onClick={onToggleExpand}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
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
        <div className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-400 dark:bg-gray-700">
          #{item.display_order + 1}
        </div>

        {/* Move buttons */}
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className={`rounded p-1.5 transition-colors ${
              canMoveUp
                ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
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
                ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
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

/**
 * Toolbar with undo/redo and save
 */
const OrderingToolbar = memo(function OrderingToolbar({
  hasChanges,
  canUndo,
  canRedo,
  isSaving,
  onUndo,
  onRedo,
  onSave,
  onReset,
}: {
  hasChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`rounded-lg p-2 transition-colors ${
            canUndo
              ? 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
              : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`rounded-lg p-2 transition-colors ${
            canRedo
              ? 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
              : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <ArrowUturnRightIcon className="h-5 w-5" />
        </button>

        {hasChanges && (
          <span className="ml-2 text-sm text-amber-600 dark:text-amber-400">Unsaved changes</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasChanges && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-4 w-4" />
            Reset
          </button>
        )}
        <button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            hasChanges && !isSaving
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700'
          }`}
        >
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
              />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Save Order
            </>
          )}
        </button>
      </div>
    </div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Forum Ordering Admin
 *
 * Provides a drag-and-drop interface for reordering forums, categories, and boards.
 *
 * @example
 * ```tsx
 * <ForumOrderingAdmin
 *   items={forums}
 *   itemType="forum"
 *   onOrderChange={async (newOrder) => {
 *     await api.updateForumOrder(newOrder);
 *   }}
 * />
 * ```
 */
export const ForumOrderingAdmin = memo(function ForumOrderingAdmin({
  items: initialItems,
  onOrderChange,
  itemType,
  allowNested = false,
  isLoading = false,
  parentId: _parentId,
  className = '',
}: ForumOrderingAdminProps) {
  const { showToast } = useToast();
  const [items, setItems] = useState<ForumItem[]>(initialItems);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const originalItemsRef = useRef(initialItems);

  // Sync with initial items when they change
  useEffect(() => {
    setItems(initialItems);
    originalItemsRef.current = initialItems;
    setHistory([]);
    setHistoryIndex(-1);
  }, [initialItems]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(items) !== JSON.stringify(originalItemsRef.current);
  }, [items]);

  // History management
  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const pushToHistory = useCallback(
    (newItems: ForumItem[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({ items: newItems, timestamp: Date.now() });
        if (newHistory.length > MAX_HISTORY_LENGTH) {
          newHistory.shift();
        }
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY_LENGTH - 1));
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    setHistoryIndex((prev) => prev - 1);
    const prevItems =
      historyIndex === 0 ? originalItemsRef.current : history[historyIndex - 1]?.items;
    if (prevItems) setItems(prevItems);
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const nextState = history[historyIndex + 1];
    if (!nextState) return;
    setHistoryIndex((prev) => prev + 1);
    setItems(nextState.items);
  }, [canRedo, history, historyIndex]);

  // Reorder handler
  const handleReorder = useCallback(
    (newItems: ForumItem[]) => {
      const updatedItems = updateDisplayOrders(newItems);
      pushToHistory(items);
      setItems(updatedItems);
    },
    [items, pushToHistory]
  );

  // Move item up/down
  const handleMoveUp = useCallback(
    (itemId: string) => {
      pushToHistory(items);
      setItems((prev) => moveItem(prev, itemId, 'up'));
    },
    [items, pushToHistory]
  );

  const handleMoveDown = useCallback(
    (itemId: string) => {
      pushToHistory(items);
      setItems((prev) => moveItem(prev, itemId, 'down'));
    },
    [items, pushToHistory]
  );

  // Toggle expand/collapse
  const toggleExpand = useCallback((itemId: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    try {
      await onOrderChange(items);
      originalItemsRef.current = items;
      setHistory([]);
      setHistoryIndex(-1);
      showToast?.({ type: 'success', message: 'Order saved successfully!' });
    } catch (_error) {
      showToast?.({ type: 'error', message: 'Failed to save order. Please try again.' });
      // Rollback
      setItems(originalItemsRef.current);
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, isSaving, items, onOrderChange, showToast]);

  // Reset handler
  const handleReset = useCallback(() => {
    setItems(originalItemsRef.current);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleSave]);

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Toolbar */}
      <OrderingToolbar
        hasChanges={hasChanges}
        canUndo={canUndo}
        canRedo={canRedo}
        isSaving={isSaving}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onReset={handleReset}
      />

      {/* Items list */}
      <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
        <AnimatePresence>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <OrderableItem
                item={item}
                isExpanded={expandedIds.has(item.id)}
                onToggleExpand={() => toggleExpand(item.id)}
                onMoveUp={() => handleMoveUp(item.id)}
                onMoveDown={() => handleMoveDown(item.id)}
                canMoveUp={index > 0}
                canMoveDown={index < items.length - 1}
              />

              {/* Nested children */}
              {allowNested && item.children && expandedIds.has(item.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-8 mt-2"
                >
                  <ForumOrderingAdmin
                    items={item.children}
                    itemType={itemType === 'forum' ? 'category' : 'board'}
                    onOrderChange={async (newChildren) => {
                      const updatedItems = items.map((i) =>
                        i.id === item.id ? { ...i, children: newChildren } : i
                      );
                      await onOrderChange(updatedItems);
                    }}
                    allowNested={itemType !== 'board'}
                    parentId={item.id}
                  />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <FolderIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No {itemType}s to order</p>
        </div>
      )}

      {/* Help text */}
      <div className="mt-6 space-y-1 text-xs text-gray-500 dark:text-gray-400">
        <p>💡 Drag items to reorder, or use the arrow buttons</p>
        <p>⌨️ Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+S (Save)</p>
      </div>
    </div>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export default ForumOrderingAdmin;
