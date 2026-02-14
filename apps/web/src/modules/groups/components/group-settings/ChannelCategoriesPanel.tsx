/**
 * ChannelCategoriesPanel - Manage channel categories (folders)
 *
 * Category management: create, rename, reorder, delete.
 * Categories group channels in the sidebar for organization.
 * Uses /api/v1/groups/:group_id/categories
 *
 * @module modules/groups/components/group-settings
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  FolderIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  position: number;
  isCollapsed: boolean;
  channelCount: number;
}

interface ChannelCategoriesPanelProps {
  groupId: string;
}

export function ChannelCategoriesPanel({ groupId }: ChannelCategoriesPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, chanRes] = await Promise.all([
        api.get(`/api/v1/groups/${groupId}/categories`),
        api.get(`/api/v1/groups/${groupId}/channels`),
      ]);

      const catData = catRes.data?.data ?? catRes.data ?? [];
      const chanData = chanRes.data?.data ?? chanRes.data ?? [];
      const channels = Array.isArray(chanData) ? chanData : [];

      // Count channels per category
      const countMap: Record<string, number> = {};
      for (const ch of channels) {
        const catId = (ch.category_id ?? ch.categoryId) as string | null;
        if (catId) {
          countMap[catId] = (countMap[catId] ?? 0) + 1;
        }
      }

      setCategories(
        (Array.isArray(catData) ? catData : [])
          .map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: (c.name ?? '') as string,
            position: (c.position ?? 0) as number,
            isCollapsed: !!(c.is_collapsed ?? c.isCollapsed),
            channelCount: countMap[c.id as string] ?? 0,
          }))
          .sort((a: Category, b: Category) => a.position - b.position)
      );
    } catch {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post(`/api/v1/groups/${groupId}/categories`, {
        name: newName.trim(),
        position: categories.length,
      });
      setNewName('');
      setShowCreate(false);
      fetchCategories();
    } catch {
      // Handle error
    }
  };

  const handleUpdate = async (categoryId: string) => {
    if (!editName.trim()) return;
    try {
      await api.put(`/api/v1/groups/${groupId}/categories/${categoryId}`, {
        name: editName.trim(),
      });
      setEditingId(null);
      fetchCategories();
    } catch {
      // Handle error
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await api.delete(`/api/v1/groups/${groupId}/categories/${categoryId}`);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setDeleteConfirmId(null);
    } catch {
      // Handle error
    }
  };

  const handleReorder = async (newOrder: Category[]) => {
    setCategories(newOrder);
    // Persist new positions
    try {
      await Promise.all(
        newOrder.map((cat, idx) =>
          api.put(`/api/v1/groups/${groupId}/categories/${cat.id}`, {
            position: idx,
          })
        )
      );
    } catch {
      fetchCategories(); // Revert on error
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index]!, newOrder[index - 1]!];
    handleReorder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index >= categories.length - 1) return;
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1]!, newOrder[index]!];
    handleReorder(newOrder);
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Categories</h3>
          <p className="text-sm text-gray-400">Group channels into collapsible categories</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-dark-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-dark-600"
        >
          <PlusIcon className="h-4 w-4" />
          Add Category
        </motion.button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <GlassCard variant="frosted" className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">New Category</h4>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Category name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="w-full rounded-lg border border-gray-700 bg-dark-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  Create
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : categories.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-500">
          No categories. Channels will appear ungrouped.
        </div>
      ) : (
        <Reorder.Group axis="y" values={categories} onReorder={handleReorder} className="space-y-2">
          {categories.map((category, index) => (
            <Reorder.Item key={category.id} value={category}>
              <GlassCard variant="frosted" className="px-4 py-3">
                {editingId === category.id ? (
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-5 w-5 shrink-0 text-gray-400" />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(category.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 rounded border border-gray-700 bg-dark-800 px-2 py-1 text-sm text-white focus:border-primary-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(category.id)}
                      className="rounded px-2 py-1 text-xs text-primary-400 hover:bg-primary-500/10"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-dark-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium uppercase tracking-wider text-gray-300">
                        {category.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        {category.channelCount} channel
                        {category.channelCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white disabled:opacity-30"
                      >
                        <ChevronUpIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === categories.length - 1}
                        className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white disabled:opacity-30"
                      >
                        <ChevronDownIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => startEdit(category)}
                        className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(category.id)}
                        className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-red-400"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm space-y-4 rounded-xl border border-gray-700 bg-dark-900 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white">Delete Category</h3>
              <p className="text-sm text-gray-400">
                Channels in this category will become uncategorized. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
