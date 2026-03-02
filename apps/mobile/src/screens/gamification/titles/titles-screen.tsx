/**
 * TitlesScreen - Main Screen
 *
 * Title collection and management screen where users can view all titles,
 * equip/unequip titles, and purchase new titles from the shop.
 *
 * @version 1.0.0
 * @since v0.8.3
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TitleBadge } from '@/components/gamification';
import { useGamification } from '@/hooks/useGamification';
import { useGamificationStore } from '@/stores/gamificationStore';
import api from '@/lib/api';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { type TitleRarity, type TitleTab, type UserTitle, RARITIES, RARITY_COLORS, TABS, transformTitle } from './types';
import { TitleCard } from './title-card';
import { styles } from './styles';

/**
 *
 */
export default function TitlesScreen() {
  const navigation = useNavigation();
  const { stats, refreshStats, isLoading } = useGamification();
  const { equipTitle, unequipTitle } = useGamificationStore();

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
        const response = await api.get('/api/v1/gamification/titles');
        const data = response.data?.data || response.data || [];
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
        setTitles((prev) =>
          prev.map((t) => ({
            ...t,
            equipped: t.id === titleId,
          }))
        );

        await equipTitle(titleId);
        HapticFeedback.success();
      } catch (_error) {
        HapticFeedback.error();
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
      await unequipTitle();
      HapticFeedback.success();
    } catch (_error) {
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
                await api.post(`/api/v1/gamification/titles/${titleId}/purchase`);
                setTitles((prev) =>
                  prev.map((t) => (t.id === titleId ? { ...t, owned: true } : t))
                );
                await refreshStats();
                HapticFeedback.success();
                Alert.alert('Success!', `You now own the "${title.name}" title!`);
              } catch (_error) {
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
      const [, response] = await Promise.all([
        refreshStats(),
        api.get('/api/v1/gamification/titles'),
      ]);
      const data = response.data?.data || response.data || [];
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
              name={tab.icon}
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
