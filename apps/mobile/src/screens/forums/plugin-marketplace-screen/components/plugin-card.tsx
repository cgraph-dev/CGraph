/**
 * PluginCard - Display individual plugin with install action
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Plugin } from '../types';
import { styles } from '../styles';
import { renderStars } from '../utils';

interface PluginCardProps {
  plugin: Plugin;
  colors: {
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
  };
  isInstalling: boolean;
  onPress: () => void;
  onInstall: () => void;
  onUninstall: () => void;
}

export function PluginCard({
  plugin,
  colors,
  isInstalling,
  onPress,
  onInstall,
  onUninstall,
}: PluginCardProps) {
  return (
    <TouchableOpacity
      style={[styles.pluginCard, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Plugin icon */}
      <View style={styles.pluginIconContainer}>
        {plugin.icon_url ? (
          <Image source={{ uri: plugin.icon_url }} style={styles.pluginIcon} />
        ) : (
          <View style={[styles.pluginIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="extension-puzzle" size={24} color="#fff" />
          </View>
        )}
        {plugin.is_official && (
          <View style={[styles.officialBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
          </View>
        )}
      </View>

      {/* Plugin info */}
      <View style={styles.pluginInfo}>
        <View style={styles.pluginHeader}>
          <Text style={[styles.pluginName, { color: colors.text }]} numberOfLines={1}>
            {plugin.name}
          </Text>
          {plugin.is_premium && (
            <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' + '30' }]}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
        </View>

        <Text style={[styles.pluginAuthor, { color: colors.textSecondary }]}>
          by {plugin.author.name}
          {plugin.author.verified && (
            <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
          )}
        </Text>

        <Text style={[styles.pluginDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {plugin.short_description || plugin.description}
        </Text>

        <View style={styles.pluginMeta}>
          <View style={styles.ratingContainer}>
            {renderStars(plugin.rating)}
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              ({plugin.review_count})
            </Text>
          </View>
          <Text style={[styles.installCount, { color: colors.textSecondary }]}>
            {(plugin?.install_count ?? 0).toLocaleString()} installs
          </Text>
        </View>
      </View>

      {/* Install button */}
      <TouchableOpacity
        style={[
          styles.installButton,
          {
            backgroundColor: plugin.is_installed ? colors.surface : colors.primary,
            borderColor: colors.primary,
            borderWidth: plugin.is_installed ? 1 : 0,
          },
        ]}
        onPress={() => (plugin.is_installed ? onUninstall() : onInstall())}
        disabled={isInstalling}
      >
        {isInstalling ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text
            style={[
              styles.installButtonText,
              { color: plugin.is_installed ? colors.primary : '#fff' },
            ]}
          >
            {plugin.is_installed ? 'Remove' : plugin.is_premium ? `$${plugin.price}` : 'Install'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
