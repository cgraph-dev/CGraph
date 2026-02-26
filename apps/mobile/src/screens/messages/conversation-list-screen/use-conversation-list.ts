import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import type { useAuthStore } from '@/stores';
import api from '../../../lib/api';
import socketManager from '../../../lib/socket';
import { Conversation, ConversationParticipant } from '../../../types';

type User = ReturnType<typeof useAuthStore>['user'];

export function useConversationList(user: User) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  useEffect(() => {
    setOnlineUsers(new Set(socketManager.getOnlineFriends()));

    const unsubscribe = socketManager.onGlobalStatusChange((userId, isOnline) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) { next.add(userId); } else { next.delete(userId); }
        return next;
      });
    });

    return () => unsubscribe();
  }, []);

  const fetchBulkPresence = useCallback(async (participantIds: string[]) => {
    if (participantIds.length === 0) return;
    try {
      const presenceData = await socketManager.getBulkFriendStatus(participantIds);
      const online = new Set<string>();
      Object.entries(presenceData).forEach(([id, data]) => {
        if (data.online && !data.hidden) { online.add(id); }
      });
      setOnlineUsers(online);
    } catch (_error) {
      // Ignore errors
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/v1/conversations');
      const convos = response.data.data || [];
      setConversations(convos);

      // @ts-expect-error - participant shape varies
      const participantIds = convos
        .map((conv: Conversation) => {
          const other = conv.participants?.find((p: ConversationParticipant) => {
            const pUserId =
              // @ts-expect-error - flexible participant shape
              p.userId || p.user_id || (p.user as Record<string, unknown>)?.id || p.id;
            return String(pUserId) !== String(user?.id);
          });
          // @ts-expect-error - flexible participant shape
          return other?.userId || other?.user_id || (other?.user as Record<string, unknown>)?.id;
        })
        .filter(Boolean) as string[];

      if (participantIds.length > 0) {
        fetchBulkPresence(participantIds);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchConversations();
    setRefreshing(false);
  };

  return { conversations, refreshing, onlineUsers, onRefresh };
}
