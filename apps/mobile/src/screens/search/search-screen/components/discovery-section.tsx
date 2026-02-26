/**
 * DiscoverySection - Search Discovery UI Components
 *
 * Renders the discovery section with recent searches, trending topics,
 * quick actions, and search tips when no search query is active.
 *
 * @module screens/search/SearchScreen/components/DiscoverySection
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';
import { TrendingItem } from './search-components';
import type { ThemeColors } from '@/stores';

// Trending topics mock data
const TRENDING_TOPICS = [
  { id: '1', text: 'DeFi Updates', icon: 'trending-up', color: '#10b981', searches: 2400 },
  { id: '2', text: 'NFT Collections', icon: 'images', color: '#8b5cf6', searches: 1850 },
  { id: '3', text: 'Gaming Guilds', icon: 'game-controller', color: '#f59e0b', searches: 1200 },
  { id: '4', text: 'Crypto News', icon: 'newspaper', color: '#ec4899', searches: 980 },
  { id: '5', text: 'Web3 Dev', icon: 'code-slash', color: '#3b82f6', searches: 750 },
];

type SearchCategory = 'all' | 'users' | 'groups' | 'forums';

// ============================================================================
// RECENT SEARCHES SECTION
// ============================================================================

interface RecentSearchesSectionProps {
  recentSearches: string[];
  onSearchSelect: (search: string) => void;
  onRemoveSearch: (search: string) => void;
  onClearAll: () => void;
  colors: ThemeColors;
}

/**
 *
 */
export function RecentSearchesSection({
  recentSearches,
  onSearchSelect,
  onRemoveSearch,
  onClearAll,
  colors,
}: RecentSearchesSectionProps) {
  if (recentSearches.length === 0) return null;

  return (
    <View style={styles.recentSection}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <LinearGradient colors={['#8b5cf6', '#6366f1']} style={styles.sectionIconSmall}>
            <Ionicons name="time" size={14} color="#fff" />
          </LinearGradient>
          <Text style={[styles.sectionTitleSmall, { color: colors.text }]}>Recent Searches</Text>
        </View>
        <TouchableOpacity onPress={onClearAll}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentScrollContent}
      >
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={`${search}-${index}`}
            style={[styles.recentChip, { backgroundColor: colors.surface }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSearchSelect(search);
            }}
            onLongPress={() => onRemoveSearch(search)}
          >
            <Ionicons name="search" size={14} color={colors.textSecondary} />
            <Text style={[styles.recentChipText, { color: colors.text }]} numberOfLines={1}>
              {search}
            </Text>
            <TouchableOpacity
              onPress={() => onRemoveSearch(search)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// TRENDING SECTION
// ============================================================================

interface TrendingSectionProps {
  onTopicSelect: (topic: string) => void;
  isDark: boolean;
  colors: ThemeColors;
}

/**
 *
 */
export function TrendingSection({ onTopicSelect, isDark, colors }: TrendingSectionProps) {
  return (
    <View style={styles.trendingSection}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <LinearGradient colors={['#ef4444', '#f97316']} style={styles.sectionIconSmall}>
            <Ionicons name="flame" size={14} color="#fff" />
          </LinearGradient>
          <Text style={[styles.sectionTitleSmall, { color: colors.text }]}>Trending Now</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingScrollContent}
      >
        {TRENDING_TOPICS.map((topic) => (
          <TrendingItem
            key={topic.id}
            item={topic}
            onPress={() => onTopicSelect(topic.text)}
            isDark={isDark}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// QUICK ACTIONS SECTION
// ============================================================================

interface QuickActionsSectionProps {
  onCategorySelect: (category: SearchCategory) => void;
  onFocusInput: () => void;
  colors: ThemeColors;
}

const QUICK_ACTIONS = [
  {
    icon: 'person-add' as const,
    label: 'Find Friends',
    color: '#10b981',
     
    gradient: ['#10b981', '#059669'] as [string, string],
     
    category: 'users' as SearchCategory,
  },
  {
    icon: 'people' as const,
    label: 'Join Groups',
    color: '#f59e0b',
     
    gradient: ['#f59e0b', '#d97706'] as [string, string],
     
    category: 'groups' as SearchCategory,
  },
  {
    icon: 'newspaper' as const,
    label: 'Explore Forums',
    color: '#ec4899',
     
    gradient: ['#ec4899', '#db2777'] as [string, string],
     
    category: 'forums' as SearchCategory,
  },
  {
    icon: 'sparkles' as const,
    label: 'Discover',
    color: '#8b5cf6',
     
    gradient: ['#8b5cf6', '#7c3aed'] as [string, string],
     
    category: 'all' as SearchCategory,
  },
];

/**
 *
 */
export function QuickActionsSection({
  onCategorySelect,
  onFocusInput,
  colors,
}: QuickActionsSectionProps) {
  return (
    <View style={styles.quickActionsSection}>
      <Text style={[styles.sectionTitleSmall, { color: colors.text, marginBottom: 12 }]}>
        Quick Actions
      </Text>
      <View style={styles.quickActionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickActionCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onCategorySelect(action.category);
              onFocusInput();
            }}
          >
            <LinearGradient colors={action.gradient} style={styles.quickActionGradient}>
              <Ionicons name={action.icon} size={24} color="#fff" />
            </LinearGradient>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// SEARCH TIPS
// ============================================================================

interface SearchTipsProps {
  colors: ThemeColors;
}

/**
 *
 */
export function SearchTips({ colors }: SearchTipsProps) {
  return (
    <GlassCard variant="frosted" intensity="subtle" style={styles.tipsCard}>
      <View style={styles.tipsContent}>
        <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={styles.tipsIcon}>
          <Ionicons name="bulb" size={18} color="#fff" />
        </LinearGradient>
        <View style={styles.tipsTextContainer}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Pro Tip</Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            Use the ID search to find users, groups, or forums by their unique identifier
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

// ============================================================================
// COMBINED DISCOVERY SECTION
// ============================================================================

interface DiscoverySectionProps {
  recentSearches: string[];
  onSearchSelect: (search: string) => void;
  onRemoveSearch: (search: string) => void;
  onClearRecentSearches: () => void;
  onCategorySelect: (category: SearchCategory) => void;
  onFocusInput: () => void;
  colors: ThemeColors;
  isDark: boolean;
}

/**
 *
 */
export function DiscoverySection({
  recentSearches,
  onSearchSelect,
  onRemoveSearch,
  onClearRecentSearches,
  onCategorySelect,
  onFocusInput,
  colors,
  isDark,
}: DiscoverySectionProps) {
  return (
    <View style={styles.discoverContainer}>
      <RecentSearchesSection
        recentSearches={recentSearches}
        onSearchSelect={onSearchSelect}
        onRemoveSearch={onRemoveSearch}
        onClearAll={onClearRecentSearches}
        colors={colors}
      />

      <TrendingSection onTopicSelect={onSearchSelect} isDark={isDark} colors={colors} />

      <QuickActionsSection
        onCategorySelect={onCategorySelect}
        onFocusInput={onFocusInput}
        colors={colors}
      />

      <SearchTips colors={colors} />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  discoverContainer: {
    paddingHorizontal: 16,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleSmall: {
    fontSize: 15,
    fontWeight: '600',
  },
  clearText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  recentScrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  recentChipText: {
    fontSize: 14,
    maxWidth: 120,
  },
  trendingSection: {
    marginBottom: 24,
  },
  trendingScrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  quickActionGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  tipsCard: {
    marginBottom: 20,
    borderRadius: 14,
  },
  tipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  tipsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsTextContainer: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  tipsText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
