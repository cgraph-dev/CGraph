/**
 * AchievementsScreen - Mobile
 *
 * Full-screen achievements browser with filtering, progress tracking,
 * and detailed achievement views.
 *
 * @version 2.0.0 — refactored into modular components
 * @since v0.8.3
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGamification } from '@/hooks/useGamification';
import { HapticFeedback } from '@/lib/animations/animation-engine';

import type { AchievementCategory, AchievementRarity, AchievementWithProgress } from './types';
import { CATEGORIES, RARITIES, RARITY_COLORS } from './types';
import { AchievementCard } from './achievement-card';
import { DetailModal } from './detail-modal';
import { styles } from './styles';

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
