/**
 * Forum Hierarchy Admin Panel
 *
 * Discord/Meta-style admin interface for managing forum hierarchy:
 * - Create subforums under any parent
 * - Move forums between parents (drag-and-drop ready)
 * - Reorder forums within a level
 *
 * Uses the existing backend endpoints:
 *   POST /api/v1/forums/:id/create_subforum
 *   PUT  /api/v1/forums/:id/move
 *   PUT  /api/v1/forums/:id/reorder
 *
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { AnimatePresence } from 'framer-motion';
import { FolderPlusIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ForumNode } from './types';
import { useForumHierarchyAdmin } from './use-forum-hierarchy-admin';
import { AdminNodeList } from './forum-admin-node-list';
import { CreateSubforumModal } from './forum-create-subforum-modal';
import { MoveModal } from './forum-move-modal';
import { ReorderModal } from './forum-reorder-modal';

interface ForumHierarchyAdminProps {
  tree: ForumNode[];
  onRefresh: () => void;
}

export function ForumHierarchyAdmin({ tree, onRefresh }: ForumHierarchyAdminProps) {
  const {
    selectedParent,
    setSelectedParent,
    showCreateModal,
    setShowCreateModal,
    showMoveModal,
    setShowMoveModal,
    movingForum,
    setMovingForum,
    reorderParent,
    setReorderParent,
    form,
    setForm,
    saving,
    handleCreate,
    handleMove,
    handleReorder,
    handleMoveDirection,
  } = useForumHierarchyAdmin(onRefresh);

  return (
    <div className="space-y-4">
      {/* Admin Toolbar */}
      <GlassCard variant="default" className="flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm font-medium text-gray-300">Hierarchy Admin</span>
        <div className="h-4 w-px bg-white/10" />

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-500"
        >
          <FolderPlusIcon className="h-4 w-4" />
          Create Subforum
        </button>
      </GlassCard>

      {/* Per-Node Admin Actions (rendered inline with tree items) */}
      <AdminNodeList
        nodes={tree}
        depth={0}
        onCreateUnder={(node) => {
          setSelectedParent(node);
          setShowCreateModal(true);
        }}
        onMove={(node) => {
          setMovingForum(node);
          setShowMoveModal(true);
        }}
        onReorder={(parent) => setReorderParent(parent)}
        onMoveDirection={handleMoveDirection}
      />

      {/* ----- Create Modal ----- */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateSubforumModal
            tree={tree}
            selectedParent={selectedParent}
            onSelectParent={setSelectedParent}
            form={form}
            onFormChange={setForm}
            saving={saving}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>

      {/* ----- Move Modal ----- */}
      <AnimatePresence>
        {showMoveModal && movingForum && (
          <MoveModal
            tree={tree}
            movingForum={movingForum}
            saving={saving}
            onClose={() => {
              setShowMoveModal(false);
              setMovingForum(null);
            }}
            onMove={handleMove}
          />
        )}
      </AnimatePresence>

      {/* ----- Reorder Modal ----- */}
      <AnimatePresence>
        {reorderParent && reorderParent.children && (
          <ReorderModal
            parent={reorderParent}
            onClose={() => setReorderParent(null)}
            onSave={handleReorder}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
