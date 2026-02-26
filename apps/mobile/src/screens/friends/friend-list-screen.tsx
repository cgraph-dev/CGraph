/**
 * FriendListScreen - Premium UI with Glassmorphism & Animations
 * Features: AnimatedAvatar, GlassCard, smooth animations, haptic feedback
 */

import React from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import { FriendsStackParamList } from '../../types';
import { LoadingSpinner } from '../../components';
import GlassCard from '../../components/ui/glass-card';
import type { FriendItem } from './friend-list-screen/types';
import { styles } from './friend-list-screen/styles';
import { useFriendList } from './friend-list-screen/use-friend-list';
import { AnimatedFriendItem } from './friend-list-screen/components/animated-friend-item';

type NavigationProp = NativeStackNavigationProp<FriendsStackParamList>;

/**
 *
 */
export default function FriendListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useThemeStore();
  const {
    friends, filteredFriends, loading, refreshing, searchQuery,
    setSearchQuery, pendingCount, onlineFriends, onlineCount, onRefresh,
  } = useFriendList();

  const handleFriendPress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const renderFriend = ({ item, index }: { item: FriendItem; index: number }) => (
    <AnimatedFriendItem
      item={item} index={index}
      onPress={() => handleFriendPress(item.user.id)}
      colors={colors} isOnline={onlineFriends.has(item.user.id)}
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <GlassCard variant="frosted" intensity="subtle" style={styles.searchCard}>
          <View style={styles.searchInner}>
            <Ionicons name="search" size={20} color={colors.primary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search friends..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>
      </View>

      {/* Online Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>{onlineCount} Online</Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>{friends.length - onlineCount} Offline</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButtonWrapper} activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('AddFriend'); }}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Add Friend</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonWrapper} activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('FriendRequests'); }}>
          <GlassCard variant="frosted" intensity="subtle" style={styles.actionCardButton}>
            <View style={styles.actionCardInner}>
              <Ionicons name="mail" size={18} color={colors.primary} />
              <Text style={[styles.actionCardText, { color: colors.text }]}>Requests</Text>
              {pendingCount > 0 && (
                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </LinearGradient>
              )}
            </View>
          </GlassCard>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonWrapper} activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Leaderboard'); }}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="trophy" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Top Users</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        contentContainerStyle={[styles.listContent, filteredFriends.length === 0 && styles.emptyList]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GlassCard variant="crystal" intensity="medium" style={styles.emptyCard}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.emptyIcon}>
                <Ionicons name="people" size={40} color="#fff" />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery ? 'No friends found' : 'No friends yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Add friends to start chatting!'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity activeOpacity={0.8}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('AddFriend'); }}>
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.emptyButton}>
                    <Ionicons name="person-add" size={18} color="#fff" />
                    <Text style={styles.emptyButtonText}>Add Friend</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </GlassCard>
          </View>
        }
      />
    </SafeAreaView>
  );
}
