/**
 * Subscription Management Screen
 *
 * Shows current subscription details (tier, expiry, auto-renew status).
 * Provides restore purchases, manage native subscription, and cancel guidance.
 *
 * @module screens/premium/subscription-management
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/ui/glass-card';
import { useThemeStore } from '@/stores';
import paymentService, { SubscriptionStatus } from '../../lib/payment';
import { iapService } from '../../features/premium/services/iap-service';

/**
 * Subscription Management Screen component.
 */
function SubscriptionManagementScreen(): React.ReactElement | null {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { colors } = useThemeStore();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        await paymentService.initialize();
        const s = await paymentService.getSubscriptionStatus();
        setStatus(s);
      } catch (err) {
        console.error('[SubscriptionManagement] fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Restore Purchases',
      "We'll restore any previous purchases linked to your account.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setIsRestoring(true);
            try {
              const result = await iapService.restorePurchases();
              if (result.success) {
                const s = await paymentService.getSubscriptionStatus();
                setStatus(s);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Your purchases have been restored.');
              } else {
                Alert.alert('No Purchases', 'No previous purchases found to restore.');
              }
            } catch (err) {
              console.error('[SubscriptionManagement] restore error:', err);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  }, []);

  const handleManageSubscription = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }, []);

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const platformName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
    Alert.alert(
      'Cancel Subscription',
      `Subscriptions are managed by the ${platformName}. You'll be redirected to manage your subscription there.`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: `Open ${platformName}`,
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('https://apps.apple.com/account/subscriptions');
            } else {
              Linking.openURL('https://play.google.com/store/account/subscriptions');
            }
          },
        },
      ]
    );
  }, []);

  const tier = status?.tier ?? 'free';
  const isActive = status?.isActive ?? false;
  const expiresAt = status?.expiresAt ? new Date(status.expiresAt) : null;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Current Plan Card */}
      <GlassCard variant="holographic" intensity="strong" style={styles.planCard}>
        <View style={styles.planHeader}>
          <Ionicons
            name={isActive ? 'diamond' : 'diamond-outline'}
            size={32}
            color={isActive ? '#8b5cf6' : '#888'}
          />
          <View style={styles.planInfo}>
            <Text style={styles.planTierLabel}>Current Plan</Text>
            <Text style={styles.planTierName}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: isActive ? '#22c55e33' : '#ef444433' }]}
          >
            <Text style={[styles.statusText, { color: isActive ? '#22c55e' : '#ef4444' }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {expiresAt && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#aaa" />
            <Text style={styles.detailText}>
              {isActive ? 'Renews' : 'Expired'}: {expiresAt.toLocaleDateString()}
            </Text>
          </View>
        )}
      </GlassCard>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {/* Restore Purchases */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={handleRestore}
          disabled={isRestoring}
          activeOpacity={0.7}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color="#8b5cf6" />
          ) : (
            <Ionicons name="refresh-outline" size={22} color="#8b5cf6" />
          )}
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Restore Purchases</Text>
            <Text style={[styles.actionSubtitle, { color: colors.text + '80' }]}>
              Recover purchases from another device
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text + '40'} />
        </TouchableOpacity>

        {/* Manage Subscription */}
        {isActive && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={handleManageSubscription}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color="#8b5cf6" />
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Manage Subscription</Text>
              <Text style={[styles.actionSubtitle, { color: colors.text + '80' }]}>
                Change plan or update payment method
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + '40'} />
          </TouchableOpacity>
        )}

        {/* Cancel */}
        {isActive && tier !== 'free' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Cancel Subscription</Text>
              <Text style={[styles.actionSubtitle, { color: colors.text + '80' }]}>
                {Platform.OS === 'ios' ? 'Managed via the App Store' : 'Managed via Google Play'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + '40'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={16} color={colors.text + '60'} />
        <Text style={[styles.infoText, { color: colors.text + '60' }]}>
          Subscriptions are managed by {Platform.OS === 'ios' ? 'Apple' : 'Google'}. To cancel,
          modify, or view your subscription history, use the link above. Your premium benefits will
          remain active until the end of the current billing period.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },
  planCard: { padding: 20, marginBottom: 24 },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  planInfo: { flex: 1 },
  planTierLabel: { fontSize: 12, color: '#aaa', marginBottom: 2 },
  planTierName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: { fontSize: 13, color: '#ccc' },
  actionsContainer: { gap: 12, marginBottom: 24 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionTextContainer: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600' },
  actionSubtitle: { fontSize: 12, marginTop: 2 },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  infoText: { fontSize: 12, lineHeight: 18, flex: 1 },
});

export default SubscriptionManagementScreen;
