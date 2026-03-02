/**
 * QuestsScreen - Mobile
 *
 * Quest management screen with daily, weekly, and special quests.
 *
 * @version 1.0.0
 * @since v0.8.3
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGamification } from '@/hooks/useGamification';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { type QuestTab, TABS } from './types';
import { styles } from './styles';
import { QuestCard } from './quest-card';

/**
 * Quest management screen.
 */
export default function QuestsScreen() {
  const navigation = useNavigation();
  const {
    activeQuests, dailyQuests, weeklyQuests,
    refreshQuests, acceptQuest, claimQuestRewards,
    isLoading, stats,
  } = useGamification();

  const [activeTab, setActiveTab] = useState<QuestTab>('active');

  useEffect(() => {
    refreshQuests();
  }, []);

  const displayedQuests = useMemo(() => {
    switch (activeTab) {
      case 'active': return activeQuests.filter((q) => q.accepted && !q.completed);
      case 'daily': return dailyQuests;
      case 'weekly': return weeklyQuests;
      case 'completed':
        return [...activeQuests, ...dailyQuests, ...weeklyQuests].filter((q) => q.completed);
      default: return [];
    }
  }, [activeTab, activeQuests, dailyQuests, weeklyQuests]);

  const totalActive = activeQuests.filter((q) => q.accepted && !q.completed).length;
  const totalCompleted = [...activeQuests, ...dailyQuests, ...weeklyQuests].filter(
    (q) => q.completed
  ).length;

  const handleAcceptQuest = useCallback(async (questId: string) => {
    try {
      await acceptQuest(questId);
      HapticFeedback.success();
      Alert.alert('Quest Accepted!', 'Good luck on your quest!');
    } catch (_error) {
      HapticFeedback.error();
      Alert.alert('Error', 'Failed to accept quest. Please try again.');
    }
  }, [acceptQuest]);

  const handleClaimRewards = useCallback(async (userQuestId: string) => {
    try {
      const success = await claimQuestRewards(userQuestId);
      if (success) {
        HapticFeedback.success();
        Alert.alert('Rewards Claimed!', 'Your rewards have been added to your account.');
      }
    } catch (_error) {
      HapticFeedback.error();
      Alert.alert('Error', 'Failed to claim rewards. Please try again.');
    }
  }, [claimQuestRewards]);

  const handleRefresh = useCallback(() => {
    HapticFeedback.light();
    refreshQuests();
  }, [refreshQuests]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1f2937', '#111827']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Quests</Text>
          <Text style={styles.headerSubtitle}>
            {totalActive} active • {totalCompleted} completed
          </Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.questCountBadge}>
            <Ionicons name="map" size={20} color="#10b981" />
            <Text style={styles.questCountText}>{totalActive}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => { HapticFeedback.light(); setActiveTab(tab.id); }}
          >
            <Ionicons
              name={tab.icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={activeTab === tab.id ? '#8b5cf6' : '#6b7280'}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayedQuests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QuestCard userQuest={item} onAccept={handleAcceptQuest} onClaim={handleClaimRewards} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color="#4b5563" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'completed' ? 'No completed quests yet' : 'No quests available'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'completed'
                ? 'Complete quests to see them here'
                : 'Check back later for new quests'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
