/**
 * Forum Permissions Admin Panel
 *
 * Discord-style permission management for forums and boards.
 * Supports tri-state permissions (Inherit / Allow / Deny) with
 * visual indicators matching Discord's overwrite UI pattern.
 *
 * Backend endpoints:
 *   GET    /api/v1/forums/:id/permissions
 *   PUT    /api/v1/forums/:id/permissions
 *   DELETE /api/v1/forums/:id/permissions/:group_id
 *   GET    /api/v1/boards/:id/permissions
 *   PUT    /api/v1/boards/:id/permissions
 *   DELETE /api/v1/boards/:id/permissions/:group_id
 *
 * @module modules/forums/components
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
  MinusIcon,
  NoSymbolIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { GlassCard, toast } from '@/shared/components/ui';
import { api } from '@/lib/api';

/* ============================================================
 * Types
 * ============================================================ */

type PermValue = 'inherit' | 'allow' | 'deny';
type PermTarget = 'forum' | 'board';

interface PermissionOverwrite {
  id?: string;
  group_id: string;
  group_name: string;
  applies_to: string;
  permissions: Record<string, PermValue>;
}

interface GroupOption {
  id: string;
  name: string;
}

interface ForumPermissionsPanelProps {
  targetType: PermTarget;
  targetId: string;
  targetName: string;
  forumId?: string; // needed for board perms (parent forum)
  onClose?: () => void;
}

/* ============================================================
 * Permission definitions
 * ============================================================ */

const FORUM_PERMISSIONS = [
  { key: 'can_view', label: 'View Forum', category: 'General' },
  { key: 'can_view_boards', label: 'View Boards', category: 'General' },
  { key: 'can_create_threads', label: 'Create Threads', category: 'Posting' },
  { key: 'can_reply', label: 'Reply to Threads', category: 'Posting' },
  { key: 'can_manage_boards', label: 'Manage Boards', category: 'Admin' },
  { key: 'can_manage_groups', label: 'Manage Groups', category: 'Admin' },
  { key: 'can_manage_settings', label: 'Manage Settings', category: 'Admin' },
] as const;

const BOARD_PERMISSIONS = [
  { key: 'can_view', label: 'View Board', category: 'General' },
  { key: 'can_view_threads', label: 'View Threads', category: 'General' },
  { key: 'can_create_threads', label: 'Create Threads', category: 'Posting' },
  { key: 'can_reply', label: 'Reply', category: 'Posting' },
  { key: 'can_edit_own_posts', label: 'Edit Own Posts', category: 'Posting' },
  { key: 'can_delete_own_posts', label: 'Delete Own Posts', category: 'Posting' },
  { key: 'can_upload_attachments', label: 'Upload Attachments', category: 'Posting' },
  { key: 'can_create_polls', label: 'Create Polls', category: 'Posting' },
  { key: 'can_vote_polls', label: 'Vote in Polls', category: 'Posting' },
  { key: 'can_moderate', label: 'Moderate', category: 'Moderation' },
  { key: 'can_edit_posts', label: 'Edit Any Post', category: 'Moderation' },
  { key: 'can_delete_posts', label: 'Delete Any Post', category: 'Moderation' },
  { key: 'can_move_threads', label: 'Move Threads', category: 'Moderation' },
  { key: 'can_lock_threads', label: 'Lock Threads', category: 'Moderation' },
  { key: 'can_pin_threads', label: 'Pin Threads', category: 'Moderation' },
] as const;

/* ============================================================
 * Main Component
 * ============================================================ */

