import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { ForumsStackParamList } from '../../types';

// =============================================================================
// PLUGIN MARKETPLACE SCREEN
// =============================================================================
// A comprehensive plugin marketplace for forums:
// - Browse available plugins by category
// - Search and filter plugins
// - Install/uninstall plugins
// - View plugin details, ratings, reviews
// - Manage installed plugins
// =============================================================================

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'PluginMarketplace'>;
  route: RouteProp<ForumsStackParamList, 'PluginMarketplace'>;
};

interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  version: string;
  author: {
    id: string;
    name: string;
    verified: boolean;
  };
  icon_url?: string;
  banner_url?: string;
  category: PluginCategory;
  tags: string[];
  rating: number;
  review_count: number;
  install_count: number;
  is_installed: boolean;
  is_official: boolean;
  is_premium: boolean;
  price?: number;
  updated_at: string;
  permissions: string[];
}

type PluginCategory =
  | 'moderation'
  | 'analytics'
  | 'automation'
  | 'content'
  | 'integration'
  | 'customization'
  | 'games'
  | 'utility';

type TabType = 'browse' | 'installed';

const CATEGORIES: { key: PluginCategory; label: string; icon: string }[] = [
  { key: 'moderation', label: 'Moderation', icon: 'shield-checkmark-outline' },
  { key: 'analytics', label: 'Analytics', icon: 'analytics-outline' },
  { key: 'automation', label: 'Automation', icon: 'flash-outline' },
  { key: 'content', label: 'Content', icon: 'document-text-outline' },
  { key: 'integration', label: 'Integrations', icon: 'git-network-outline' },
  { key: 'customization', label: 'Customize', icon: 'color-palette-outline' },
  { key: 'games', label: 'Games', icon: 'game-controller-outline' },
  { key: 'utility', label: 'Utility', icon: 'construct-outline' },
];

