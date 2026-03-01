/**
 * Group Permissions Matrix
 *
 * Matrix grid: rows = groups, columns = 30+ permissions.
 * Categories: Content, Moderation, Admin.
 * Checkbox toggles with "Save All" button and diff highlighting.
 *
 * @module modules/forums/components/user-groups/group-permissions-matrix
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useUserGroupsStore } from '../../store/forumStore.userGroups';

// ── Permission definitions ───────────────────────────────────────────────

interface PermDef {
  key: string;
  label: string;
  category: 'Content' | 'Moderation' | 'Admin';
}

const PERMISSION_DEFS: PermDef[] = [
  // Content
  { key: 'can_view_forum', label: 'View Forum', category: 'Content' },
  { key: 'can_view_boards', label: 'View Boards', category: 'Content' },
  { key: 'can_view_threads', label: 'View Threads', category: 'Content' },
  { key: 'can_post_threads', label: 'Post Threads', category: 'Content' },
  { key: 'can_post_replies', label: 'Post Replies', category: 'Content' },
  { key: 'can_edit_own_posts', label: 'Edit Own', category: 'Content' },
  { key: 'can_delete_own_posts', label: 'Delete Own', category: 'Content' },
  { key: 'can_upload_attachments', label: 'Attachments', category: 'Content' },
  { key: 'can_use_bbcode', label: 'BBCode', category: 'Content' },
  { key: 'can_use_smilies', label: 'Smilies', category: 'Content' },
  { key: 'can_create_polls', label: 'Create Polls', category: 'Content' },
  { key: 'can_vote_polls', label: 'Vote Polls', category: 'Content' },
  { key: 'can_rate_threads', label: 'Rate Threads', category: 'Content' },
  { key: 'can_use_reputation', label: 'Reputation', category: 'Content' },
  { key: 'can_send_pm', label: 'Send PM', category: 'Content' },
  // Moderation
  { key: 'can_moderate', label: 'Moderate', category: 'Moderation' },
  { key: 'can_edit_posts', label: 'Edit Any', category: 'Moderation' },
  { key: 'can_delete_posts', label: 'Delete Any', category: 'Moderation' },
  { key: 'can_lock_threads', label: 'Lock', category: 'Moderation' },
  { key: 'can_move_threads', label: 'Move', category: 'Moderation' },
  { key: 'can_split_threads', label: 'Split', category: 'Moderation' },
  { key: 'can_merge_threads', label: 'Merge', category: 'Moderation' },
  { key: 'can_approve_posts', label: 'Approve', category: 'Moderation' },
  { key: 'can_warn_users', label: 'Warn', category: 'Moderation' },
  { key: 'can_ban_users', label: 'Ban', category: 'Moderation' },
  { key: 'can_view_logs', label: 'View Logs', category: 'Moderation' },
  { key: 'can_manage_reports', label: 'Reports', category: 'Moderation' },
  // Admin
  { key: 'can_manage_boards', label: 'Boards', category: 'Admin' },
  { key: 'can_manage_groups', label: 'Groups', category: 'Admin' },
  { key: 'can_manage_settings', label: 'Settings', category: 'Admin' },
  { key: 'can_manage_plugins', label: 'Plugins', category: 'Admin' },
  { key: 'can_manage_permissions', label: 'Permissions', category: 'Admin' },
];

const CATEGORIES = ['Content', 'Moderation', 'Admin'] as const;

interface GroupPermissionsMatrixProps {
  forumId: string;
}

type PermState = Record<string, Record<string, boolean>>;

export function GroupPermissionsMatrix({ forumId }: GroupPermissionsMatrixProps) {
  const { groups, fetchGroups, updateGroup, isLoadingGroups } = useUserGroupsStore();
  const [permState, setPermState] = useState<PermState>({});
  const [originalState, setOriginalState] = useState<PermState>({});
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Content');

  useEffect(() => {
    if (groups.length === 0) fetchGroups(forumId);
  }, [forumId, groups.length, fetchGroups]);

  // Build permission state from groups
  useEffect(() => {
    const state: PermState = {};
    for (const group of groups) {
      state[group.id] = {};
      for (const perm of PERMISSION_DEFS) {
        state[group.id]![perm.key] = !!group.permissions?.[perm.key];
      }
    }
    setPermState(state);
    setOriginalState(JSON.parse(JSON.stringify(state)));
  }, [groups]);

  const filteredPerms = useMemo(
    () => PERMISSION_DEFS.filter((p) => p.category === activeCategory),
    [activeCategory],
  );

  const hasDiffs = useMemo(() => {
    return JSON.stringify(permState) !== JSON.stringify(originalState);
  }, [permState, originalState]);

  const isDiff = useCallback(
    (groupId: string, permKey: string) => {
      return permState[groupId]?.[permKey] !== originalState[groupId]?.[permKey];
    },
    [permState, originalState],
  );

  const togglePerm = useCallback((groupId: string, permKey: string) => {
    setPermState((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [permKey]: !prev[groupId]?.[permKey],
      },
    }));
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const group of groups) {
        const groupPerms = permState[group.id];
        if (!groupPerms) continue;
        const origPerms = originalState[group.id];
        // Skip if no changes
        if (JSON.stringify(groupPerms) === JSON.stringify(origPerms)) continue;
        promises.push(
          updateGroup(forumId, group.id, { permissions: groupPerms }),
        );
      }
      await Promise.all(promises);
      setOriginalState(JSON.parse(JSON.stringify(permState)));
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingGroups && groups.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-green-500" />
          <h2 className="text-xl font-bold">Permissions Matrix</h2>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={!hasDiffs || saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
          Save All
          {hasDiffs && <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-800 rounded">changes</span>}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeCategory === cat
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {cat}
            <span className="ml-1 text-xs text-gray-500">
              ({PERMISSION_DEFS.filter((p) => p.category === cat).length})
            </span>
          </button>
        ))}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 font-medium text-gray-400 sticky left-0 bg-gray-900 z-10 min-w-[180px]">
                Group
              </th>
              {filteredPerms.map((perm) => (
                <th
                  key={perm.key}
                  className="py-3 px-2 font-medium text-gray-400 text-center min-w-[80px]"
                  title={perm.key}
                >
                  <span className="text-xs">{perm.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <motion.tr
                key={group.id}
                className="border-b border-gray-800 hover:bg-gray-800/50"
                layout
              >
                <td className="py-3 px-4 sticky left-0 bg-gray-900 z-10">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.color || '#6b7280' }}
                    />
                    <span className="font-medium text-white text-sm">{group.name}</span>
                    {group.isStaff && (
                      <ShieldCheckIcon className="h-3.5 w-3.5 text-yellow-500" />
                    )}
                  </div>
                </td>
                {filteredPerms.map((perm) => {
                  const checked = permState[group.id]?.[perm.key] ?? false;
                  const changed = isDiff(group.id, perm.key);
                  return (
                    <td key={perm.key} className="py-3 px-2 text-center">
                      <button
                        onClick={() => togglePerm(group.id, perm.key)}
                        className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                          changed
                            ? 'ring-2 ring-yellow-500'
                            : ''
                        } ${
                          checked
                            ? 'bg-green-600/30 text-green-400 hover:bg-green-600/40'
                            : 'bg-gray-700/50 text-gray-500 hover:bg-gray-700'
                        }`}
                        title={`${perm.label}: ${checked ? 'Allowed' : 'Denied'}`}
                      >
                        {checked ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <XMarkIcon className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No groups available. Create groups first to manage permissions.
        </div>
      )}
    </div>
  );
}

export default GroupPermissionsMatrix;
