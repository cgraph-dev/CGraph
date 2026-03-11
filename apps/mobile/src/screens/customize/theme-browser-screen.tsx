/**
 * Theme Browser Screen — browse and equip visual themes.
 *
 * 5 theme sections: Profile, Chat, Forum, App, and Secret (locked/unlockable).
 * Grid layout (2 columns) with theme preview cards showing gradient,
 * name, rarity badge, and equip button. Secret themes show locked state
 * with Nodes unlock price.
 *
 * @module screens/customize/theme-browser-screen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { LinearGradient } from 'expo-linear-gradient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThemeSection = 'profile' | 'chat' | 'forum' | 'app' | 'secret';
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface ThemeCard {
  readonly id: string;
  readonly name: string;
  readonly section: ThemeSection;
  readonly rarity: Rarity;
  readonly gradient: [string, string];
  readonly isEquipped: boolean;
  readonly isLocked: boolean;
  readonly unlockPrice?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_GAP) / 2;

const SECTIONS: { key: ThemeSection; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'profile', label: 'Profile', icon: 'person-outline' },
  { key: 'chat', label: 'Chat', icon: 'chatbubbles-outline' },
  { key: 'forum', label: 'Forum', icon: 'reader-outline' },
  { key: 'app', label: 'App', icon: 'apps-outline' },
  { key: 'secret', label: 'Secret', icon: 'lock-closed-outline' },
];

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ec4899',
};

// Placeholder theme data
const PLACEHOLDER_THEMES: ThemeCard[] = [
  {
    id: 'p1',
    name: 'Matrix Green',
    section: 'profile',
    rarity: 'common',
    gradient: ['#10b981', '#059669'],
    isEquipped: true,
    isLocked: false,
  },
  {
    id: 'p2',
    name: 'Ocean Depths',
    section: 'profile',
    rarity: 'rare',
    gradient: ['#3b82f6', '#1e40af'],
    isEquipped: false,
    isLocked: false,
  },
  {
    id: 'p3',
    name: 'Sunset Blaze',
    section: 'profile',
    rarity: 'epic',
    gradient: ['#f59e0b', '#dc2626'],
    isEquipped: false,
    isLocked: false,
  },
  {
    id: 'c1',
    name: 'Midnight',
    section: 'chat',
    rarity: 'common',
    gradient: ['#1e293b', '#0f172a'],
    isEquipped: true,
    isLocked: false,
  },
  {
    id: 'c2',
    name: 'Aurora',
    section: 'chat',
    rarity: 'uncommon',
    gradient: ['#6366f1', '#8b5cf6'],
    isEquipped: false,
    isLocked: false,
  },
  {
    id: 'f1',
    name: 'Clean Slate',
    section: 'forum',
    rarity: 'common',
    gradient: ['#f8fafc', '#e2e8f0'],
    isEquipped: true,
    isLocked: false,
  },
  {
    id: 'f2',
    name: 'Dark Academic',
    section: 'forum',
    rarity: 'rare',
    gradient: ['#292524', '#44403c'],
    isEquipped: false,
    isLocked: false,
  },
  {
    id: 'a1',
    name: 'Default',
    section: 'app',
    rarity: 'common',
    gradient: ['#10b981', '#047857'],
    isEquipped: true,
    isLocked: false,
  },
  {
    id: 'a2',
    name: 'Cyberpunk',
    section: 'app',
    rarity: 'legendary',
    gradient: ['#ec4899', '#8b5cf6'],
    isEquipped: false,
    isLocked: false,
  },
  {
    id: 's1',
    name: 'Void Walker',
    section: 'secret',
    rarity: 'mythic',
    gradient: ['#000000', '#1a1a2e'],
    isEquipped: false,
    isLocked: true,
    unlockPrice: 500,
  },
  {
    id: 's2',
    name: 'Celestial',
    section: 'secret',
    rarity: 'legendary',
    gradient: ['#fbbf24', '#f97316'],
    isEquipped: false,
    isLocked: true,
    unlockPrice: 300,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Theme browser with sectioned grid of equippable themes.
 */
export default function ThemeBrowserScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const [activeSection, setActiveSection] = useState<ThemeSection>('profile');

  const filteredThemes = PLACEHOLDER_THEMES.filter((t) => t.section === activeSection);

  const handleEquip = useCallback((_themeId: string) => {
    // TODO: integrate with customization store
  }, []);

  const handleUnlock = useCallback((_themeId: string, _price: number) => {
    // TODO: integrate with nodes store
  }, []);

  const renderThemeCard = useCallback(
    ({ item }: { item: ThemeCard }) => {
      const rarityColor = RARITY_COLORS[item.rarity];

      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Preview gradient */}
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardPreview}
          >
            {item.isLocked && (
              <View style={styles.lockedOverlay}>
                <Ionicons name="lock-closed" size={24} color="#fff" />
              </View>
            )}
          </LinearGradient>

          {/* Theme info */}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>

            {/* Rarity badge */}
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '22' }]}>
              <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
              <Text style={[styles.rarityText, { color: rarityColor }]}>{item.rarity}</Text>
            </View>

            {/* Action button */}
            {item.isLocked ? (
              <TouchableOpacity
                style={[styles.equipButton, { backgroundColor: '#f59e0b' }]}
                onPress={() => handleUnlock(item.id, item.unlockPrice ?? 0)}
                activeOpacity={0.7}
              >
                <Ionicons name="diamond-outline" size={14} color="#fff" />
                <Text style={styles.equipButtonText}>{item.unlockPrice} Nodes</Text>
              </TouchableOpacity>
            ) : item.isEquipped ? (
              <View style={[styles.equipButton, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={styles.equipButtonText}>Equipped</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.equipButton,
                  { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 },
                ]}
                onPress={() => handleEquip(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.equipButtonText, { color: colors.primary }]}>Equip</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [colors, handleEquip, handleUnlock]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Themes</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Customize your look
          </Text>
        </View>
      </View>

      {/* Section tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionTabs}
      >
        {SECTIONS.map((sec) => {
          const isActive = sec.key === activeSection;
          return (
            <TouchableOpacity
              key={sec.key}
              onPress={() => setActiveSection(sec.key)}
              activeOpacity={0.7}
              style={[
                styles.sectionTab,
                isActive
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <Ionicons
                name={sec.icon}
                size={16}
                color={isActive ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[styles.sectionTabText, { color: isActive ? '#fff' : colors.textSecondary }]}
              >
                {sec.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Theme grid */}
      <FlatList
        data={filteredThemes}
        renderItem={renderThemeCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="color-palette-outline" size={48} color={colors.textSecondary + '44'} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No themes in this category yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
  sectionTabs: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridContent: {
    padding: 16,
    paddingBottom: 40,
  },
  gridRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardPreview: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: 10,
    gap: 6,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  equipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  equipButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});
