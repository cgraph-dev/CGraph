/**
 * TitlesScreen - Mobile
 *
 * Title collection and management screen where users can view all titles,
 * equip/unequip titles, and purchase new titles from the shop.
 *
 * Features:
 * - Tab-based filtering (Owned, All, Shop)
 * - Rarity filtering
 * - Title equipping with haptic feedback
 * - Shop integration for purchasing
 * - Premium title indicators
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
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TitleBadge } from '@/components/gamification';
import { useGamification } from '@/hooks/useGamification';
import gamificationService from '@/services/gamificationService';
import { HapticFeedback } from '@/lib/animations/animation-engine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

type TitleTab = 'owned' | 'all' | 'shop';
type TitleRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'unique';

interface Title {
  id: string;
  name: string;
  description: string;
  rarity: TitleRarity;
  category: string;
  requirement?: string;
  price?: number;
  isPremium?: boolean;
}

interface UserTitle extends Title {
  owned: boolean;
  equipped: boolean;
  acquiredAt?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS: { id: TitleTab; name: string; icon: string }[] = [
  { id: 'owned', name: 'Owned', icon: 'ribbon' },
  { id: 'all', name: 'All Titles', icon: 'list' },
  { id: 'shop', name: 'Shop', icon: 'cart' },
];

const RARITY_COLORS: Record<
  TitleRarity,
  { bg: string; text: string; border: string; gradient: [string, string] }
> = {
  common: { bg: '#374151', text: '#9ca3af', border: '#4b5563', gradient: ['#374151', '#1f2937'] },
  uncommon: { bg: '#064e3b', text: '#34d399', border: '#10b981', gradient: ['#064e3b', '#022c22'] },
  rare: { bg: '#1e3a8a', text: '#60a5fa', border: '#3b82f6', gradient: ['#1e3a8a', '#1e1b4b'] },
  epic: { bg: '#581c87', text: '#c084fc', border: '#a855f7', gradient: ['#581c87', '#3b0764'] },
  legendary: {
    bg: '#78350f',
    text: '#fcd34d',
    border: '#f59e0b',
    gradient: ['#78350f', '#451a03'],
  },
  mythic: { bg: '#831843', text: '#f472b6', border: '#ec4899', gradient: ['#831843', '#500724'] },
  unique: { bg: '#7f1d1d', text: '#fca5a5', border: '#ef4444', gradient: ['#7f1d1d', '#450a0a'] },
};

const RARITIES: { id: TitleRarity | 'all'; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'common', name: 'Common' },
  { id: 'uncommon', name: 'Uncommon' },
  { id: 'rare', name: 'Rare' },
  { id: 'epic', name: 'Epic' },
  { id: 'legendary', name: 'Legendary' },
  { id: 'mythic', name: 'Mythic' },
  { id: 'unique', name: 'Unique' },
];

// Transform API title to UserTitle format
function transformTitle(
  apiTitle: Record<string, unknown>,
  equippedTitleId: string | null
): UserTitle {
  return {
    id: apiTitle.id,
    name: apiTitle.name,
    description: apiTitle.description || '',
    rarity: (apiTitle.rarity || 'common') as TitleRarity,
    category: apiTitle.category || 'general',
    owned: apiTitle.owned ?? false,
    equipped: apiTitle.id === equippedTitleId,
    acquiredAt: apiTitle.acquired_at || apiTitle.acquiredAt,
    requirement: apiTitle.requirement,
    price: apiTitle.price,
    isPremium: apiTitle.is_premium || apiTitle.isPremium,
  };
}

// ============================================================================
// TITLE CARD
// ============================================================================

interface TitleCardProps {
  title: UserTitle;
  onEquip: (titleId: string) => void;
  onUnequip: () => void;
  onPurchase: (titleId: string) => void;
  currentCoins: number;
}

function TitleCard({ title, onEquip, onUnequip, onPurchase, currentCoins }: TitleCardProps) {
  const colors = RARITY_COLORS[title.rarity];
  const canAfford = title.price ? currentCoins >= title.price : true;

  const handleAction = () => {
    HapticFeedback.medium();
    if (title.equipped) {
      onUnequip();
    } else if (title.owned) {
      onEquip(title.id);
    } else if (title.price && canAfford) {
      onPurchase(title.id);
    }
  };

  return (
    <View style={[styles.titleCard, { borderColor: title.owned ? colors.border : '#37415180' }]}>
      <LinearGradient
        colors={title.owned ? colors.gradient : ['#1f2937', '#111827']}
        style={styles.titleGradient}
      >
        {/* Header with rarity badge */}
        <View style={styles.titleHeader}>
          <View
            style={[styles.rarityBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}
          >
            <Text style={[styles.rarityText, { color: colors.text }]}>
              {title.rarity.charAt(0).toUpperCase() + title.rarity.slice(1)}
            </Text>
          </View>

          {title.equipped && (
            <View style={styles.equippedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.equippedText}>Equipped</Text>
            </View>
          )}

          {title.isPremium && !title.owned && (
            <View style={styles.premiumBadge}>
              <Ionicons name="diamond" size={14} color="#f59e0b" />
            </View>
          )}
        </View>

        {/* Title Name with TitleBadge */}
        <View style={styles.titleNameRow}>
          <TitleBadge title={title.name} rarity={title.rarity} size="md" />
        </View>

        {/* Description */}
        <Text style={styles.titleDescription}>{title.description}</Text>

        {/* Requirement or Price */}
        {!title.owned && (
          <View style={styles.requirementContainer}>
            {title.requirement && (
              <View style={styles.requirementRow}>
                <Ionicons name="lock-closed" size={14} color="#6b7280" />
                <Text style={styles.requirementText}>{title.requirement}</Text>
              </View>
            )}
            {title.price && (
              <View style={styles.priceRow}>
                <Text style={styles.coinEmoji}>🪙</Text>
                <Text style={[styles.priceText, !canAfford && styles.priceTextDisabled]}>
                  {(title.price ?? 0).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        {title.owned ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              title.equipped ? styles.unequipButton : { backgroundColor: colors.border },
            ]}
            onPress={handleAction}
          >
            <Ionicons name={title.equipped ? 'close-circle' : 'ribbon'} size={16} color="#fff" />
            <Text style={styles.actionButtonText}>
              {title.equipped ? 'Unequip' : 'Equip Title'}
            </Text>
          </TouchableOpacity>
        ) : title.price ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: canAfford ? '#f59e0b' : '#374151' }]}
            onPress={handleAction}
            disabled={!canAfford}
          >
            <Ionicons name="cart" size={16} color={canAfford ? '#fff' : '#6b7280'} />
            <Text style={[styles.actionButtonText, !canAfford && { color: '#6b7280' }]}>
              {canAfford ? 'Purchase' : 'Not enough coins'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lockedBadge}>
            <Ionicons name="lock-closed" size={16} color="#6b7280" />
            <Text style={styles.lockedText}>Locked</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function TitlesScreen() {
  const navigation = useNavigation();
  const { stats, refreshStats, isLoading } = useGamification();

  const [activeTab, setActiveTab] = useState<TitleTab>('owned');
  const [selectedRarity, setSelectedRarity] = useState<TitleRarity | 'all'>('all');
  const [titles, setTitles] = useState<UserTitle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [titlesLoading, setTitlesLoading] = useState(true);
  const [titlesError, setTitlesError] = useState<string | null>(null);

  const currentCoins = stats?.coins || 0;
  const currentTitle = stats?.currentTitle || null;
  const equippedTitleId = stats?.equippedTitleId || null;

  // Fetch titles from API
  useEffect(() => {
    let isMounted = true;

    const fetchTitles = async () => {
      setTitlesLoading(true);
      setTitlesError(null);
      try {
        const data = await gamificationService.getTitles();
        if (isMounted) {
          const userTitles = data.map((t: Record<string, unknown>) =>
            transformTitle(t, equippedTitleId)
          );
          setTitles(userTitles);
        }
      } catch (error) {
        console.error('[TitlesScreen] Failed to fetch titles:', error);
        if (isMounted) {
          setTitlesError('Failed to load titles. Pull to refresh.');
        }
      } finally {
        if (isMounted) {
          setTitlesLoading(false);
        }
      }
    };

    fetchTitles();

    return () => {
      isMounted = false;
    };
  }, [equippedTitleId]);

  // Filter titles based on tab and rarity
  const displayedTitles = useMemo(() => {
    let filtered = titles;

    // Filter by tab
    switch (activeTab) {
      case 'owned':
        filtered = filtered.filter((t) => t.owned);
        break;
      case 'shop':
        filtered = filtered.filter((t) => !t.owned && t.price);
        break;
      // 'all' shows everything
    }

    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter((t) => t.rarity === selectedRarity);
    }

    return filtered;
  }, [titles, activeTab, selectedRarity]);

  // Stats
  const ownedCount = useMemo(() => titles.filter((t) => t.owned).length, [titles]);
  const totalCount = titles.length;

  const handleEquip = useCallback(
    async (titleId: string) => {
      try {
        // Update local state optimistically
        setTitles((prev) =>
          prev.map((t) => ({
            ...t,
            equipped: t.id === titleId,
          }))
        );

        // Call API
        await gamificationService.equipTitle(titleId);
        HapticFeedback.success();
      } catch (error) {
        HapticFeedback.error();
        // Revert on error
        setTitles((prev) =>
          prev.map((t) => ({
            ...t,
            equipped: t.name === currentTitle,
          }))
        );
        Alert.alert('Error', 'Failed to equip title');
      }
    },
    [currentTitle]
  );

  const handleUnequip = useCallback(async () => {
    try {
      setTitles((prev) => prev.map((t) => ({ ...t, equipped: false })));
      await gamificationService.unequipTitle();
      HapticFeedback.success();
    } catch (error) {
      HapticFeedback.error();
      Alert.alert('Error', 'Failed to unequip title');
    }
  }, []);

  const handlePurchase = useCallback(
    async (titleId: string) => {
      const title = titles.find((t) => t.id === titleId);
      if (!title || !title.price) return;

      Alert.alert(
        'Purchase Title',
        `Do you want to purchase "${title.name}" for ${(title.price ?? 0).toLocaleString()} coins?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Purchase',
            onPress: async () => {
              try {
                await gamificationService.purchaseTitle(titleId);
                setTitles((prev) =>
                  prev.map((t) => (t.id === titleId ? { ...t, owned: true } : t))
                );
                await refreshStats();
                HapticFeedback.success();
                Alert.alert('Success!', `You now own the "${title.name}" title!`);
              } catch (error) {
                HapticFeedback.error();
                Alert.alert('Error', 'Failed to purchase title');
              }
            },
          },
        ]
      );
    },
    [titles, refreshStats]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTitlesError(null);
    HapticFeedback.light();
    try {
      const [, data] = await Promise.all([refreshStats(), gamificationService.getTitles()]);
      const userTitles = data.map((t: Record<string, unknown>) =>
        transformTitle(t, equippedTitleId)
      );
      setTitles(userTitles);
    } catch (error) {
      console.error('[TitlesScreen] Refresh failed:', error);
      setTitlesError('Failed to refresh titles.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshStats, equippedTitleId]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1f2937', '#111827']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Titles</Text>
          <Text style={styles.headerSubtitle}>
            {ownedCount} / {totalCount} collected
          </Text>
        </View>

        <View style={styles.headerCoins}>
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.coinsText}>{(currentCoins ?? 0).toLocaleString()}</Text>
        </View>
      </LinearGradient>

      {/* Current Title */}
      {currentTitle && (
        <View style={styles.currentTitleContainer}>
          <Text style={styles.currentTitleLabel}>Current Title:</Text>
          <TitleBadge
            title={currentTitle}
            rarity={titles.find((t) => t.name === currentTitle)?.rarity || 'common'}
            size="md"
          />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              HapticFeedback.light();
              setActiveTab(tab.id);
            }}
          >
            <Ionicons
              name={tab.icon as string}
              size={18}
              color={activeTab === tab.id ? '#8b5cf6' : '#6b7280'}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
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

      {/* Titles List */}
      <FlatList
        data={displayedTitles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TitleCard
            title={item}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            onPurchase={handlePurchase}
            currentCoins={currentCoins}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={handleRefresh}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {titlesLoading ? (
              <>
                <Ionicons name="hourglass-outline" size={48} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>Loading titles...</Text>
              </>
            ) : titlesError ? (
              <>
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text style={styles.emptyTitle}>Error</Text>
                <Text style={styles.emptySubtitle}>{titlesError}</Text>
              </>
            ) : (
              <>
                <Ionicons name="ribbon-outline" size={48} color="#4b5563" />
                <Text style={styles.emptyTitle}>
                  {activeTab === 'owned' ? 'No titles owned yet' : 'No titles available'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'owned'
                    ? 'Unlock titles by completing achievements'
                    : 'Check back later for new titles'}
                </Text>
              </>
            )}
          </View>
        }
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
  headerCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#78350f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  coinEmoji: {
    fontSize: 16,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fcd34d',
  },
  currentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f2937',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    gap: 12,
  },
  currentTitleLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 4,
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
  tabActive: {
    backgroundColor: '#374151',
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#8b5cf6',
  },
  rarityFilter: {
    height: 40,
    marginTop: 4,
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
  titleCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  titleGradient: {
    padding: 16,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  equippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  equippedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  premiumBadge: {
    marginLeft: 'auto',
    padding: 4,
  },
  titleNameRow: {
    marginBottom: 8,
  },
  titleDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
    lineHeight: 20,
  },
  requirementContainer: {
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 13,
    color: '#6b7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fcd34d',
  },
  priceTextDisabled: {
    color: '#6b7280',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  unequipButton: {
    backgroundColor: '#4b5563',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  lockedText: {
    fontSize: 14,
    color: '#6b7280',
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
    textAlign: 'center',
  },
});