export function ForumPermissionsPanel({
  targetType,
  targetId,
  targetName,
  forumId,
  onClose,
}: ForumPermissionsPanelProps) {
  const [overwrites, setOverwrites] = useState<PermissionOverwrite[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const perms = targetType === 'forum' ? FORUM_PERMISSIONS : BOARD_PERMISSIONS;

  const basePath =
    targetType === 'forum'
      ? `/api/v1/forums/${targetId}/permissions`
      : `/api/v1/boards/${targetId}/permissions`;

  // ----- Fetch -----
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [permRes, groupRes] = await Promise.all([
          api.get(basePath),
          api
            .get(
              targetType === 'forum'
                ? `/api/v1/forums/${targetId}/members?limit=100`
                : `/api/v1/forums/${forumId}/members?limit=100`
            )
            .catch(() => ({ data: { data: [] } })),
        ]);

        const rawPerms = permRes.data?.data ?? permRes.data ?? [];
        setOverwrites(
          rawPerms.map((p: Record<string, unknown>) => ({
            id: p.id,
            group_id: p.group_id || p.user_group_id,
            group_name:
              p.group_name ||
              (p.user_group as Record<string, unknown>)?.name ||
              `Group ${p.group_id || p.user_group_id}`,
            applies_to: p.applies_to || 'group',
            permissions: extractPermissions(p, perms),
          }))
        );

        // Extract available groups from members or user_groups
        const availableGroups = (groupRes.data?.groups ?? groupRes.data?.data ?? []).map(
          (g: Record<string, unknown>) => ({
            id: String(g.id),
            name: String(g.name || g.username || g.id),
          })
        );
        setGroups(availableGroups);
      } catch {
        toast.error('Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, targetId, targetType, forumId]);

  // ----- Save -----
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      for (const ow of overwrites) {
        await api.put(basePath, {
          group_id: ow.group_id,
          applies_to: ow.applies_to,
          ...ow.permissions,
        });
      }
      toast.success('Permissions saved');
    } catch {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  }, [overwrites, basePath]);

  // ----- Delete -----
  const handleDelete = useCallback(
    async (groupId: string) => {
      try {
        await api.delete(`${basePath}/${groupId}`);
        setOverwrites((o) => o.filter((ow) => ow.group_id !== groupId));
        toast.success('Permission overwrite removed');
      } catch {
        toast.error('Failed to remove overwrite');
      }
    },
    [basePath]
  );

  // ----- Add -----
  const handleAdd = useCallback(() => {
    if (!selectedGroupId) return;
    const group = groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    const defaultPerms: Record<string, PermValue> = {};
    perms.forEach((p) => {
      defaultPerms[p.key] = 'inherit';
    });

    setOverwrites((o) => [
      ...o,
      {
        group_id: group.id,
        group_name: group.name,
        applies_to: 'group',
        permissions: defaultPerms,
      },
    ]);
    setShowAdd(false);
    setSelectedGroupId('');
  }, [selectedGroupId, groups, perms]);

  // ----- Cycle permission value -----
  const cyclePerm = useCallback((groupId: string, permKey: string) => {
    setOverwrites((owList) =>
      owList.map((ow) => {
        if (ow.group_id !== groupId) return ow;
        const current = ow.permissions[permKey] ?? 'inherit';
        const next: PermValue =
          current === 'inherit' ? 'allow' : current === 'allow' ? 'deny' : 'inherit';
        return {
          ...ow,
          permissions: { ...ow.permissions, [permKey]: next },
        };
      })
    );
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  // Group permissions by category
  const categories = [...new Set(perms.map((p) => p.category))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-primary-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">
              {targetType === 'forum' ? 'Forum' : 'Board'} Permissions
            </h2>
            <p className="text-sm text-gray-400">{targetName}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Add Group */}
      <GlassCard variant="default" className="p-4">
        {showAdd ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-dark-700 px-3 py-2 text-sm text-white"
            >
              <option value="">Select group…</option>
              {groups
                .filter((g) => !overwrites.some((ow) => ow.group_id === g.id))
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedGroupId}
              className="rounded-lg bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-500 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <PlusIcon className="h-4 w-4" />
            Add group overwrite
          </button>
        )}
      </GlassCard>

      {/* Permission Overwrites */}
      {overwrites.length === 0 ? (
        <GlassCard variant="default" className="p-8 text-center">
          <UserGroupIcon className="mx-auto mb-2 h-8 w-8 text-gray-500" />
          <p className="text-sm text-gray-400">No permission overwrites configured</p>
          <p className="mt-1 text-xs text-gray-500">
            All groups inherit default permissions from the parent
          </p>
        </GlassCard>
      ) : (
        overwrites.map((ow) => (
          <GlassCard key={ow.group_id} variant="default" className="overflow-hidden">
            {/* Group header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4 text-primary-400" />
                <span className="text-sm font-medium text-white">{ow.group_name}</span>
                <span className="rounded bg-dark-600 px-1.5 py-0.5 text-xs text-gray-400">
                  {ow.applies_to}
                </span>
              </div>
              <button
                onClick={() => handleDelete(ow.group_id)}
                className="rounded p-1 text-gray-500 hover:text-red-400"
                title="Remove overwrite"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Permissions by category */}
            <div className="divide-y divide-white/5">
              {categories.map((cat) => (
                <div key={cat} className="px-4 py-3">
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    {cat}
                  </h4>
                  <div className="space-y-1">
                    {perms
                      .filter((p) => p.category === cat)
                      .map((p) => {
                        const val = ow.permissions[p.key] ?? 'inherit';
                        return (
                          <div
                            key={p.key}
                            className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
                          >
                            <span className="text-sm text-gray-300">{p.label}</span>
                            <PermToggle value={val} onClick={() => cyclePerm(ow.group_id, p.key)} />
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        ))
      )}

      {/* Save */}
      {overwrites.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function PermToggle({ value, onClick }: { value: PermValue; onClick: () => void }) {
  const config = {
    inherit: {
      icon: MinusIcon,
      bg: 'bg-dark-600',
      text: 'text-gray-400',
      label: '—',
    },
    allow: {
      icon: CheckIcon,
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      label: '✓',
    },
    deny: {
      icon: NoSymbolIcon,
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      label: '✗',
    },
  }[value];

  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${config.bg} ${config.text} hover:opacity-80`}
      title={value.charAt(0).toUpperCase() + value.slice(1)}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/* ============================================================
 * Helpers
 * ============================================================ */

function extractPermissions(
  raw: Record<string, unknown>,
  permDefs: readonly { key: string }[]
): Record<string, PermValue> {
  const result: Record<string, PermValue> = {};
  for (const p of permDefs) {
    const val = raw[p.key];
    if (val === 'allow' || val === 'deny') {
      result[p.key] = val;
    } else {
      result[p.key] = 'inherit';
    }
  }
  return result;
}
