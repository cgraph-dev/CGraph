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
 * @module modules/admin/components/forum-ordering-admin
 */

import React, { memo } from 'react';
import { Reorder, AnimatePresence, motion } from 'motion/react';
import type { ForumOrderingAdminProps } from './types';
import { useForumOrdering } from './useForumOrdering';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { OrderableItem } from './orderable-item';
import { OrderingToolbar } from './ordering-toolbar';
import { LoadingState } from './loading-state';
import { EmptyState } from './empty-state';
import { HelpText } from './help-text';

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
  const {
    items,
    expandedIds,
    isSaving,
    hasChanges,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleReorder,
    handleMoveUp,
    handleMoveDown,
    toggleExpand,
    handleSave,
    handleReset,
  } = useForumOrdering({ initialItems, onOrderChange });

  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: handleSave,
  });

  if (isLoading) {
    return <LoadingState className={className} />;
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
      {items.length === 0 && <EmptyState itemType={itemType} />}

      {/* Help text */}
      <HelpText />
    </div>
  );
});

export default ForumOrderingAdmin;
