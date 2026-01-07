import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import socketManager from '../../lib/socket';
import { safeFormatConversationTime } from '../../lib/dateUtils';
import { MessagesStackParamList, Conversation, ConversationParticipant } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'ConversationList'>;
};

export default function ConversationListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  // Track online status for all conversation participants
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  // Set up navigation header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('NewConversation')}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [colors.primary, navigation]);
  
  // Fetch conversations when user is available
  // This ensures we have the user ID for proper participant filtering
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);
  
  // Subscribe to global friend presence changes
  useEffect(() => {
    // Initialize with current online friends
    setOnlineUsers(new Set(socketManager.getOnlineFriends()));
    
    // Subscribe to status changes
    const unsubscribe = socketManager.onGlobalStatusChange((userId, isOnline) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });
    
    return () => unsubscribe();
  }, []);
  
  // Fetch bulk presence for all conversation participants
  const fetchBulkPresence = useCallback(async (participantIds: string[]) => {
    if (participantIds.length === 0) return;
    
    try {
      const presenceData = await socketManager.getBulkFriendStatus(participantIds);
      const online = new Set<string>();
      Object.entries(presenceData).forEach(([id, data]) => {
        if (data.online && !data.hidden) {
          online.add(id);
        }
      });
      setOnlineUsers(online);
    } catch (error) {
      // Ignore errors, will use socket subscription for updates
    }
  }, []);
  
  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/v1/conversations');
      const convos = response.data.data || [];
      setConversations(convos);
      
      // Fetch presence for all other participants
      const participantIds = convos
        .map((conv: Conversation) => {
          const other = conv.participants?.find((p: ConversationParticipant) => {
            const pUserId = p.userId || p.user_id || (p.user as any)?.id || p.id;
            return String(pUserId) !== String(user?.id);
          });
          return other?.userId || other?.user_id || (other?.user as any)?.id;
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
    await fetchConversations();
    setRefreshing(false);
  };
  
  const renderConversation = ({ item }: { item: Conversation }) => {
    // Get current user ID - if not available, we can't properly filter
    const currentUserId = user?.id;
    
    // Debug logging at start of render
    if (__DEV__ && !currentUserId) {
      console.warn('[ConversationList] Rendering without user ID - will show "Unknown"');
    }
    
    // Find the OTHER participant (not the current user)
    // API returns camelCase: userId, user.displayName, user.avatarUrl
    const otherParticipant = currentUserId ? item.participants?.find((p: ConversationParticipant) => {
      // Check all possible user ID locations
      const participantUserId = p.userId || p.user_id || (p.user as any)?.id || p.id;
      return String(participantUserId) !== String(currentUserId);
    }) : item.participants?.[0]; // Fallback to first participant if no user ID
    
    // Debug logging (dev only) - always log for first item to trace issues
    if (__DEV__) {
      console.log('[ConversationList] Current user ID:', currentUserId);
      console.log('[ConversationList] Conversation:', item.id);
      console.log('[ConversationList] Participants:', JSON.stringify(item.participants?.map(p => ({
        participantId: p.id,
        userId: p.userId || p.user_id,
        userObjId: (p.user as any)?.id,
        displayName: (p.user as any)?.displayName || (p.user as any)?.display_name,
        username: (p.user as any)?.username
      })), null, 2));
      console.log('[ConversationList] Other participant found:', otherParticipant ? 'yes' : 'no');
    }
    
    // Extract display name - API uses camelCase (displayName, not display_name)
    const displayName = item.name ||
      otherParticipant?.nickname ||
      (otherParticipant?.user as any)?.displayName ||
      (otherParticipant?.user as any)?.display_name ||
      otherParticipant?.displayName ||
      otherParticipant?.display_name ||
      (otherParticipant?.user as any)?.username ||
      otherParticipant?.username ||
      'Unknown';
    
    // Extract avatar URL - API uses camelCase (avatarUrl, not avatar_url)
    const avatarUrl = (otherParticipant?.user as any)?.avatarUrl || 
      (otherParticipant?.user as any)?.avatar_url ||
      otherParticipant?.avatarUrl ||
      otherParticipant?.avatar_url;
    
    // Check if the other user is online
    const otherUserId = otherParticipant?.userId || 
      otherParticipant?.user_id || 
      (otherParticipant?.user as any)?.id ||
      '';
    const isOnline = onlineUsers.has(String(otherUserId));
    
    return (
      <TouchableOpacity
        style={[styles.conversationItem, { borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('Conversation', { conversationId: item.id })}
      >
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {/* Online indicator */}
          {isOnline && (
            <View style={[styles.onlineIndicator, { borderColor: colors.background }]} />
          )}
          {item.unread_count > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.conversationName,
                { color: colors.text },
                item.unread_count > 0 && styles.unreadName,
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {item.last_message && (
              <Text style={[styles.time, { color: colors.textTertiary }]}>
                {safeFormatConversationTime(item.last_message.inserted_at)}
              </Text>
            )}
          </View>
          {item.last_message && (
            <Text
              style={[
                styles.lastMessage,
                { color: item.unread_count > 0 ? colors.text : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {item.last_message.content}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Start a conversation with someone
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('NewConversation')}
      >
        <Text style={styles.emptyButtonText}>New Message</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2.5,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.2,
  },
  unreadName: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
