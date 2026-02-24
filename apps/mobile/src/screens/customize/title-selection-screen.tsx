/**
 * Title Selection Screen
 *
 * Allows users to browse and equip earned titles.
 * Titles appear under the user's name throughout the app.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { SettingsStackParamList } from '../../types';
import api from '../../lib/api';

type NavProp = NativeStackNavigationProp<SettingsStackParamList, 'TitleSelection'>;

interface Title {
  id: string;
  name: string;
  description: string;
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

const FALLBACK_TITLES: Title[] = [
  {
    id: '1',
    name: 'Newcomer',
    description: 'Welcome to the community',
    rarity: 'common',
    earnedAt: '2024-01-15',
    isEquipped: false,
  },
  {
    id: '2',
    name: 'Conversationalist',
    description: 'Sent 100 messages',
    rarity: 'common',
    earnedAt: '2024-02-01',
    isEquipped: false,
  },
  {
    id: '3',
    name: 'Forum Regular',
    description: 'Active forum participant',
    rarity: 'rare',
    earnedAt: '2024-02-20',
    isEquipped: true,
  },
  {
    id: '4',
    name: 'Trailblazer',
    description: 'Among the first 100 users',
    rarity: 'epic',
    earnedAt: '2024-01-15',
    isEquipped: false,
  },
  {
    id: '5',
    name: 'Community Hero',
    description: 'Outstanding community contributions',
    rarity: 'legendary',
    earnedAt: '2024-05-01',
    isEquipped: false,
  },
];

export default function TitleSelectionScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useThemeStore();
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/users/me/titles');
      const data = res.data?.data ?? res.data;
      setTitles(Array.isArray(data) ? data : FALLBACK_TITLES);
      const equipped = (Array.isArray(data) ? data : FALLBACK_TITLES).find(
        (t: Title) => t.isEquipped
      );
      if (equipped) setSelectedId(equipped.id);
    } catch {
      setTitles(FALLBACK_TITLES);
      const equipped = FALLBACK_TITLES.find((t) => t.isEquipped);
      if (equipped) setSelectedId(equipped.id);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = useCallback(
    async (title: Title) => {
      const previousId = selectedId;
      setSelectedId(title.id);
      setTitles((prev) => prev.map((t) => ({ ...t, isEquipped: t.id === title.id })));

      try {
        await api.post('/api/v1/users/me/title', { title_id: title.id });
      } catch {
        setSelectedId(previousId);
        setTitles((prev) => prev.map((t) => ({ ...t, isEquipped: t.id === previousId })));
      }
    },
    [selectedId]
  );

  const renderTitle = ({ item }: { item: Title }) => {
    const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
    const isSelected = item.id === selectedId;

    return (
      <TouchableOpacity
        style={[
          styles.titleCard,
          { backgroundColor: colors.surface },
          isSelected && { borderColor: rarityColor, borderWidth: 2 },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.titleRow}>
          <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
          <View style={styles.titleContent}>
            <Text style={[styles.titleName, { color: rarityColor }]}>{item.name}</Text>
            <Text style={[styles.titleDescription, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
          </View>
          {isSelected && (
            <View style={[styles.checkCircle, { backgroundColor: rarityColor }]}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          )}
        </View>
        <View style={[styles.rarityTag, { backgroundColor: rarityColor + '15' }]}>
          <Text style={[styles.rarityTagText, { color: rarityColor }]}>
            {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
          </Text>
        </View>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Titles</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {titles.length} titles earned
          </Text>
        </View>
      </View>

      {/* Remove None button */}
      <TouchableOpacity
        style={[styles.removeCard, { backgroundColor: colors.surface }]}
        onPress={() => {
          setSelectedId(null);
          setTitles((prev) => prev.map((t) => ({ ...t, isEquipped: false })));
          api.post('/api/v1/users/me/title', { title_id: null }).catch(() => {});
        }}
      >
        <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
        <Text style={[styles.removeText, { color: colors.textSecondary }]}>
          Remove current title
        </Text>
      </TouchableOpacity>

      <FlatList
        data={titles}
        renderItem={renderTitle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No titles earned yet. Keep participating!
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
  removeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
  },
  removeText: { fontSize: 14 },
  listContent: { padding: 16, paddingBottom: 40 },
  titleCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  titleContent: { flex: 1 },
  titleName: { fontSize: 16, fontWeight: '700' },
  titleDescription: { fontSize: 12, marginTop: 2 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 8,
    marginLeft: 20,
  },
  rarityTagText: { fontSize: 10, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
