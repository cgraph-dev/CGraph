/**
 * Groups Hooks (Mobile)
 * 
 * Connects to backend for group management, channels, and invites.
 * @module features/groups/hooks
 * @version 0.8.6
 */

import { useCallback, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
// expo-sharing is optional - we use clipboard fallback if not available
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';
import api from '../../../lib/api';

// Types
interface Group {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  member_count: number;
  owner_id: string;
  is_public: boolean;
  created_at: string;
}

interface Channel {
  id: string;
  group_id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  description?: string;
  position: number;
  is_muted?: boolean;
}

interface GroupMember {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  role_id?: string;
  role_name?: string;
  joined_at: string;
}

interface GroupInvite {
  id: string;
  code: string;
  group_id: string;
  expires_at?: string;
  max_uses?: number;
  uses: number;
  created_by: string;
}

/**
 * Hook for fetching user's groups
 */
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/groups');
      const data = response.data?.data || response.data?.groups || response.data;
      setGroups(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch groups';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    isLoading,
    error,
    refresh: fetchGroups,
  };
}

/**
 * Hook for single group details
 */
export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/groups/${groupId}`);
      const data = response.data?.data || response.data;
      setGroup(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch group';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const updateGroup = useCallback(async (updates: Partial<Group>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response = await api.patch(`/api/v1/groups/${groupId}`, updates);
      const data = response.data?.data || response.data;
      setGroup(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (_err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, [groupId]);

  const leaveGroup = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await api.post(`/api/v1/groups/${groupId}/leave`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (_err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, [groupId]);

  return {
    group,
    isLoading,
    error,
    updateGroup,
    leaveGroup,
    refresh: fetchGroup,
  };
}

/**
 * Hook for group channels
 */
export function useChannels(groupId: string) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/groups/${groupId}/channels`);
      const data = response.data?.data || response.data?.channels || response.data;
      setChannels(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch channels';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const createChannel = useCallback(async (name: string, type: 'text' | 'voice' | 'announcement' = 'text') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response = await api.post(`/api/v1/groups/${groupId}/channels`, { name, type });
      const newChannel = response.data?.data || response.data;
      setChannels(prev => [...prev, newChannel]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return newChannel;
    } catch (_err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    }
  }, [groupId]);

  return {
    channels,
    isLoading,
    error,
    createChannel,
    refresh: fetchChannels,
  };
}

/**
 * Hook for group/channel notifications
 */
export function useChannelNotifications(channelId: string) {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchMuteStatus = async () => {
      try {
        const response = await api.get(`/api/v1/channels/${channelId}/settings`);
        const data = response.data?.data || response.data;
        setIsMuted(data.is_muted ?? data.muted ?? false);
      } catch {
        // Default to not muted
      }
    };
    if (channelId) fetchMuteStatus();
  }, [channelId]);

  const toggleMute = useCallback(async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.patch(`/api/v1/channels/${channelId}/settings`, { 
        is_muted: !isMuted 
      });
      setIsMuted(!isMuted);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [channelId, isMuted]);
  
  return {
    isMuted,
    isLoading,
    toggleMute,
  };
}

/**
 * Hook for group members
 */
export function useGroupMembers(groupId: string) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/groups/${groupId}/members`);
      const data = response.data?.data || response.data?.members || response.data;
      setMembers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch members';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const kickMember = useCallback(async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await api.delete(`/api/v1/groups/${groupId}/members/${userId}`);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, [groupId]);

  const banMember = useCallback(async (userId: string, reason?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await api.post(`/api/v1/groups/${groupId}/bans`, { user_id: userId, reason });
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, [groupId]);

  return {
    members,
    isLoading,
    error,
    kickMember,
    banMember,
    refresh: fetchMembers,
  };
}

/**
 * Hook for group invite actions
 */
export function useGroupInvites(groupId: string) {
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/api/v1/groups/${groupId}/invites`);
      const data = response.data?.data || response.data?.invites || response.data;
      setInvites(Array.isArray(data) ? data : []);
    } catch {
      // Silent fail for invite list
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const createInvite = useCallback(async (options?: { 
    max_uses?: number; 
    expires_in_hours?: number 
  }) => {
    setIsCreating(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const response = await api.post(`/api/v1/groups/${groupId}/invites`, options || {});
      const invite = response.data?.data || response.data;
      setInvites(prev => [invite, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return invite;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create invite';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [groupId]);
  
  const shareInvite = useCallback(async (inviteCode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const inviteUrl = `https://cgraph.app/invite/${inviteCode}`;
    
    // Copy to clipboard - simple and reliable
    await copyToClipboard(inviteUrl);
  }, []);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Invite link copied to clipboard');
  };

  const revokeInvite = useCallback(async (inviteId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.delete(`/api/v1/groups/${groupId}/invites/${inviteId}`);
      setInvites(prev => prev.filter(i => i.id !== inviteId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, [groupId]);
  
  return {
    invites,
    isLoading,
    isCreating,
    error,
    createInvite,
    shareInvite,
    revokeInvite,
    refresh: fetchInvites,
  };
}

/**
 * Hook for joining groups
 */
export function useJoinGroup() {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinWithInvite = useCallback(async (inviteCode: string) => {
    setIsJoining(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await api.post(`/api/v1/invites/${inviteCode}/join`);
      const data = response.data?.data || response.data;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return data.group || data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join group';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    } finally {
      setIsJoining(false);
    }
  }, []);

  const joinPublicGroup = useCallback(async (groupId: string) => {
    setIsJoining(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await api.post(`/api/v1/groups/${groupId}/join`);
      const data = response.data?.data || response.data;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join group';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    } finally {
      setIsJoining(false);
    }
  }, []);

  return {
    isJoining,
    error,
    joinWithInvite,
    joinPublicGroup,
  };
}

/**
 * Hook for creating groups
 */
export function useCreateGroup() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = useCallback(async (data: {
    name: string;
    description?: string;
    is_public?: boolean;
  }) => {
    setIsCreating(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await api.post('/api/v1/groups', data);
      const group = response.data?.data || response.data;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return group;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create group';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    isCreating,
    error,
    createGroup,
  };
}
