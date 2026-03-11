/**
 * PluginMarketplaceScreen - Browse and install forum plugins
 *
 * Features:
 * - Browse available plugins by category
 * - Search and filter plugins
 * - Install/uninstall plugins
 * - View plugin details, ratings, reviews
 * - Manage installed plugins
 *
 * @version 1.0.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import api from '../../../lib/api';
import { ForumsStackParamList } from '../../../types';

import { Plugin, PluginCategory, TabType } from './types';
import { styles } from './styles';
import { PluginCard, PluginDetailModal, CategoryFilter } from './components';

// Re-export types
export type { Plugin, PluginCategory } from './types';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'PluginMarketplace'>;
  route: RouteProp<ForumsStackParamList, 'PluginMarketplace'>;
};

/**
 *
 */
export default function PluginMarketplaceScreen({ navigation, route }: Props) {
  const { forumId } = route.params || {};
  const { colors } = useThemeStore();
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
  }, [forumId, navigation]);

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

  const processPurchase = async (_plugin: Plugin) => {
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

      {activeTab === 'browse' && (
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelect={handleCategorySelect}
          colors={colors}
        />
      )}

      <FlatList
        data={displayedPlugins}
        renderItem={({ item }) => (
          <PluginCard
            plugin={item}
            colors={colors}
            isInstalling={installingId === item.id}
            onPress={() => openPluginDetail(item)}
            onInstall={() => handleInstallPlugin(item)}
            onUninstall={() => handleUninstallPlugin(item)}
          />
        )}
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

      <PluginDetailModal
        plugin={selectedPlugin}
        visible={detailModalVisible}
        colors={colors}
        onClose={() => setDetailModalVisible(false)}
        onInstall={handleInstallPlugin}
        onUninstall={handleUninstallPlugin}
      />
    </View>
  );
}
