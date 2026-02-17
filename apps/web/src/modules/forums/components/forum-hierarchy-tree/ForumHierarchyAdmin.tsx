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

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowsUpDownIcon,
  FolderPlusIcon,
  ArrowUturnUpIcon,
  XMarkIcon,
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { toast } from '@/shared/components/ui';
import { api } from '@/lib/api';
import type { ForumNode } from './types';

interface ForumHierarchyAdminProps {
  tree: ForumNode[];
  onRefresh: () => void;
}

interface CreateSubforumForm {
  name: string;
  description: string;
  forum_type: 'category' | 'forum' | 'link';
  is_public: boolean;
}

const initialForm: CreateSubforumForm = {
  name: '',
  description: '',
  forum_type: 'forum',
  is_public: true,
};

export function ForumHierarchyAdmin({ tree, onRefresh }: ForumHierarchyAdminProps) {
  const [selectedParent, setSelectedParent] = useState<ForumNode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingForum, setMovingForum] = useState<ForumNode | null>(null);
  const [reorderParent, setReorderParent] = useState<ForumNode | null>(null);
  const [form, setForm] = useState<CreateSubforumForm>(initialForm);
  const [saving, setSaving] = useState(false);

  // ----- Create Subforum -----
  const handleCreate = useCallback(async () => {
    if (!selectedParent || !form.name.trim()) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/forums/${selectedParent.id}/create_subforum`, {
        subforum: {
          name: form.name.trim(),
          description: form.description.trim(),
          forum_type: form.forum_type,
          is_public: form.is_public,
        },
      });
      toast.success(`Created "${form.name}" under ${selectedParent.name}`);
      setShowCreateModal(false);
      setForm(initialForm);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create subforum';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [selectedParent, form, onRefresh]);

  // ----- Move Forum -----
  const handleMove = useCallback(
    async (targetParentId: string) => {
      if (!movingForum) return;
      setSaving(true);
      try {
        await api.put(`/api/v1/forums/${movingForum.id}/move`, {
          new_parent_id: targetParentId,
        });
        toast.success(`Moved "${movingForum.name}" successfully`);
        setShowMoveModal(false);
        setMovingForum(null);
        onRefresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to move forum';
        toast.error(msg);
      } finally {
        setSaving(false);
      }
    },
    [movingForum, onRefresh]
  );

  // ----- Reorder -----
  const handleReorder = useCallback(
    async (parentId: string, childIds: string[]) => {
      try {
        await api.put(`/api/v1/forums/${parentId}/reorder`, {
          child_ids: childIds,
        });
        toast.success('Order saved');
        onRefresh();
      } catch {
        toast.error('Failed to save order');
      }
    },
    [onRefresh]
  );

  // ----- Move single forum up/down -----
  const handleMoveDirection = useCallback(
    async (forumId: string, parentNode: ForumNode, direction: 'up' | 'down') => {
      const children = parentNode.children ?? [];
      const idx = children.findIndex((c) => c.id === forumId);
      if (idx < 0) return;

      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= children.length) return;

      const reordered = [...children];
      const temp = reordered[idx]!;
      reordered[idx] = reordered[newIdx]!;
      reordered[newIdx] = temp;

      await handleReorder(
        parentNode.id,
        reordered.map((c) => c.id)
      );
    },
    [handleReorder]
  );

  // Flatten tree for parent selection
  const flattenTree = (nodes: ForumNode[], depth = 0): { node: ForumNode; depth: number }[] => {
    return nodes.flatMap((n) => [
      { node: n, depth },
      ...(n.children ? flattenTree(n.children, depth + 1) : []),
    ]);
  };
  // Available for drag-and-drop feature
  flattenTree(tree).filter((f) => f.node.forum_type === 'category' || f.node.children?.length);

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
          <Modal onClose={() => setShowCreateModal(false)} title="Create Subforum">
            {/* Parent selector */}
            <label className="mb-1 block text-sm text-gray-400">Parent Forum</label>
            <select
              value={selectedParent?.id ?? ''}
              onChange={(e) => {
                const found = flattenTree(tree).find((f) => f.node.id === e.target.value);
                setSelectedParent(found?.node ?? null);
              }}
              className="mb-4 w-full rounded-lg border border-white/10 bg-dark-700 px-3 py-2 text-sm text-white"
            >
              <option value="">Select parent…</option>
              {flattenTree(tree).map(({ node, depth }) => (
                <option key={node.id} value={node.id}>
                  {'—'.repeat(depth)} {node.name}
                </option>
              ))}
            </select>

            {/* Name */}
            <label className="mb-1 block text-sm text-gray-400">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. General Discussion"
              className="mb-4 w-full rounded-lg border border-white/10 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              autoFocus
            />

            {/* Description */}
            <label className="mb-1 block text-sm text-gray-400">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What is this subforum about?"
              rows={2}
              className="mb-4 w-full resize-none rounded-lg border border-white/10 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            />

            {/* Type */}
            <label className="mb-1 block text-sm text-gray-400">Type</label>
            <div className="mb-4 flex gap-2">
              {(['category', 'forum'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, forum_type: t }))}
                  className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                    form.forum_type === t
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-600 text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Public toggle */}
            <label className="mb-4 flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                className="rounded border-gray-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
              />
              Publicly visible
            </label>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.name.trim() || !selectedParent}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4" />
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ----- Move Modal ----- */}
      <AnimatePresence>
        {showMoveModal && movingForum && (
          <Modal
            onClose={() => {
              setShowMoveModal(false);
              setMovingForum(null);
            }}
            title={`Move "${movingForum.name}"`}
          >
            <p className="mb-4 text-sm text-gray-400">Select new parent:</p>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {flattenTree(tree)
                .filter((f) => f.node.id !== movingForum.id)
                .map(({ node, depth }) => (
                  <button
                    key={node.id}
                    onClick={() => handleMove(node.id)}
                    disabled={saving}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-white/5"
                    style={{ paddingLeft: `${depth * 16 + 12}px` }}
                  >
                    <ArrowUturnUpIcon className="h-3.5 w-3.5 text-gray-500" />
                    {node.name}
                  </button>
                ))}
            </div>
          </Modal>
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

/* ============================================================
 * Sub-components
 * ============================================================ */

function AdminNodeList({
  nodes,
  depth,
  onCreateUnder,
  onMove,
  onReorder,
  onMoveDirection,
}: {
  nodes: ForumNode[];
  depth: number;
  onCreateUnder: (node: ForumNode) => void;
  onMove: (node: ForumNode) => void;
  onReorder: (parent: ForumNode) => void;
  onMoveDirection: (id: string, parent: ForumNode, dir: 'up' | 'down') => void;
}) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <div key={node.id}>
          <GlassCard
            variant="default"
            className="flex items-center gap-3 px-4 py-2"
            style={{ marginLeft: `${depth * 20}px` }}
          >
            <span className="flex-1 truncate text-sm font-medium text-white">{node.name}</span>

            <span className="rounded bg-dark-600 px-2 py-0.5 text-xs capitalize text-gray-400">
              {node.forum_type}
            </span>

            <div className="flex items-center gap-1">
              <IconButton
                icon={<FolderPlusIcon className="h-3.5 w-3.5" />}
                title="Create subforum"
                onClick={() => onCreateUnder(node)}
              />
              <IconButton
                icon={<ArrowUturnUpIcon className="h-3.5 w-3.5" />}
                title="Move"
                onClick={() => onMove(node)}
              />
              {node.children && node.children.length > 1 && (
                <IconButton
                  icon={<ArrowsUpDownIcon className="h-3.5 w-3.5" />}
                  title="Reorder children"
                  onClick={() => onReorder(node)}
                />
              )}
            </div>
          </GlassCard>

          {node.children && node.children.length > 0 && (
            <AdminNodeList
              nodes={node.children}
              depth={depth + 1}
              onCreateUnder={onCreateUnder}
              onMove={onMove}
              onReorder={onReorder}
              onMoveDirection={onMoveDirection}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function IconButton({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      {icon}
    </button>
  );
}

function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-dark-800 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ReorderModal({
  parent,
  onClose,
  onSave,
}: {
  parent: ForumNode;
  onClose: () => void;
  onSave: (parentId: string, childIds: string[]) => void;
}) {
  const [items, setItems] = useState(parent.children ?? []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(
      parent.id,
      items.map((i) => i.id)
    );
    setSaving(false);
    onClose();
  };

  return (
    <Modal onClose={onClose} title={`Reorder "${parent.name}" children`}>
      <p className="mb-3 text-sm text-gray-400">Drag to reorder, or use arrows:</p>

      <div className="mb-4 max-h-64 space-y-1 overflow-y-auto">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg bg-dark-700 px-3 py-2">
            <span className="flex-1 text-sm text-white">{item.name}</span>
            <button
              disabled={idx === 0}
              onClick={() => {
                const next = [...items];
                const t = next[idx - 1]!;
                next[idx - 1] = next[idx]!;
                next[idx] = t;
                setItems(next);
              }}
              className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronUpIcon className="h-4 w-4" />
            </button>
            <button
              disabled={idx === items.length - 1}
              onClick={() => {
                const next = [...items];
                const t = next[idx]!;
                next[idx] = next[idx + 1]!;
                next[idx + 1] = t;
                setItems(next);
              }}
              className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Order'}
        </button>
      </div>
    </Modal>
  );
}
