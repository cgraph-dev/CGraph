/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * Board Permissions Panel
 *
 * Board-level permission overrides with inherit/allow/deny radio buttons.
 * Groups × permissions grid with effective permission indicator.
 * "Reset to Inherit All" button.
 *
 * @module modules/forums/components/forum-permissions/board-permissions-panel
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  usePermissionsStore,
  type PermLevel,
  type BoardPermissionLocal,
} from '../../store/forumStore.permissions';
import { useUserGroupsStore } from '../../store/forumStore.userGroups';
import { BOARD_PERMISSIONS, type PermissionDef } from '../forum-permissions/types';

// ── Permission keys ──────────────────────────────────────────────────────

const PERM_KEYS = BOARD_PERMISSIONS.map((p) => p.key);
const PERM_BY_CATEGORY = BOARD_PERMISSIONS.reduce<Record<string, PermissionDef[]>>((acc, p) => {
  if (!acc[p.category]) acc[p.category] = [];
  acc[p.category]!.push(p);
  return acc;
}, {});

interface BoardPermissionsPanelProps {
  forumId: string;
  boardId: string;
  boardName?: string;
}

/** Description. */
/** Board Permissions Panel component. */
export function BoardPermissionsPanel({ forumId, boardId, boardName }: BoardPermissionsPanelProps) {
  const {
    boardPermissions,
    isLoadingBoardPerms,
    fetchBoardPermissions,
    updateBoardPermission,
    resetBoardPermissions,
  } = usePermissionsStore();

  const { groups, fetchGroups } = useUserGroupsStore();

  const [localPerms, setLocalPerms] = useState<Record<string, Record<string, PermLevel>>>({});
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchBoardPermissions(boardId);
    if (groups.length === 0) fetchGroups(forumId);
  }, [boardId, forumId, fetchBoardPermissions, fetchGroups, groups.length]);

  // Build local permission state from fetched data
  useEffect(() => {
    const state: Record<string, Record<string, PermLevel>> = {};
    for (const group of groups) {
      const perm = boardPermissions.find((p) => p.groupId === group.id);
      state[group.id] = {};
      for (const key of PERM_KEYS) {
        state[group.id]![key] = perm?.permissions?.[key] || 'inherit';
      }
    }
    setLocalPerms(state);
  }, [groups, boardPermissions]);

  const setPermValue = useCallback((groupId: string, permKey: string, value: PermLevel) => {
    setLocalPerms((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], [permKey]: value },
    }));
  }, []);

  const hasChanges = useMemo(() => {
    for (const group of groups) {
      const perm = boardPermissions.find((p) => p.groupId === group.id);
      for (const key of PERM_KEYS) {
        const local = localPerms[group.id]?.[key] || 'inherit';
        const saved = perm?.permissions[key] || 'inherit';
        if (local !== saved) return true;
      }
    }
    return false;
  }, [groups, boardPermissions, localPerms]);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const group of groups) {
        const perms = localPerms[group.id];
        if (!perms) continue;
        const perm = boardPermissions.find((p: BoardPermissionLocal) => p.groupId === group.id);
        // Check if anything changed
        const changed = PERM_KEYS.some(
          (k) => (perms[k] || 'inherit') !== (perm?.permissions[k] || 'inherit')
        );
        if (changed) {
          promises.push(updateBoardPermission(boardId, group.id, perms));
        }
      }
      await Promise.all(promises);
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Reset all board permissions to "Inherit"? This cannot be undone.')) return;
    setResetting(true);
    try {
      await resetBoardPermissions(boardId);
      await fetchBoardPermissions(boardId);
    } finally {
      setResetting(false);
    }
  };

  if (isLoadingBoardPerms && boardPermissions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-bold">Board Permissions</h2>
            {boardName && <p className="text-sm text-gray-400">{boardName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAll}
            disabled={resetting}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-gray-400 transition-colors hover:text-white"
          >
            <ArrowPathIcon className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
            Reset to Inherit All
          </button>
          <button
            onClick={handleSaveAll}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-gray-600" /> Inherit
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-600" /> Allow
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-600" /> Deny
        </span>
      </div>

      {/* Permissions Grid by Category */}
      {Object.entries(PERM_BY_CATEGORY).map(([category, perms]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            {category}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="min-w-[160px] px-3 py-2 text-left font-medium text-gray-400">
                    Group
                  </th>
                  {perms.map((p) => (
                    <th
                      key={p.key}
                      className="min-w-[100px] px-2 py-2 text-center font-medium text-gray-400"
                    >
                      <span className="text-xs">{p.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-white/[0.04]/30 border-b border-gray-800">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: group.color || '#6b7280' }}
                        />
                        <span className="text-sm text-white">{group.name}</span>
                      </div>
                    </td>
                    {perms.map((perm) => {
                      const val = localPerms[group.id]?.[perm.key] || 'inherit';
                      return (
                        <td key={perm.key} className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            {(['inherit', 'allow', 'deny'] as PermLevel[]).map((level) => (
                              <button
                                key={level}
                                onClick={() => setPermValue(group.id, perm.key, level)}
                                className={`h-6 w-6 rounded text-xs font-medium transition-all ${
                                  val === level
                                    ? level === 'allow'
                                      ? 'bg-green-600 text-white'
                                      : level === 'deny'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-600 text-white'
                                    : 'bg-white/[0.04] text-gray-500 hover:bg-white/[0.06]'
                                }`}
                                title={level.charAt(0).toUpperCase() + level.slice(1)}
                              >
                                {level === 'inherit' ? '—' : level === 'allow' ? '✓' : '✗'}
                              </button>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Effective permissions note */}
      <div className="flex items-start gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] p-3">
        <InformationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
        <p className="text-xs text-gray-400">
          <strong className="text-gray-300">Inheritance:</strong> &quot;Inherit&quot; means the
          permission falls through to the forum-level setting. &quot;Allow&quot; explicitly grants
          access. &quot;Deny&quot; overrides all other permissions for this board.
        </p>
      </div>
    </div>
  );
}

export default BoardPermissionsPanel;
