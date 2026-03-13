/**
 * Creator Dashboard Screen
 *
 * Main landing page for creator monetization on mobile.
 * Shows onboarding status, balance, subscriber stats, and quick actions.
 *
 * @module screens/creator/creator-dashboard-screen
 * @since v1.0.0
 */
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '@/stores';
import { useCreatorStore } from '@/stores/creatorStore';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Creator Dashboard Screen
 */
export default function CreatorDashboardScreen(): React.ReactElement {
  const _navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { colors } = useThemeStore();
  const {
    creatorStatus,
    _isCreator,
    balance,
    analyticsOverview: overview,
    premiumThreads,
    tiers,
    isLoading,
    isLoadingBalance,
    error,
    fetchStatus,
    fetchBalance,
    fetchAnalyticsOverview,
    fetchPremiumThreads,
    fetchTiers,
    onboard,
    refreshOnboard,
  } = useCreatorStore();

  const loadData = useCallback(async () => {
    await fetchStatus();
    fetchBalance();
    fetchAnalyticsOverview();
    fetchPremiumThreads();
    fetchTiers();
  }, [fetchStatus, fetchBalance, fetchAnalyticsOverview, fetchPremiumThreads, fetchTiers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartOnboarding = async () => {
    const result = await onboard();
    if (result?.url) {
      Linking.openURL(result.url);
    }
  };

  const handleContinueOnboarding = async () => {
    const result = await refreshOnboard();
    if (result?.url) {
      Linking.openURL(result.url);
    }
  };

  if (isLoading && creatorStatus === 'none') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Not a creator yet ──────────────────────────────────────────
  if (creatorStatus === 'none') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.centerContent}
      >
        <Text style={styles.heroEmoji}>🎨</Text>
        <Text style={[styles.title, { color: colors.text }]}>Become a Creator</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Monetize your forums with paid subscriptions. Set your price, build your community, and
          earn revenue directly to your bank account.
        </Text>

        <View style={styles.benefitsList}>
          {[
            'Offer paid forum subscriptions at your chosen price',
            'Keep 85% of every subscription payment',
            'Withdraw earnings to your bank any time (min $10)',
            'Content gates keep exclusive content for subscribers only',
          ].map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.checkMark}>✓</Text>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleStartOnboarding}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Starting…' : 'Start Creator Onboarding'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Pending onboarding ─────────────────────────────────────────
  if (creatorStatus === 'pending') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.centerContent}
      >
        <Text style={styles.heroEmoji}>⏳</Text>
        <Text style={[styles.title, { color: colors.text }]}>Complete Your Setup</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your Stripe Connect account has been created. Please complete the onboarding process to
          start accepting payments.
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#f59e0b' }]}
          onPress={handleContinueOnboarding}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>Continue Onboarding →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Active creator dashboard ───────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={isLoadingBalance} onRefresh={loadData} />}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Creator Dashboard</Text>
        <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Active</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Subscribers"
          value={overview?.subscriberCount?.toString() ?? '0'}
          colors={colors}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCents(overview?.mrrCents ?? 0)}
          colors={colors}
        />
        <StatCard
          label="Available"
          value={formatCents(balance?.availableBalanceCents ?? 0)}
          colors={colors}
        />
        <StatCard
          label="Churn"
          value={`${overview?.churnRate?.toFixed(1) ?? '0.0'}%`}
          colors={colors}
        />
      </View>

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      {[
        { title: 'Earnings', desc: 'View detailed earnings', emoji: '💵' },
        { title: 'Analytics', desc: 'Subscriber trends', emoji: '📊' },
        { title: 'Payouts', desc: 'Request withdrawals', emoji: '🏦' },
      ].map((action) => (
        <TouchableOpacity
          key={action.title}
          style={[styles.actionCard, { borderColor: colors.border }]}
        >
          <Text style={styles.actionEmoji}>{action.emoji}</Text>
          <View style={styles.actionTextWrap}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{action.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* ── Premium Content (Phase 36) ────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
        Premium Threads
      </Text>
      {premiumThreads.length === 0 ? (
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          No premium threads yet
        </Text>
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        premiumThreads.map((thread: any, idx: number) => (
          <View key={thread.id ?? idx} style={[styles.actionCard, { borderColor: colors.border }]}>
            <Text style={styles.actionEmoji}>🔒</Text>
            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                {thread.title ?? `Thread #${idx + 1}`}
              </Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                {thread.priceNodes ?? 0} nodes
                {thread.subscriberOnly ? ' • Subscribers only' : ''}
              </Text>
            </View>
          </View>
        ))
      )}
      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.primary }]}
        onPress={() => {
          /* navigate to create premium thread */
        }}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
          + Create Premium Thread
        </Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
        Subscription Tiers
      </Text>
      {tiers.length === 0 ? (
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          No subscription tiers yet
        </Text>
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tiers.map((tier: any, idx: number) => (
          <View key={tier.id ?? idx} style={[styles.actionCard, { borderColor: colors.border }]}>
            <Text style={styles.actionEmoji}>⭐</Text>
            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                {tier.name ?? `Tier #${idx + 1}`}
              </Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                {tier.priceMonthlyNodes ?? 0} nodes/month
              </Text>
            </View>
          </View>
        ))
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  colors: { background: string; text: string; textSecondary: string; border: string; card: string };
}

function StatCard({ label, value, colors }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerContent: { alignItems: 'center', padding: 24, paddingTop: 48 },
  heroEmoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  benefitsList: { alignSelf: 'stretch', marginBottom: 32 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  checkMark: { color: '#22c55e', fontSize: 16, marginTop: 2 },
  benefitText: { fontSize: 15, flex: 1, lineHeight: 22 },
  primaryButton: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#166534' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 20,
  },
  statCard: { flex: 1, minWidth: '46%', padding: 14, borderRadius: 12, borderWidth: 1 },
  statLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '600', paddingHorizontal: 16, marginBottom: 12 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  actionEmoji: { fontSize: 24 },
  actionTextWrap: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600' },
  actionDesc: { fontSize: 13, marginTop: 2 },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 12, fontSize: 14 },
  emptyHint: { fontSize: 14, paddingHorizontal: 16, marginBottom: 12 },
  secondaryButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600' },
});
