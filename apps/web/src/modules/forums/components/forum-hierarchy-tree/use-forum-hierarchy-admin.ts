/**
 * Custom hook for ForumHierarchyAdmin state and callbacks
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { useState, useCallback } from 'react';
import { toast } from '@/shared/components/ui';
import { api } from '@/lib/api';
import type { ForumNode } from './types';

export interface CreateSubforumForm {
  name: string;
  description: string;
  forum_type: 'category' | 'forum' | 'link';
  is_public: boolean;
}

export const initialForm: CreateSubforumForm = {
  name: '',
  description: '',
  forum_type: 'forum',
  is_public: true,
};

export interface ForumHierarchyAdminState {
  selectedParent: ForumNode | null;
  setSelectedParent: (node: ForumNode | null) => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showMoveModal: boolean;
  setShowMoveModal: (show: boolean) => void;
  movingForum: ForumNode | null;
  setMovingForum: (node: ForumNode | null) => void;
  reorderParent: ForumNode | null;
  setReorderParent: (node: ForumNode | null) => void;
  form: CreateSubforumForm;
  setForm: React.Dispatch<React.SetStateAction<CreateSubforumForm>>;
  saving: boolean;
  handleCreate: () => Promise<void>;
  handleMove: (targetParentId: string) => Promise<void>;
  handleReorder: (parentId: string, childIds: string[]) => Promise<void>;
  handleMoveDirection: (
    forumId: string,
    parentNode: ForumNode,
    direction: 'up' | 'down'
  ) => Promise<void>;
}

/**
 * unknown for the forums module.
 */
/**
 * flatten Tree for the forums module.
 *
 * @param nodes - The nodes.
 * @param depth - The depth.
 */
export function flattenTree(nodes: ForumNode[], depth = 0): { node: ForumNode; depth: number }[] {
  return nodes.flatMap((n) => [
    { node: n, depth },
    ...(n.children ? flattenTree(n.children, depth + 1) : []),
  ]);
}

/**
 * unknown for the forums module.
 */
/**
 * Hook for managing forum hierarchy admin.
 *
 * @param onRefresh - The on refresh.
 * @returns The result.
 */
export function useForumHierarchyAdmin(onRefresh: () => void): ForumHierarchyAdminState {
  const [selectedParent, setSelectedParent] = useState<ForumNode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingForum, setMovingForum] = useState<ForumNode | null>(null);
  const [reorderParent, setReorderParent] = useState<ForumNode | null>(null);
  const [form, setForm] = useState<CreateSubforumForm>(initialForm);
  const [saving, setSaving] = useState(false);

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

  const handleReorder = useCallback(
    async (_parentId: string, childIds: string[]) => {
      try {
        await Promise.all(
          childIds.map((forumId, index) =>
            api.put(`/api/v1/forums/${forumId}/reorder`, {
              position: index,
            })
          )
        );
        toast.success('Order saved');
        onRefresh();
      } catch {
        toast.error('Failed to save order');
      }
    },
    [onRefresh]
  );

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

  return {
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
  };
}
