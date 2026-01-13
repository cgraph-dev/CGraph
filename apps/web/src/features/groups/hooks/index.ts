/**
 * Groups Hooks
 *
 * Custom React hooks for group functionality.
 * Connected to groupStore for actual data.
 */

import { useCallback, useMemo, useState } from 'react';
import { useGroupStore } from '@/stores/groupStore';

/**
 * Permission flags (bitfield)
 */
const PERMISSIONS = {
  ADMINISTRATOR: 1 << 0,
  MODERATE_MEMBERS: 1 << 1,
  MANAGE_CHANNELS: 1 << 2,
  MANAGE_ROLES: 1 << 3,
  SEND_MESSAGES: 1 << 4,
  EMBED_LINKS: 1 << 5,
  ATTACH_FILES: 1 << 6,
  MENTION_EVERYONE: 1 << 7,
  MANAGE_MESSAGES: 1 << 8,
  CREATE_INVITES: 1 << 9,
} as const;

/**
 * Hook to check user permissions in a group/channel
 */
export function usePermissions(groupId: string, _channelId?: string) {
  const { groups, activeGroupId } = useGroupStore();
  
  // Get the current/active group
  const currentGroup = useMemo(() => {
    return groups.find(g => g.id === (groupId || activeGroupId));
  }, [groups, groupId, activeGroupId]);

  const permissions = useMemo(() => {
    if (!currentGroup || currentGroup.id !== groupId) return [];
    const member = currentGroup.myMember;
    if (!member) return [];

    // Combine permissions from all roles
    let combinedPerms = 0;
    for (const role of member.roles) {
      combinedPerms |= role.permissions;
    }

    // Convert to array of permission names
    const permNames: string[] = [];
    for (const [name, value] of Object.entries(PERMISSIONS)) {
      if (combinedPerms & value) {
        permNames.push(name);
      }
    }
    return permNames;
  }, [currentGroup, groupId]);

  const hasPermission = useCallback(
    (permission: string) => {
      return permissions.includes(permission) || permissions.includes('ADMINISTRATOR');
    },
    [permissions]
  );

  const isAdmin = useMemo(() => hasPermission('ADMINISTRATOR'), [hasPermission]);

  const isModerator = useMemo(
    () => hasPermission('MODERATE_MEMBERS') || isAdmin,
    [hasPermission, isAdmin]
  );

  return {
    permissions,
    hasPermission,
    isAdmin,
    isModerator,
  };
}

/**
 * Hook to manage group invites
 */
export function useGroupInvites(groupId: string) {
  const createInvite = useCallback(
    async (options?: { maxUses?: number; expiresIn?: number }) => {
      try {
        const { api } = await import('@/lib/api');
        const response = await api.post(`/api/v1/groups/${groupId}/invites`, {
          max_uses: options?.maxUses,
          expires_in: options?.expiresIn,
        });
        return response.data as { code: string; url: string };
      } catch {
        return null;
      }
    },
    [groupId]
  );

  const revokeInvite = useCallback(async (inviteCode: string) => {
    try {
      const { api } = await import('@/lib/api');
      await api.delete(`/api/v1/invites/${inviteCode}`);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    createInvite,
    revokeInvite,
  };
}

/**
 * Hook to manage channel subscriptions (mute/notifications)
 */
export function useChannelNotifications(channelId: string) {
  const [isMuted, setIsMuted] = useState(false);
  const [notificationLevel, setNotificationLevelState] = useState<string>('all');

  const setMuted = useCallback(
    async (muted: boolean) => {
      try {
        const { api } = await import('@/lib/api');
        await api.patch(`/api/v1/channels/${channelId}/settings`, { muted });
        setIsMuted(muted);
      } catch {
        // Handle error
      }
    },
    [channelId]
  );

  const setNotificationLevel = useCallback(
    async (level: string) => {
      try {
        const { api } = await import('@/lib/api');
        await api.patch(`/api/v1/channels/${channelId}/settings`, {
          notification_level: level,
        });
        setNotificationLevelState(level);
      } catch {
        // Handle error
      }
    },
    [channelId]
  );

  return {
    isMuted,
    notificationLevel,
    setMuted,
    setNotificationLevel,
  };
}
