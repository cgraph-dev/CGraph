/**
 * ConversationListScreen - Premium UI with Glassmorphism & Animations
 * Features: AnimatedAvatar, GlassCard, smooth animations, haptic feedback
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore, useThemeStore } from '@/stores';
import { MessagesStackParamList, Conversation, ConversationParticipant } from '../../types';
import GlassCard from '../../components/ui/glass-card';
import { AnimatedConversationItem } from './conversation-list-screen/components/animated-conversation-item';
import { useConversationList } from './conversation-list-screen/use-conversation-list';
import { styles } from './conversation-list-screen/styles';

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'ConversationList'>;
};

/**
 *
 */
export default function ConversationListScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { conversations, refreshing, onlineUsers, onRefresh } = useConversationList(user);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.background },
      headerTitleStyle: { color: colors.text, fontWeight: '700' },
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

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => {
    const currentUserId = user?.id;
    const otherParticipant = currentUserId
      ? item.participants?.find((p: ConversationParticipant) => {
          const pId = p.userId || p.user_id || p.user?.id || p.id;
          return String(pId) !== String(currentUserId);
        })
      : item.participants?.[0];

    const displayName =
      item.name || otherParticipant?.nickname ||
      otherParticipant?.user?.display_name ||
      otherParticipant?.display_name ||
      otherParticipant?.user?.username ||
      otherParticipant?.username || 'Unknown';

    const avatarUrl: string | undefined = otherParticipant?.user?.avatar_url as string | undefined ??
      otherParticipant?.avatar_url as string | undefined;

    const otherUserId = otherParticipant?.userId || otherParticipant?.user_id ||
      otherParticipant?.user?.id || '';
    const isOnline = onlineUsers.has(String(otherUserId));
    const isPremium = Boolean(otherParticipant?.user?.is_premium);

    return (
      <AnimatedConversationItem
        item={item} index={index}
        onPress={() => navigation.navigate('Conversation', { conversationId: item.id })}
        colors={colors} displayName={displayName} avatarUrl={avatarUrl}
        isOnline={isOnline} isPremium={isPremium}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <GlassCard variant="crystal" intensity="medium" style={styles.emptyCard}>
        <LinearGradient colors={['#10b981', '#059669']} style={styles.emptyIconContainer}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="chatbubbles" size={48} color="#fff" />
        </LinearGradient>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Start a conversation with friends{'\n'}and see your messages here
        </Text>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('NewConversation'); }}
          activeOpacity={0.8}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.emptyButton}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.emptyButtonText}>Start Chatting</Text>
          </LinearGradient>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[styles.listContent, conversations.length === 0 && styles.emptyContainer]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        windowSize={11}
        maxToRenderPerBatch={10}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
      />
    </View>
  );
}