export default function PluginMarketplaceScreen({ navigation, route }: Props) {
  const { forumId } = route.params || {};
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: 'Plugin Marketplace',
    });
    fetchPlugins();
  }, [forumId]);

  const fetchPlugins = async () => {
    try {
      const [browseResponse, installedResponse] = await Promise.all([
        api.get('/api/v1/plugins', {
          params: {
            category: selectedCategory,
            search: searchQuery || undefined,
          },
        }),
        forumId
          ? api.get(`/api/v1/forums/${forumId}/plugins`)
          : Promise.resolve({ data: { data: [] } }),
      ]);
      setPlugins(browseResponse.data?.data || []);
      setInstalledPlugins(installedResponse.data?.data || []);
    } catch (error) {
      console.error('Error fetching plugins:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlugins();
  }, [selectedCategory, searchQuery, forumId]);

  const handleSearch = useCallback(() => {
    setIsLoading(true);
    fetchPlugins();
  }, [searchQuery, selectedCategory]);

  const handleCategorySelect = (category: PluginCategory | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
    setIsLoading(true);
    fetchPlugins();
  };

  const handleInstallPlugin = async (plugin: Plugin) => {
    if (!forumId) {
      Alert.alert('Select Forum', 'Please select a forum to install this plugin.');
      return;
    }

    if (plugin.is_premium && plugin.price) {
      Alert.alert(
        'Premium Plugin',
        `This plugin costs $${plugin.price.toFixed(2)}. Would you like to purchase it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Purchase', onPress: () => processPurchase(plugin) },
        ]
      );
      return;
    }

    await installPlugin(plugin);
  };

  const processPurchase = async (plugin: Plugin) => {
    // In production, this would integrate with a payment processor
    Alert.alert('Coming Soon', 'Premium plugin purchases will be available soon.');
  };

  const installPlugin = async (plugin: Plugin) => {
    try {
      setInstallingId(plugin.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await api.post(`/api/v1/forums/${forumId}/plugins`, {
        plugin_id: plugin.id,
      });

      // Update local state
      setPlugins((prev) =>
        prev.map((p) => (p.id === plugin.id ? { ...p, is_installed: true } : p))
      );
      setInstalledPlugins((prev) => [...prev, { ...plugin, is_installed: true }]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `${plugin.name} has been installed.`);
    } catch (error) {
      console.error('Error installing plugin:', error);
      Alert.alert('Error', 'Failed to install plugin. Please try again.');
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstallPlugin = async (plugin: Plugin) => {
    Alert.alert(
      'Uninstall Plugin',
      `Are you sure you want to uninstall ${plugin.name}? This may affect forum functionality.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            try {
              setInstallingId(plugin.id);
              await api.delete(`/api/v1/forums/${forumId}/plugins/${plugin.id}`);

              setPlugins((prev) =>
                prev.map((p) => (p.id === plugin.id ? { ...p, is_installed: false } : p))
              );
              setInstalledPlugins((prev) => prev.filter((p) => p.id !== plugin.id));

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error uninstalling plugin:', error);
              Alert.alert('Error', 'Failed to uninstall plugin.');
            } finally {
              setInstallingId(null);
            }
          },
        },
      ]
    );
  };

  const openPluginDetail = (plugin: Plugin) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlugin(plugin);
    setDetailModalVisible(true);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={14}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ key: null, label: 'All', icon: 'apps-outline' }, ...CATEGORIES]}
        keyExtractor={(item) => item.key || 'all'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === item.key ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => handleCategorySelect(item.key as PluginCategory | null)}
          >
            <Ionicons
              name={item.icon as unknown}
              size={16}
              color={selectedCategory === item.key ? '#fff' : colors.text}
            />
            <Text
              style={[
                styles.categoryLabel,
                { color: selectedCategory === item.key ? '#fff' : colors.text },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );

  const renderPluginItem = ({ item }: { item: Plugin }) => {
    const isInstalling = installingId === item.id;

    return (
      <TouchableOpacity
        style={[styles.pluginCard, { backgroundColor: colors.surface }]}
        onPress={() => openPluginDetail(item)}
        activeOpacity={0.7}
      >
        {/* Plugin icon */}
        <View style={styles.pluginIconContainer}>
          {item.icon_url ? (
            <Image source={{ uri: item.icon_url }} style={styles.pluginIcon} />
          ) : (
            <View style={[styles.pluginIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="extension-puzzle" size={24} color="#fff" />
            </View>
          )}
          {item.is_official && (
            <View style={[styles.officialBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
            </View>
          )}
        </View>

        {/* Plugin info */}
        <View style={styles.pluginInfo}>
          <View style={styles.pluginHeader}>
            <Text style={[styles.pluginName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.is_premium && (
              <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' + '30' }]}>
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            )}
          </View>

          <Text style={[styles.pluginAuthor, { color: colors.textSecondary }]}>
            by {item.author.name}
            {item.author.verified && (
              <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
            )}
          </Text>

          <Text
            style={[styles.pluginDescription, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.short_description || item.description}
          </Text>

          <View style={styles.pluginMeta}>
            <View style={styles.ratingContainer}>
              {renderStars(item.rating)}
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                ({item.review_count})
              </Text>
            </View>
            <Text style={[styles.installCount, { color: colors.textSecondary }]}>
              {(item?.install_count ?? 0).toLocaleString()} installs
            </Text>
          </View>
        </View>

        {/* Install button */}
        <TouchableOpacity
          style={[
            styles.installButton,
            {
              backgroundColor: item.is_installed ? colors.surface : colors.primary,
              borderColor: colors.primary,
              borderWidth: item.is_installed ? 1 : 0,
            },
          ]}
          onPress={() =>
            item.is_installed ? handleUninstallPlugin(item) : handleInstallPlugin(item)
          }
          disabled={isInstalling}
        >
          {isInstalling ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.installButtonText,
                { color: item.is_installed ? colors.primary : '#fff' },
              ]}
            >
              {item.is_installed ? 'Remove' : item.is_premium ? `$${item.price}` : 'Install'}
            </Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedPlugin) return null;

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Plugin Details</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Banner */}
          {selectedPlugin.banner_url && (
            <Image source={{ uri: selectedPlugin.banner_url }} style={styles.pluginBanner} />
          )}

          {/* Content */}
          <View style={styles.modalContent}>
            <View style={styles.detailHeader}>
              {selectedPlugin.icon_url ? (
                <Image source={{ uri: selectedPlugin.icon_url }} style={styles.detailIcon} />
              ) : (
                <View style={[styles.detailIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="extension-puzzle" size={32} color="#fff" />
                </View>
              )}
              <View style={styles.detailInfo}>
                <Text style={[styles.detailName, { color: colors.text }]}>
                  {selectedPlugin.name}
                </Text>
                <Text style={[styles.detailAuthor, { color: colors.textSecondary }]}>
                  by {selectedPlugin.author.name}
                </Text>
                <Text style={[styles.detailVersion, { color: colors.textSecondary }]}>
                  v{selectedPlugin.version}
                </Text>
              </View>
            </View>

            <View style={styles.detailStats}>
              <View style={styles.detailStat}>
                <Text style={[styles.detailStatValue, { color: colors.text }]}>
                  {selectedPlugin.rating.toFixed(1)}
                </Text>
                <View style={styles.ratingContainer}>{renderStars(selectedPlugin.rating)}</View>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.detailStat}>
                <Text style={[styles.detailStatValue, { color: colors.text }]}>
                  {(selectedPlugin?.install_count ?? 0).toLocaleString()}
                </Text>
                <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>
                  Installs
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.detailStat}>
                <Text style={[styles.detailStatValue, { color: colors.text }]}>
                  {selectedPlugin.review_count}
                </Text>
                <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>
                  Reviews
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.detailDescription, { color: colors.textSecondary }]}>
              {selectedPlugin.description}
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Permissions</Text>
            <View style={styles.permissionsList}>
              {selectedPlugin.permissions.map((permission, index) => (
                <View
                  key={index}
                  style={[styles.permissionItem, { backgroundColor: colors.surface }]}
                >
                  <Ionicons name="key-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.permissionText, { color: colors.text }]}>{permission}</Text>
                </View>
              ))}
            </View>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {selectedPlugin.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Install button */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.modalInstallButton,
                {
                  backgroundColor: selectedPlugin.is_installed ? colors.error : colors.primary,
                },
              ]}
              onPress={() => {
                if (selectedPlugin.is_installed) {
                  handleUninstallPlugin(selectedPlugin);
                } else {
                  handleInstallPlugin(selectedPlugin);
                }
                setDetailModalVisible(false);
              }}
            >
              <Text style={styles.modalInstallButtonText}>
                {selectedPlugin.is_installed
                  ? 'Uninstall Plugin'
                  : selectedPlugin.is_premium
                    ? `Purchase for $${selectedPlugin.price}`
                    : 'Install Plugin'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayedPlugins = activeTab === 'browse' ? plugins : installedPlugins;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab switcher */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'browse' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('browse');
          }}
        >
          <Ionicons
            name="compass-outline"
            size={20}
            color={activeTab === 'browse' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'browse' ? colors.primary : colors.textSecondary },
            ]}
          >
            Browse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'installed' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('installed');
          }}
        >
          <Ionicons
            name="download-outline"
            size={20}
            color={activeTab === 'installed' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'installed' ? colors.primary : colors.textSecondary },
            ]}
          >
            Installed ({installedPlugins.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search plugins..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'browse' && renderCategoryFilter()}

      <FlatList
        data={displayedPlugins}
        renderItem={renderPluginItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="extension-puzzle-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {activeTab === 'installed' ? 'No plugins installed' : 'No plugins found'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {activeTab === 'installed'
                ? 'Browse the marketplace to find plugins'
                : 'Try a different search or category'}
            </Text>
          </View>
        }
      />

      {renderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  pluginCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
  },
  pluginIconContainer: {
    position: 'relative',
  },
  pluginIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pluginInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pluginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pluginName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
  },
  pluginAuthor: {
    fontSize: 12,
    marginTop: 2,
  },
  pluginDescription: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  pluginMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  installCount: {
    fontSize: 12,
  },
  installButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  installButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  pluginBanner: {
    width: '100%',
    height: 150,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: {
    marginLeft: 16,
    flex: 1,
  },
  detailName: {
    fontSize: 22,
    fontWeight: '700',
  },
  detailAuthor: {
    fontSize: 14,
    marginTop: 4,
  },
  detailVersion: {
    fontSize: 12,
    marginTop: 4,
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 20,
  },
  detailStat: {
    alignItems: 'center',
  },
  detailStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  permissionsList: {
    gap: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  permissionText: {
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  modalInstallButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalInstallButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
