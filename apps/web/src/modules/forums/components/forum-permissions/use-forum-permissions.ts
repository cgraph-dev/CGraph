/**
 * Custom hook for forum permissions state management and API interactions.
 *
 * @module modules/forums/components/forum-permissions
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/shared/components/ui';
import { api } from '@/lib/api';
import type {
  PermValue,
  PermTarget,
  PermissionDef,
  PermissionOverwrite,
  GroupOption,
} from './types';
import { FORUM_PERMISSIONS, BOARD_PERMISSIONS, extractPermissions } from './types';

interface UseForumPermissionsParams {
  targetType: PermTarget;
  targetId: string;
  forumId?: string;
}

interface UseForumPermissionsReturn {
  overwrites: PermissionOverwrite[];
  groups: GroupOption[];
  loading: boolean;
  saving: boolean;
  showAdd: boolean;
  selectedGroupId: string;
  perms: readonly PermissionDef[];
  categories: string[];
  setShowAdd: (show: boolean) => void;
  setSelectedGroupId: (id: string) => void;
  handleSave: () => Promise<void>;
  handleDelete: (groupId: string) => Promise<void>;
  handleAdd: () => void;
  cyclePerm: (groupId: string, permKey: string) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Hook for managing forum permissions.
 */
export function useForumPermissions({
  targetType,
  targetId,
  forumId,
}: UseForumPermissionsParams): UseForumPermissionsReturn {
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
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              (p.user_group as Record<string, unknown>)?.name || // safe downcast – structural boundary
              `Group ${p.group_id || p.user_group_id}`,
            applies_to: p.applies_to || 'group',
            permissions: extractPermissions(p, perms),
          }))
        );

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

  const categories = [...new Set(perms.map((p) => p.category))];

  return {
    overwrites,
    groups,
    loading,
    saving,
    showAdd,
    selectedGroupId,
    perms,
    categories,
    setShowAdd,
    setSelectedGroupId,
    handleSave,
    handleDelete,
    handleAdd,
    cyclePerm,
  };
}
