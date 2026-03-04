/**
 * User Group Manager
 *
 * Admin interface for managing forum user groups: list with drag-to-reorder,
 * create/edit/delete groups, default groups non-deletable.
 *
 * @module modules/forums/components/user-groups/user-group-manager
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, Reorder } from 'motion/react';
import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  StarIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useUserGroupsStore, type ForumUserGroupLocal, type CreateGroupData } from '../../store/forumStore.userGroups';

// ── Permission category definitions ──────────────────────────────────────

const PERMISSION_CATEGORIES = {
  Content: [
    'can_view_forum', 'can_view_boards', 'can_view_threads', 'can_post_threads',
    'can_post_replies', 'can_edit_own_posts', 'can_delete_own_posts',
    'can_upload_attachments', 'can_use_bbcode', 'can_use_smilies',
    'can_create_polls', 'can_vote_polls', 'can_rate_threads',
    'can_use_reputation', 'can_send_pm',
  ],
  Moderation: [
    'can_moderate', 'can_edit_posts', 'can_delete_posts', 'can_lock_threads',
    'can_move_threads', 'can_split_threads', 'can_merge_threads',
    'can_approve_posts', 'can_warn_users', 'can_ban_users',
    'can_view_logs', 'can_manage_reports',
  ],
  Admin: [
    'can_manage_boards', 'can_manage_groups', 'can_manage_settings',
    'can_manage_plugins', 'can_manage_permissions',
  ],
} as const;

interface UserGroupManagerProps {
  forumId: string;
}

export function UserGroupManager({ forumId }: UserGroupManagerProps) {
  const {
    groups,
    isLoadingGroups,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
  } = useUserGroupsStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ForumUserGroupLocal | null>(null);
  const [orderedGroups, setOrderedGroups] = useState<ForumUserGroupLocal[]>([]);

  useEffect(() => {
    fetchGroups(forumId);
  }, [forumId, fetchGroups]);

  useEffect(() => {
    setOrderedGroups(groups);
  }, [groups]);

  const handleReorder = useCallback(
    (newOrder: ForumUserGroupLocal[]) => {
      setOrderedGroups(newOrder);
      const ids = newOrder.map((g) => g.id);
      reorderGroups(forumId, ids).catch(() => setOrderedGroups(groups));
    },
    [forumId, groups, reorderGroups],
  );

  const handleDelete = useCallback(
    async (group: ForumUserGroupLocal) => {
      if (group.isDefault) return;
      if (!window.confirm(`Delete group "${group.name}"? This cannot be undone.`)) return;
      await deleteGroup(forumId, group.id);
    },
    [forumId, deleteGroup],
  );

  if (isLoadingGroups && groups.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold">User Groups</h2>
          <span className="text-sm text-gray-400">({groups.length} groups)</span>
        </div>
        <button
          onClick={() => { setEditingGroup(null); setShowCreateForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Create Group
        </button>
      </div>

      {/* Group List with Drag-to-Reorder */}
      <Reorder.Group
        axis="y"
        values={orderedGroups}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {orderedGroups.map((group) => (
          <Reorder.Item
            key={group.id}
            value={group}
            className="cursor-grab active:cursor-grabbing"
          >
            <motion.div
              layout
              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color || '#6b7280' }}
                />
                {/* Name and badges */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{group.name}</span>
                    {group.isDefault && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-900 text-blue-300 rounded">Default</span>
                    )}
                    {group.isStaff && (
                      <ShieldCheckIcon className="h-4 w-4 text-yellow-500" title="Staff" />
                    )}
                    {group.isSuperMod && (
                      <StarIcon className="h-4 w-4 text-purple-500" title="Super Mod" />
                    )}
                    {group.isHidden && (
                      <EyeSlashIcon className="h-4 w-4 text-gray-500" title="Hidden" />
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} · {group.type}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setShowCreateForm(true); }}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                {!group.isDefault && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(group); }}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {groups.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No user groups yet. Create your first group to get started.</p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <GroupForm
          forumId={forumId}
          group={editingGroup}
          onSave={async (data) => {
            if (editingGroup) {
              await updateGroup(forumId, editingGroup.id, data);
            } else {
              await createGroup(forumId, data);
            }
            setShowCreateForm(false);
            setEditingGroup(null);
          }}
          onClose={() => { setShowCreateForm(false); setEditingGroup(null); }}
        />
      )}
    </div>
  );
}

// ── Group Create/Edit Form ───────────────────────────────────────────────

interface GroupFormProps {
  forumId: string;
  group: ForumUserGroupLocal | null;
  onSave: (data: CreateGroupData) => Promise<void>;
  onClose: () => void;
}

function GroupForm({ group, onSave, onClose }: GroupFormProps) {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [color, setColor] = useState(group?.color || '#3b82f6');
  const [type, setType] = useState<CreateGroupData['type']>(group?.type || 'custom');
  const [isStaff, setIsStaff] = useState(group?.isStaff || false);
  const [permissions, setPermissions] = useState<Record<string, boolean | number>>(
    group?.permissions || {},
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined, color, type, isStaff, permissions });
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (key: string) => {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">{group ? 'Edit Group' : 'Create Group'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CreateGroupData['type'])}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
              >
                <option value="custom">Custom</option>
                <option value="joinable">Joinable</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded cursor-pointer" />
            </div>
            <label className="flex items-center gap-2 mt-5">
              <input type="checkbox" checked={isStaff} onChange={(e) => setIsStaff(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-300">Staff group</span>
            </label>
          </div>

          {/* Permissions */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Permissions</h4>
            {Object.entries(PERMISSION_CATEGORIES).map(([cat, perms]) => (
              <div key={cat} className="mb-4">
                <h5 className="text-xs font-medium text-gray-400 uppercase mb-2">{cat}</h5>
                <div className="grid grid-cols-3 gap-2">
                  {perms.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={!!permissions[perm]}
                        onChange={() => togglePermission(perm)}
                        className="rounded"
                      />
                      {perm.replace(/^can_/, '').replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : group ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default UserGroupManager;
