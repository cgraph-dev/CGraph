/**
 * Badge Selection Screen
 *
 * Allows users to browse earned badges and select one to display on their profile.
 * Profile badge showcase.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/theme-context';
import { SettingsStackParamList } from '../../types';
import api from '../../lib/api';

type NavProp = NativeStackNavigationProp<SettingsStackParamList, 'BadgeSelection'>;

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  earnedAt?: string;
  isEquipped: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
  mythic: '#ef4444',
};

const RARITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  common: 'shield-outline',
  rare: 'shield-half-outline',
  epic: 'shield',
  legendary: 'diamond-outline',
  mythic: 'flame',
};

const FALLBACK_BADGES: Badge[] = [
  {
    id: '1',
    name: 'Early Adopter',
    description: 'Joined during the first wave',
    icon: '🌅',
    rarity: 'rare',
    earnedAt: '2024-01-15',
    isEquipped: false,
  },
  {
    id: '2',
    name: 'First Post',
    description: 'Created your first post',
    icon: '📝',
    rarity: 'common',
    earnedAt: '2024-01-20',
    isEquipped: false,
  },
  {
    id: '3',
    name: 'Social Butterfly',
    description: 'Made 50 friends',
    icon: '🦋',
    rarity: 'epic',
    earnedAt: '2024-03-01',
    isEquipped: true,
  },
  {
    id: '4',
    name: 'Streak Master',
    description: '30-day login streak',
    icon: '🔥',
    rarity: 'legendary',
    earnedAt: '2024-04-10',
    isEquipped: false,
  },
  {
    id: '5',
    name: 'Bug Hunter',
    description: 'Reported a confirmed bug',
    icon: '🐛',
    rarity: 'rare',
    earnedAt: '2024-02-15',
    isEquipped: false,
  },
  {
    id: '6',
    name: 'Verified',
    description: 'Verified your identity',
    icon: '✅',
    rarity: 'common',
    earnedAt: '2024-01-16',
    isEquipped: false,
  },
];

export default function BadgeSelectionScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useTheme();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/users/me/badges');
      const data = res.data?.data ?? res.data;
      setBadges(Array.isArray(data) ? data : FALLBACK_BADGES);
      const equipped = (Array.isArray(data) ? data : FALLBACK_BADGES).find(
        (b: Badge) => b.isEquipped
      );
      if (equipped) setSelectedId(equipped.id);
    } catch {
      setBadges(FALLBACK_BADGES);
      const equipped = FALLBACK_BADGES.find((b) => b.isEquipped);
      if (equipped) setSelectedId(equipped.id);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = useCallback(
    async (badge: Badge) => {
      const previousId = selectedId;
      setSelectedId(badge.id);
      setBadges((prev) =>
        prev.map((b) => ({
          ...b,
          isEquipped: b.id === badge.id,
        }))
      );

      try {
        await api.post('/api/v1/users/me/badge', { badge_id: badge.id });
      } catch {
        // Revert on failure
        setSelectedId(previousId);
        setBadges((prev) =>
          prev.map((b) => ({
            ...b,
            isEquipped: b.id === previousId,
          }))
        );
      }
    },
    [selectedId]
  );

  const renderBadge = ({ item }: { item: Badge }) => {
    const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
    const isSelected = item.id === selectedId;

    return (
      <TouchableOpacity
        style={[
          styles.badgeCard,
          { backgroundColor: colors.surface },
          isSelected && { borderColor: rarityColor, borderWidth: 2 },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.badgeIcon}>{item.icon}</Text>
        <Text style={[styles.badgeName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.badgeDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '20' }]}>
          <Ionicons
            name={RARITY_ICONS[item.rarity] || 'shield-outline'}
            size={12}
            color={rarityColor}
          />
          <Text style={[styles.rarityText, { color: rarityColor }]}>
            {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
          </Text>
        </View>
        {isSelected && (
          <View style={[styles.equippedIndicator, { backgroundColor: rarityColor }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Badges</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {badges.length} badges earned
          </Text>
        </View>
      </View>

      <FlatList
        data={badges}
        renderItem={renderBadge}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No badges earned yet. Keep participating!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 40 },
  row: { gap: 10, marginBottom: 10 },
  badgeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  badgeIcon: { fontSize: 36, marginBottom: 8 },
  badgeName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  badgeDescription: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
  },
  rarityText: { fontSize: 10, fontWeight: '600' },
  equippedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
