/**
 * AchievementsScreen - Mobile
 *
 * Full-screen achievements browser with filtering, progress tracking,
 * and detailed achievement views. Allows users to see all achievements,
 * their progress, and celebrate unlocked achievements.
 *
 * Features:
 * - Category and rarity filtering
 * - Search functionality
 * - Progress indicators
 * - Animated unlock celebrations
 * - Detailed achievement modal
 *
 * @version 1.0.0
 * @since v0.8.3
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '@/components';
import { LevelProgress, TitleBadge } from '@/components/gamification';
import { useGamification } from '@/hooks/useGamification';
import { HapticFeedback } from '@/lib/animations/animation-engine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type AchievementCategory = 'all' | 'social' | 'content' | 'engagement' | 'special' | 'collector';

interface AchievementWithProgress {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: string;
  xpReward: number;
  coinReward: number;
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RARITY_COLORS: Record<AchievementRarity, { bg: string; text: string; border: string }> = {
  common: { bg: '#374151', text: '#9ca3af', border: '#4b5563' },
  uncommon: { bg: '#064e3b', text: '#34d399', border: '#10b981' },
  rare: { bg: '#1e3a8a', text: '#60a5fa', border: '#3b82f6' },
  epic: { bg: '#581c87', text: '#c084fc', border: '#a855f7' },
  legendary: { bg: '#78350f', text: '#fcd34d', border: '#f59e0b' },
};

const CATEGORIES: { id: AchievementCategory; name: string; icon: string }[] = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'social', name: 'Social', icon: 'people' },
  { id: 'content', name: 'Content', icon: 'document-text' },
  { id: 'engagement', name: 'Engagement', icon: 'flame' },
  { id: 'special', name: 'Special', icon: 'star' },
  { id: 'collector', name: 'Collector', icon: 'albums' },
];

const RARITIES: { id: AchievementRarity | 'all'; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'common', name: 'Common' },
  { id: 'uncommon', name: 'Uncommon' },
  { id: 'rare', name: 'Rare' },
  { id: 'epic', name: 'Epic' },
  { id: 'legendary', name: 'Legendary' },
];

// ============================================================================
// ACHIEVEMENT CARD
// ============================================================================

interface AchievementCardProps {
  achievement: AchievementWithProgress;
  onPress: (achievement: AchievementWithProgress) => void;
}

function AchievementCard({ achievement, onPress }: AchievementCardProps) {
  const colors = RARITY_COLORS[achievement.rarity];
  const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100);

  return (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        { borderColor: achievement.unlocked ? colors.border : '#374151' },
      ]}
      onPress={() => {
        HapticFeedback.light();
        onPress(achievement);
      }}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={achievement.unlocked ? [colors.bg, '#1f2937'] : ['#1f2937', '#111827']}
        style={styles.achievementGradient}
      >
        {/* Icon */}
        <View
          style={[
            styles.achievementIcon,
            { backgroundColor: achievement.unlocked ? colors.border + '40' : '#37415180' },
          ]}
        >
          <Text style={styles.iconEmoji}>{achievement.icon || '🏆'}</Text>
          {achievement.unlocked && (
            <View style={styles.unlockedBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.achievementContent}>
          <View style={styles.achievementHeader}>
            <Text
              style={[
                styles.achievementName,
                { color: achievement.unlocked ? colors.text : '#9ca3af' },
              ]}
              numberOfLines={1}
            >
              {achievement.name}
            </Text>
            <View
              style={[
                styles.rarityBadge,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.rarityText, { color: colors.text }]}>
                {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={styles.achievementDescription} numberOfLines={2}>
            {achievement.description}
          </Text>

          {/* Progress bar */}
          {!achievement.unlocked && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%`, backgroundColor: colors.border },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress}/{achievement.requirement}
              </Text>
            </View>
          )}

          {/* Rewards */}
          <View style={styles.rewardsRow}>
            {achievement.xpReward > 0 && (
              <View style={styles.rewardBadge}>
                <Ionicons name="sparkles" size={12} color="#8b5cf6" />
                <Text style={styles.rewardText}>{achievement.xpReward} XP</Text>
              </View>
            )}
            {achievement.coinReward > 0 && (
              <View style={styles.rewardBadge}>
                <Text style={styles.coinEmoji}>🪙</Text>
                <Text style={styles.rewardText}>{achievement.coinReward}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ============================================================================
// DETAIL MODAL
// ============================================================================

interface DetailModalProps {
  achievement: AchievementWithProgress | null;
  visible: boolean;
  onClose: () => void;
}

function DetailModal({ achievement, visible, onClose }: DetailModalProps) {
  if (!achievement) return null;

  const colors = RARITY_COLORS[achievement.rarity];
  const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />

        <View style={[styles.modalContent, { borderColor: colors.border }]}>
          <LinearGradient colors={[colors.bg, '#1f2937', '#111827']} style={styles.modalGradient}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>

            {/* Achievement icon large */}
            <View style={[styles.largeIcon, { backgroundColor: colors.border + '40' }]}>
              <Text style={styles.largeIconEmoji}>{achievement.icon || '🏆'}</Text>
              {achievement.unlocked && (
                <View style={styles.largeUnlockedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
              )}
            </View>

            {/* Name and rarity */}
            <Text style={[styles.modalTitle, { color: colors.text }]}>{achievement.name}</Text>
            <View
              style={[
                styles.modalRarityBadge,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.modalRarityText, { color: colors.text }]}>
                {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.modalDescription}>{achievement.description}</Text>

            {/* Progress */}
            {!achievement.unlocked && (
              <View style={styles.modalProgressSection}>
                <Text style={styles.modalProgressLabel}>Progress</Text>
                <View style={styles.modalProgressBar}>
                  <View
                    style={[
                      styles.modalProgressFill,
                      { width: `${progressPercent}%`, backgroundColor: colors.border },
                    ]}
                  />
                </View>
                <Text style={styles.modalProgressText}>
                  {achievement.progress} / {achievement.requirement} ({Math.round(progressPercent)}
                  %)
                </Text>
              </View>
            )}

            {/* Unlock date */}
            {achievement.unlocked && achievement.unlockedAt && (
              <View style={styles.unlockedInfo}>
                <Ionicons name="calendar" size={16} color="#9ca3af" />
                <Text style={styles.unlockedDate}>
                  Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                </Text>
              </View>
            )}

            {/* Rewards */}
            <View style={styles.modalRewards}>
              <Text style={styles.modalRewardsLabel}>Rewards</Text>
              <View style={styles.modalRewardsRow}>
                {achievement.xpReward > 0 && (
                  <View style={styles.modalRewardBadge}>
                    <Ionicons name="sparkles" size={20} color="#8b5cf6" />
                    <Text style={styles.modalRewardText}>{achievement.xpReward} XP</Text>
                  </View>
                )}
                {achievement.coinReward > 0 && (
                  <View style={styles.modalRewardBadge}>
                    <Text style={{ fontSize: 20 }}>🪙</Text>
                    <Text style={styles.modalRewardText}>{achievement.coinReward} Coins</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const { achievements, refreshAchievements, isLoading, stats } = useGamification();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('all');
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'all'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementWithProgress | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  // Initial load
  useEffect(() => {
    refreshAchievements();
  }, []);

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
      if (selectedRarity !== 'all' && a.rarity !== selectedRarity) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query);
      }
      return true;
    });
  }, [achievements, selectedCategory, selectedRarity, searchQuery]);

  // Stats
  const totalUnlocked = useMemo(
    () => achievements.filter((a) => a.unlocked).length,
    [achievements]
  );
  const totalAchievements = achievements.length;
  const progressPercent =
    totalAchievements > 0 ? Math.round((totalUnlocked / totalAchievements) * 100) : 0;

  const handleAchievementPress = useCallback((achievement: AchievementWithProgress) => {
    setSelectedAchievement(achievement);
    setShowModal(true);
  }, []);

  const handleRefresh = useCallback(() => {
    HapticFeedback.light();
    refreshAchievements();
  }, [refreshAchievements]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1f2937', '#111827']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSubtitle}>
            {totalUnlocked} / {totalAchievements} unlocked ({progressPercent}%)
          </Text>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.progressRing}>
            <Text style={styles.progressRingText}>{progressPercent}%</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search achievements..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryTab, selectedCategory === item.id && styles.categoryTabActive]}
              onPress={() => {
                HapticFeedback.light();
                setSelectedCategory(item.id);
              }}
            >
              <Ionicons
                name={item.icon as string}
                size={16}
                color={selectedCategory === item.id ? '#fff' : '#6b7280'}
              />
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === item.id && styles.categoryTabTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryTabsContent}
        />
      </View>

      {/* Rarity Filter */}
      <View style={styles.rarityFilter}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={RARITIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const colors =
              item.id === 'all'
                ? { bg: '#374151', text: '#9ca3af', border: '#4b5563' }
                : RARITY_COLORS[item.id];
            return (
              <TouchableOpacity
                style={[
                  styles.rarityChip,
                  selectedRarity === item.id && {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  HapticFeedback.light();
                  setSelectedRarity(item.id);
                }}
              >
                <Text
                  style={[
                    styles.rarityChipText,
                    selectedRarity === item.id && { color: colors.text },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.rarityFilterContent}
        />
      </View>

      {/* Achievements List */}
      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AchievementCard achievement={item} onPress={handleAchievementPress} />
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
            <Ionicons name="trophy-outline" size={48} color="#4b5563" />
            <Text style={styles.emptyTitle}>No achievements found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <DetailModal
        achievement={selectedAchievement}
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerStats: {
    alignItems: 'center',
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  categoryTabs: {
    height: 44,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: '#8b5cf6',
  },
  categoryTabText: {
    color: '#6b7280',
    fontSize: 14,
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  rarityFilter: {
    height: 40,
    marginTop: 8,
  },
  rarityFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  rarityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  rarityChipText: {
    color: '#6b7280',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  achievementCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  achievementGradient: {
    flexDirection: 'row',
    padding: 16,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconEmoji: {
    fontSize: 28,
  },
  unlockedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    flex: 1,
    marginLeft: 12,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  achievementDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 18,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 50,
    textAlign: 'right',
  },
  rewardsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  coinEmoji: {
    fontSize: 12,
  },
  rewardText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  largeIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  largeIconEmoji: {
    fontSize: 40,
  },
  largeUnlockedBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalRarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  modalProgressSection: {
    width: '100%',
    marginTop: 20,
  },
  modalProgressLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalProgressText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  unlockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  unlockedDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  modalRewards: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  modalRewardsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  modalRewardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  modalRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  modalRewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
