/**
 * Device Management Screen (Mobile)
 *
 * Settings → Linked Devices
 * Shows list of user's devices from the E2EE trust chain with trust status.
 * Allows removing devices and initiating cross-signing for unverified devices.
 *
 * API:
 * - GET /api/v1/e2ee/devices/trust-chain
 * - DELETE /api/v1/e2ee/keys/:device_id
 * - POST /api/v1/e2ee/devices/:device_id/cross-sign
 *
 * @module screens/settings/device-management-screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../types';
import { useThemeStore } from '@/stores';
import {
  getDeviceList,
  crossSignDevice,
  revokeDeviceTrust,
  type DeviceInfo,
} from '../../lib/crypto/store/deviceSync';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'LinkedDevices'>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDeviceIcon(platform: string): keyof typeof Ionicons.glyphMap {
  switch (platform) {
    case 'ios':
    case 'android':
      return 'phone-portrait-outline';
    case 'mobile-web':
      return 'phone-portrait-outline';
    case 'web':
      return 'desktop-outline';
    default:
      return 'hardware-chip-outline';
  }
}

function formatLastSeen(dateStr: string): string {
  if (dateStr === 'Unknown') return 'Unknown';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getPlatformLabel(platform: string): string {
  switch (platform) {
    case 'ios':
      return 'iOS';
    case 'android':
      return 'Android';
    case 'web':
      return 'Web';
    case 'mobile-web':
      return 'Mobile Web';
    default:
      return 'Unknown';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DeviceManagementScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionDeviceId, setActionDeviceId] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const list = await getDeviceList();
      setDevices(list);
    } catch {
      Alert.alert('Error', 'Failed to load linked devices');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDevices();
  }, [fetchDevices]);

  const handleRemoveDevice = useCallback(
    (device: DeviceInfo) => {
      if (device.isCurrent) {
        Alert.alert('Cannot Remove', 'You cannot remove the current device.');
        return;
      }

      Alert.alert(
        'Remove Device',
        `Remove "${device.deviceId.slice(0, 8)}…" from your linked devices? This device will lose E2EE access.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              setActionDeviceId(device.deviceId);
              try {
                await revokeDeviceTrust(device.deviceId);
                setDevices((prev) => prev.filter((d) => d.deviceId !== device.deviceId));
              } catch {
                Alert.alert('Error', 'Failed to remove device');
              } finally {
                setActionDeviceId(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  const handleVerifyDevice = useCallback(
    async (device: DeviceInfo) => {
      setActionDeviceId(device.deviceId);
      try {
        await crossSignDevice(device.deviceId);
        // Refresh to show updated trust status
        await fetchDevices();
        Alert.alert('Verified', 'Device has been verified and trusted.');
      } catch {
        Alert.alert('Error', 'Failed to verify device');
      } finally {
        setActionDeviceId(null);
      }
    },
    [fetchDevices]
  );

  const renderDevice = useCallback(
    ({ item }: { item: DeviceInfo }) => {
      const isActioning = actionDeviceId === item.deviceId;

      return (
        <View style={[styles.deviceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.deviceRow}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHover }]}>
              <Ionicons
                name={getDeviceIcon(item.platform)}
                size={22}
                color={item.isTrusted ? colors.success : colors.warning}
              />
            </View>

            {/* Info */}
            <View style={styles.deviceInfo}>
              <View style={styles.deviceNameRow}>
                <Text style={[styles.deviceId, { color: colors.text }]} numberOfLines={1}>
                  {item.deviceId.slice(0, 12)}…
                </Text>
                {item.isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: colors.primary + '30' }]}>
                    <Text style={[styles.currentBadgeText, { color: colors.primary }]}>
                      This device
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.deviceMeta}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {getPlatformLabel(item.platform)}
                </Text>
                <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                {item.isTrusted ? (
                  <View style={styles.trustRow}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                    <Text style={[styles.trustText, { color: colors.success }]}>Verified</Text>
                  </View>
                ) : (
                  <View style={styles.trustRow}>
                    <Ionicons name="shield-outline" size={12} color={colors.warning} />
                    <Text style={[styles.trustText, { color: colors.warning }]}>Unverified</Text>
                  </View>
                )}
                <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {formatLastSeen(item.lastSeen)}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          {!item.isCurrent && (
            <View style={styles.actionsRow}>
              {!item.isTrusted && (
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                  onPress={() => handleVerifyDevice(item)}
                  disabled={isActioning}
                >
                  {isActioning ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.primary }]}>Verify</Text>
                    </>
                  )}
                </Pressable>
              )}

              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                onPress={() => handleRemoveDevice(item)}
                disabled={isActioning}
              >
                {isActioning ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      );
    },
    [colors, actionDeviceId, handleRemoveDevice, handleVerifyDevice]
  );

  // ── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading devices…
        </Text>
      </View>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header info */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Linked devices share your E2EE encryption keys. Only verify devices you trust.
        </Text>
      </View>

      {/* Device list */}
      {devices.length === 0 ? (
        <View style={[styles.center, styles.emptyContainer]}>
          <Ionicons name="hardware-chip-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Linked Devices</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Log in on another device to link it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.deviceId}
          renderItem={renderDevice}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

// ── Key Change Banner (Mobile) ────────────────────────────────────────────────

interface KeyChangeBannerProps {
  contactName: string;
  contactId: string;
  onVerify: () => void;
  onDismiss: () => void;
}

/**
 * Key change notification banner for mobile conversations.
 *
 * Displayed when a contact's identity key has changed.
 */
export function KeyChangeBanner({
  contactName,
  contactId,
  onVerify,
  onDismiss,
}: KeyChangeBannerProps) {
  const { colors } = useThemeStore();

  return (
    <View style={[bannerStyles.container, { backgroundColor: colors.warning + '15', borderBottomColor: colors.warning + '40' }]}>
      <View style={bannerStyles.contentRow}>
        <Ionicons name="warning-outline" size={18} color={colors.warning} />
        <Text style={[bannerStyles.text, { color: colors.warning }]}>
          <Text style={bannerStyles.bold}>{contactName}</Text>
          {"'s security number has changed. "}
          <Text
            style={[bannerStyles.link, { color: colors.warning }]}
            onPress={onVerify}
          >
            Tap to verify
          </Text>
        </Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.warning} />
      </Pressable>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  deviceCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceId: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
  },
  metaDot: {
    fontSize: 12,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
  },
});

const bannerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
