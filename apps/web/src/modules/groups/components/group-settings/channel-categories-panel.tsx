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
import { motion, Reorder } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { asString, asNumber } from '@/lib/api-utils';
import { CreateCategoryForm } from './create-category-form';
import { CategoryListItem } from './category-list-item';
import type { Category } from './category-list-item';
import { DeleteCategoryModal } from './delete-category-modal';

interface ChannelCategoriesPanelProps {
  groupId: string;
}

/**
 * unknown for the groups module.
 */
/**
 * Channel Categories Panel component.
 */
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

      const countMap: Record<string, number> = {};
      for (const ch of channels) {
        const catId = asString(ch.category_id) || asString(ch.categoryId);
        if (catId) {
          countMap[catId] = (countMap[catId] ?? 0) + 1;
        }
      }

      setCategories(
        (Array.isArray(catData) ? catData : [])
          .map((c: Record<string, unknown>) => ({
            id: asString(c.id),
            name: asString(c.name),
            position: asNumber(c.position),
            isCollapsed: !!(c.is_collapsed ?? c.isCollapsed),
            channelCount: countMap[asString(c.id)] ?? 0,
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
    try {
      await Promise.all(
        newOrder.map((cat, idx) =>
          api.put(`/api/v1/groups/${groupId}/categories/${cat.id}`, {
            position: idx,
          })
        )
      );
    } catch {
      fetchCategories();
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
      <CreateCategoryForm
        show={showCreate}
        name={newName}
        onNameChange={setNewName}
        onSubmit={handleCreate}
        onClose={() => setShowCreate(false)}
      />

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
              <CategoryListItem
                category={category}
                index={index}
                totalCount={categories.length}
                isEditing={editingId === category.id}
                editName={editName}
                onEditNameChange={setEditName}
                onSave={handleUpdate}
                onCancelEdit={() => setEditingId(null)}
                onStartEdit={startEdit}
                onDeleteRequest={setDeleteConfirmId}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* Delete Confirmation */}
      <DeleteCategoryModal
        deleteConfirmId={deleteConfirmId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
