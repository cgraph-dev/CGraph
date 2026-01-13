/**
 * ConversationListScreen - Premium UI with Glassmorphism & Animations
 * Features: AnimatedAvatar, GlassCard, smooth animations, haptic feedback
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import socketManager from '../../lib/socket';
import { safeFormatConversationTime } from '../../lib/dateUtils';
import { MessagesStackParamList, Conversation, ConversationParticipant } from '../../types';
import AnimatedAvatar from '../../components/ui/AnimatedAvatar';
import GlassCard from '../../components/ui/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'ConversationList'>;
};

// Animated conversation item wrapper
const AnimatedConversationItem = ({ 
  item, 
  index, 
  onPress, 
  colors, 
  displayName, 
  avatarUrl, 
  isOnline,
  isPremium 
}: {
  item: Conversation;
  index: number;
  onPress: () => void;
  colors: any;
  displayName: string;
  avatarUrl: string | undefined;
  isOnline: boolean;
  isPremium?: boolean;
}) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  // Determine avatar border animation based on status
  const getBorderAnimation = (): 'none' | 'solid' | 'gradient' | 'pulse' | 'rainbow' | 'glow' | 'neon' | 'holographic' => {
    if (isPremium) return 'holographic';
    if (isOnline) return 'glow';
    if (item.unread_count > 0) return 'pulse';
    return 'none';
  };

  return (
    <Animated.View
      style={[
        styles.animatedWrapper,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={styles.conversationTouchable}
      >
        <GlassCard
          variant={item.unread_count > 0 ? 'neon' : 'frosted'}
          intensity="subtle"
          style={styles.conversationCard}
          glowColor={item.unread_count > 0 ? '#10b981' : undefined}
        >
          <View style={styles.conversationInner}>
            {/* Premium Avatar with animations */}
            <View style={styles.avatarSection}>
              {avatarUrl ? (
                <AnimatedAvatar
                  source={{ uri: avatarUrl }}
                  size={56}
                  borderAnimation={getBorderAnimation()}
                  shape="circle"
                  showStatus={true}
                  isOnline={isOnline}
                  isPremium={isPremium}
                  glowIntensity={item.unread_count > 0 ? 0.8 : 0.5}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <LinearGradient
                    colors={isPremium ? ['#8b5cf6', '#ec4899'] : ['#10b981', '#059669']}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarInitial}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                  {isOnline && <View style={styles.onlineIndicator} />}
                </View>
              )}
              
              {/* Unread badge */}
              {item.unread_count > 0 && (
                <View style={styles.unreadBadgeContainer}>
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.unreadBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.unreadText}>
                      {item.unread_count > 99 ? '99+' : item.unread_count}
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* Content */}
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
                
                {/* Typing indicator or time */}
                {item.last_message && (
                  <View style={styles.timeContainer}>
                    <Text style={[styles.time, { color: colors.textTertiary }]}>
                      {safeFormatConversationTime(item.last_message.inserted_at)}
                    </Text>
                  </View>
                )}
              </View>
              
              {item.last_message && (
                <View style={styles.messagePreview}>
                  {item.last_message.type === 'image' && (
                    <Ionicons name="image" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  )}
                  {item.last_message.type === 'video' && (
                    <Ionicons name="videocam" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  )}
                  {item.last_message.type === 'voice' && (
                    <Ionicons name="mic" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  )}
                  <Text
                    style={[
                      styles.lastMessage,
                      { color: item.unread_count > 0 ? colors.text : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.last_message.content || 'Media message'}
                  </Text>
                </View>
              )}
            </View>

            {/* Arrow indicator */}
            <View style={styles.arrowContainer}>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={item.unread_count > 0 ? colors.primary : colors.textTertiary} 
              />
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ConversationListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  // Header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Set up navigation header with premium design
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTitleStyle: {
        color: colors.text,
        fontWeight: '700',
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('NewConversation');
          }}
          style={styles.headerButton}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.headerButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="create" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      ),
    });
  }, [colors, navigation]);
  
  // Fetch conversations when user is available
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);
  
  // Subscribe to global friend presence changes
  useEffect(() => {
    setOnlineUsers(new Set(socketManager.getOnlineFriends()));
    
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
      // Ignore errors
    }
  }, []);
  
  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/v1/conversations');
      const convos = response.data.data || [];
      setConversations(convos);
      
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchConversations();
    setRefreshing(false);
  };
  
  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => {
    const currentUserId = user?.id;
    
    const otherParticipant = currentUserId ? item.participants?.find((p: ConversationParticipant) => {
      const participantUserId = p.userId || p.user_id || (p.user as any)?.id || p.id;
      return String(participantUserId) !== String(currentUserId);
    }) : item.participants?.[0];
    
    const displayName = item.name ||
      otherParticipant?.nickname ||
      (otherParticipant?.user as any)?.displayName ||
      (otherParticipant?.user as any)?.display_name ||
      otherParticipant?.displayName ||
      otherParticipant?.display_name ||
      (otherParticipant?.user as any)?.username ||
      otherParticipant?.username ||
      'Unknown';
    
    const avatarUrl = (otherParticipant?.user as any)?.avatarUrl || 
      (otherParticipant?.user as any)?.avatar_url ||
      otherParticipant?.avatarUrl ||
      otherParticipant?.avatar_url;
    
    const otherUserId = otherParticipant?.userId || 
      otherParticipant?.user_id || 
      (otherParticipant?.user as any)?.id ||
      '';
    const isOnline = onlineUsers.has(String(otherUserId));
    const isPremium = (otherParticipant?.user as any)?.is_premium || false;
    
    return (
      <AnimatedConversationItem
        item={item}
        index={index}
        onPress={() => navigation.navigate('Conversation', { conversationId: item.id })}
        colors={colors}
        displayName={displayName}
        avatarUrl={avatarUrl}
        isOnline={isOnline}
        isPremium={isPremium}
      />
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <GlassCard variant="crystal" intensity="medium" style={styles.emptyCard}>
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.emptyIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="chatbubbles" size={48} color="#fff" />
        </LinearGradient>
        
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Messages Yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Start a conversation with friends{'\n'}and see your messages here
        </Text>
        
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('NewConversation');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.emptyButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.emptyButtonText}>Start Chatting</Text>
          </LinearGradient>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.emptyContainer,
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    marginRight: 16,
  },
  headerButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  animatedWrapper: {
    marginBottom: 8,
  },
  conversationTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  conversationCard: {
    padding: 0,
    borderRadius: 16,
  },
  conversationInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
  },
  avatarFallback: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#111827',
  },
  unreadBadgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 10,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    width: '100%',
    maxWidth: 320,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});
