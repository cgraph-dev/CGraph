import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { FriendRequest } from '../../types';
import { Header, EmptyState, LoadingSpinner, Avatar, IconButton } from '../../components';

type TabType = 'incoming' | 'outgoing';

export default function FriendRequestsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/friends/pending');
      const requests = response.data.requests || response.data || [];
      setIncomingRequests(requests.filter((r: FriendRequest) => r.type === 'incoming'));
      setOutgoingRequests(requests.filter((r: FriendRequest) => r.type === 'outgoing'));
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
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await api.post(`/api/v1/friends/${requestId}/decline`);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.requestItem, { backgroundColor: colors.surface }]}>
      <Avatar
        source={item.user.avatar_url}
        name={item.user.display_name || item.user.username}
        size="md"
      />
      <View style={styles.requestInfo}>
        <Text style={[styles.requestName, { color: colors.text }]}>
          {item.user.display_name || item.user.username}
        </Text>
        <Text style={[styles.requestUsername, { color: colors.textSecondary }]}>
          @{item.user.username}
        </Text>
      </View>
      <View style={styles.requestActions}>
        {activeTab === 'incoming' ? (
          <>
            <IconButton
              icon="checkmark"
              variant="primary"
              size="sm"
              onPress={() => handleAccept(item.id)}
              disabled={processingId === item.id}
            />
            <IconButton
              icon="close"
              variant="default"
              size="sm"
              onPress={() => handleDecline(item.id)}
              disabled={processingId === item.id}
              style={{ marginLeft: 8 }}
            />
          </>
        ) : (
          <IconButton
            icon="close"
            variant="default"
            size="sm"
            onPress={() => handleDecline(item.id)}
            disabled={processingId === item.id}
          />
        )}
      </View>
    </View>
  );

  const currentRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Friend Requests"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'incoming' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('incoming')}
        >
          <Ionicons
            name="arrow-down"
            size={18}
            color={activeTab === 'incoming' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'incoming' ? '#fff' : colors.textSecondary },
            ]}
          >
            Incoming ({incomingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'outgoing' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('outgoing')}
        >
          <Ionicons
            name="arrow-up"
            size={18}
            color={activeTab === 'outgoing' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'outgoing' ? '#fff' : colors.textSecondary },
            ]}
          >
            Sent ({outgoingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={currentRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="mail-outline"
            title={activeTab === 'incoming' ? 'No incoming requests' : 'No sent requests'}
            description={
              activeTab === 'incoming'
                ? 'Friend requests you receive will appear here'
                : 'Friend requests you send will appear here'
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    padding: 8,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '500',
  },
  requestUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
