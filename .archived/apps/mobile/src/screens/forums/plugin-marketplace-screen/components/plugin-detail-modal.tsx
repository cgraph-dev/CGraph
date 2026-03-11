/**
 * PluginDetailModal - Full plugin details view
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Plugin } from '../types';
import { styles } from '../styles';
import { renderStars } from '../utils';

interface PluginDetailModalProps {
  plugin: Plugin | null;
  visible: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    error: string;
    border: string;
  };
  onClose: () => void;
  onInstall: (plugin: Plugin) => void;
  onUninstall: (plugin: Plugin) => void;
}

/**
 *
 */
export function PluginDetailModal({
  plugin,
  visible,
  colors,
  onClose,
  onInstall,
  onUninstall,
}: PluginDetailModalProps) {
  if (!plugin) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Plugin Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Banner */}
        {plugin.banner_url && (
          <Image source={{ uri: plugin.banner_url }} style={styles.pluginBanner} />
        )}

        {/* Content */}
        <View style={styles.modalContent}>
          <View style={styles.detailHeader}>
            {plugin.icon_url ? (
              <Image source={{ uri: plugin.icon_url }} style={styles.detailIcon} />
            ) : (
              <View style={[styles.detailIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="extension-puzzle" size={32} color="#fff" />
              </View>
            )}
            <View style={styles.detailInfo}>
              <Text style={[styles.detailName, { color: colors.text }]}>{plugin.name}</Text>
              <Text style={[styles.detailAuthor, { color: colors.textSecondary }]}>
                by {plugin.author.name}
              </Text>
              <Text style={[styles.detailVersion, { color: colors.textSecondary }]}>
                v{plugin.version}
              </Text>
            </View>
          </View>

          <View style={styles.detailStats}>
            <View style={styles.detailStat}>
              <Text style={[styles.detailStatValue, { color: colors.text }]}>
                {plugin.rating.toFixed(1)}
              </Text>
              <View style={styles.ratingContainer}>{renderStars(plugin.rating)}</View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.detailStat}>
              <Text style={[styles.detailStatValue, { color: colors.text }]}>
                {(plugin?.install_count ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>
                Installs
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.detailStat}>
              <Text style={[styles.detailStatValue, { color: colors.text }]}>
                {plugin.review_count}
              </Text>
              <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>Reviews</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.detailDescription, { color: colors.textSecondary }]}>
            {plugin.description}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Permissions</Text>
          <View style={styles.permissionsList}>
            {plugin.permissions.map((permission, index) => (
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
            {plugin.tags.map((tag, index) => (
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
                backgroundColor: plugin.is_installed ? colors.error : colors.primary,
              },
            ]}
            onPress={() => {
              if (plugin.is_installed) {
                onUninstall(plugin);
              } else {
                onInstall(plugin);
              }
              onClose();
            }}
          >
            <Text style={styles.modalInstallButtonText}>
              {plugin.is_installed
                ? 'Uninstall Plugin'
                : plugin.is_premium
                  ? `Purchase for $${plugin.price}`
                  : 'Install Plugin'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
