/**
 * useFriendRequests Hook
 *
 * Manages friend requests state and API interactions.
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import api from '../../../../lib/api';
import type { FriendRequest, TabType } from '../types';

/**
 * Hook for friend requests.
 *
 */
export function useFriendRequests() {
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const statsScale = useSharedValue(0.9);

  useEffect(() => {
    // Header entrance animation
    headerOpacity.value = withTiming(1, { duration: durations.slower.ms });
    statsScale.value = withSpring(1, { stiffness: 100, damping: 10 });
  }, [headerOpacity, statsScale]);

  const fetchRequests = useCallback(async () => {
    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get('/api/v1/friends/requests'),
        api.get('/api/v1/friends/sent'),
      ]);

      // Normalize incoming requests
      const incomingData =
        incomingRes.data?.data || incomingRes.data?.requests || incomingRes.data || [];
      const normalizedIncoming = (Array.isArray(incomingData) ? incomingData : []).map(
        (r: Record<string, unknown>) => ({
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          id: r.id as string,
          user: r.from
            ? {
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                id: (r.from as Record<string, unknown>).id as string,

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                username: ((r.from as Record<string, unknown>).username as string) || 'Unknown',

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                display_name: (r.from as Record<string, unknown>).display_name as string | null,

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                avatar_url: (r.from as Record<string, unknown>).avatar_url as string | null,

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                status: ((r.from as Record<string, unknown>).status as string) || 'offline',
              }
            : {
                id: 'unknown',
                username: 'Unknown',
                display_name: null,
                avatar_url: null,
                status: 'offline',
              },
          type: 'incoming' as const,

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          created_at: r.sent_at as string,
        })
      );

      // Normalize outgoing requests
      const outgoingData =
        outgoingRes.data?.data || outgoingRes.data?.requests || outgoingRes.data || [];
      const normalizedOutgoing = (Array.isArray(outgoingData) ? outgoingData : []).map(
        (r: Record<string, unknown>) => ({
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          id: r.id as string,
          user: r.to
            ? {
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                id: (r.to as Record<string, unknown>).id as string,

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                username: ((r.to as Record<string, unknown>).username as string) || 'Unknown',

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                display_name: (r.to as Record<string, unknown>).display_name as string | null,

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                avatar_url: (r.to as Record<string, unknown>).avatar_url as string | null,

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                status: ((r.to as Record<string, unknown>).status as string) || 'offline',
              }
            : {
                id: 'unknown',
                username: 'Unknown',
                display_name: null,
                avatar_url: null,
                status: 'offline',
              },
          type: 'outgoing' as const,

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          created_at: r.sent_at as string,
        })
      );

      setIncomingRequests(normalizedIncoming);
      setOutgoingRequests(normalizedOutgoing);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await api.post(`/api/v1/friends/${requestId}/accept`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (_error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await api.post(`/api/v1/friends/${requestId}/decline`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (_error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to decline friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleTabPress = (tab: TabType) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const currentRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  return {
    // State
    activeTab,
    incomingRequests,
    outgoingRequests,
    currentRequests,
    loading,
    refreshing,
    processingId,

    // Animations
    headerOpacity,
    statsScale,

    // Actions
    handleAccept,
    handleDecline,
    handleTabPress,
    onRefresh,
  };
}
