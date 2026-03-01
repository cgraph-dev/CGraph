/**
 * EmojiPackBrowser — Mobile emoji pack browser
 *
 * Grid of installed packs with tap-to-expand, marketplace browse,
 * animated emoji preview on press-and-hold, and favorites tab.
 *
 * Lives under screens/settings/custom-emoji/ following existing pattern.
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmojiPack {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  version: string;
  icon_url: string | null;
  emoji_count: number;
  is_premium: boolean;
  is_active: boolean;
  emojis: PackEmoji[];
}

interface PackEmoji {
  id: string;
  shortcode: string;
  image_url: string;
  is_animated: boolean;
}

type TabType = 'installed' | 'marketplace' | 'favorites';

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmojiPackBrowser() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [installedPacks, setInstalledPacks] = useState<EmojiPack[]>([]);
  const [marketplacePacks, setMarketplacePacks] = useState<EmojiPack[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('installed');
  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewEmoji, setPreviewEmoji] = useState<PackEmoji | null>(null);

  // Fetch packs
  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = useCallback(async () => {
    setLoading(true);
    try {
      const [installed, marketplace] = await Promise.all([
        api.get('/api/v1/emoji-packs/installed').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/emoji-packs/marketplace').catch(() => ({ data: { data: [] } })),
      ]);
      setInstalledPacks((installed.data as { data: EmojiPack[] }).data || []);
      setMarketplacePacks((marketplace.data as { data: EmojiPack[] }).data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInstallPack = useCallback(
    async (packId: string) => {
      HapticFeedback.medium();
      try {
        await api.post(`/api/v1/emoji-packs/${packId}/install`);
        Alert.alert('Installed', 'Emoji pack installed successfully');
        fetchPacks();
      } catch {
        Alert.alert('Error', 'Failed to install pack');
      }
    },
    [fetchPacks]
  );

  const handleTogglePack = useCallback(
    (packId: string) => {
      setExpandedPack((prev) => (prev === packId ? null : packId));
      HapticFeedback.light();
    },
    []
  );

  const handleLongPress = useCallback((emoji: PackEmoji) => {
    setPreviewEmoji(emoji);
    HapticFeedback.medium();
  }, []);

  // ─── Render Helpers ────────────────────────────────────

  const renderPackCard = useCallback(
    ({ item: pack }: { item: EmojiPack }) => {
      const isExpanded = expandedPack === pack.id;
      const isMarketplace = activeTab === 'marketplace';

      return (
        <TouchableOpacity
          style={styles.packCard}
          activeOpacity={0.7}
          onPress={() => handleTogglePack(pack.id)}
        >
          <View style={styles.packHeader}>
            <View style={styles.packIconContainer}>
              {pack.icon_url ? (
                <Image source={{ uri: pack.icon_url }} style={styles.packIcon} />
              ) : (
                <View style={styles.packIconFallback}>
                  <Ionicons name="sparkles" size={20} color="#818cf8" />
                </View>
              )}
            </View>
            <View style={styles.packInfo}>
              <View style={styles.packNameRow}>
                <Text style={styles.packName}>{pack.name}</Text>
                {pack.is_premium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )}
              </View>
              <Text style={styles.packMeta}>
                {pack.emoji_count} emojis · v{pack.version}
                {pack.author ? ` · ${pack.author}` : ''}
              </Text>
            </View>
            {isMarketplace ? (
              <TouchableOpacity
                style={styles.installButton}
                onPress={() => handleInstallPack(pack.id)}
              >
                <Ionicons name="download-outline" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9ca3af"
              />
            )}
          </View>

          {/* Expanded emoji grid */}
          {isExpanded && pack.emojis && pack.emojis.length > 0 && (
            <View style={styles.emojiGrid}>
              {pack.emojis.map((emoji) => (
                <Pressable
                  key={emoji.id}
                  style={styles.emojiCell}
                  onLongPress={() => handleLongPress(emoji)}
                  delayLongPress={300}
                >
                  <Image source={{ uri: emoji.image_url }} style={styles.emojiImage} />
                  {emoji.is_animated && <View style={styles.animatedDot} />}
                  <Text style={styles.emojiLabel} numberOfLines={1}>
                    :{emoji.shortcode}:
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [expandedPack, activeTab, handleTogglePack, handleInstallPack, handleLongPress]
  );

  const packs = activeTab === 'marketplace' ? marketplacePacks : installedPacks;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e1b4b', '#111827']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Emoji Packs</Text>
          <Text style={styles.headerSubtitle}>Browse and manage emoji collections</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['installed', 'marketplace', 'favorites'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={
                tab === 'installed'
                  ? 'apps'
                  : tab === 'marketplace'
                    ? 'globe-outline'
                    : 'star-outline'
              }
              size={16}
              color={activeTab === tab ? '#818cf8' : '#9ca3af'}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#818cf8" />
        </View>
      ) : (
        <FlatList
          data={packs}
          renderItem={renderPackCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sparkles-outline" size={48} color="#4b5563" />
              <Text style={styles.emptyText}>
                {activeTab === 'marketplace' ? 'No packs available' : 'No packs installed'}
              </Text>
            </View>
          }
        />
      )}

      {/* Animated preview overlay */}
      {previewEmoji && (
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewEmoji(null)}>
          <View style={styles.previewCard}>
            <Image
              source={{ uri: previewEmoji.image_url }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            <Text style={styles.previewLabel}>:{previewEmoji.shortcode}:</Text>
            {previewEmoji.is_animated && (
              <Text style={styles.previewAnimated}>Animated</Text>
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  activeTab: {
    backgroundColor: 'rgba(129,140,248,0.15)',
  },
  tabText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#818cf8',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  packCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packIconContainer: {
    marginRight: 12,
  },
  packIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  packIconFallback: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(129,140,248,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packInfo: {
    flex: 1,
  },
  packNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  premiumBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumText: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
  },
  packMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  installButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#818cf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 4,
  },
  emojiCell: {
    width: 56,
    alignItems: 'center',
    paddingVertical: 4,
  },
  emojiImage: {
    width: 32,
    height: 32,
  },
  animatedDot: {
    position: 'absolute',
    top: 2,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a855f7',
  },
  emojiLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
    maxWidth: 56,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  previewImage: {
    width: 96,
    height: 96,
  },
  previewLabel: {
    fontSize: 16,
    color: '#fff',
    marginTop: 12,
    fontWeight: '500',
  },
  previewAnimated: {
    fontSize: 12,
    color: '#a855f7',
    marginTop: 4,
    fontWeight: '500',
  },
});
