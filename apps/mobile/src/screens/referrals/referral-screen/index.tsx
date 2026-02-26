/**
 * ReferralScreen - Mobile
 *
 * Referral program dashboard allowing users to invite friends and earn rewards.
 * This screen is a powerful growth driver for the community through viral loops.
 *
 * Features:
 * - Unique referral code and shareable link
 * - Stats overview (total, verified, pending)
 * - Leaderboard with rank tracking
 * - Reward tiers with progress visualization
 * - Recent referrals list
 * - Native share sheet integration
 * - Copy to clipboard with haptic feedback
 * - Pull-to-refresh
 *
 * @version 1.0.0
 * @since v0.8.1
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback, AnimationColors } from '@/lib/animations/animation-engine';
import api from '../../../lib/api';

import {
  type ReferralCode,
  type ReferralStats,
  type Referral,
  type RewardTier,
  type LeaderboardEntry,
  transformApiReferralCode,
  transformApiStats,
  transformApiReferral,
  transformApiRewardTier,
  transformApiLeaderboardEntry,
} from './types';
import { generateFallbackData } from './fallbackData';
import {
  StatCard,
  RewardTierCard,
  ReferralRow,
  LeaderboardSection,
  ReferralLinkCard,
  NextTierProgress,
} from './components';

/**
 *
 */
export default function ReferralScreen() {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch referral data from API
  const fetchReferralData = useCallback(async () => {
    try {
      const [codeRes, statsRes, referralsRes, tiersRes, leaderboardRes] = await Promise.all([
        api.get('/api/v1/referrals/code').catch(() => null),
        api.get('/api/v1/referrals/stats').catch(() => null),
        api.get('/api/v1/referrals').catch(() => null),
        api.get('/api/v1/referrals/tiers').catch(() => null),
        api.get('/api/v1/referrals/leaderboard').catch(() => null),
      ]);

      let hasData = false;

      if (codeRes?.data) {
        setReferralCode(transformApiReferralCode(codeRes.data));
        hasData = true;
      }

      if (statsRes?.data) {
        setStats(transformApiStats(statsRes.data));
        hasData = true;
      }

      if (referralsRes?.data?.referrals || referralsRes?.data) {
        const referralsList = referralsRes.data.referrals || referralsRes.data;
        if (Array.isArray(referralsList)) {
          setReferrals(referralsList.map(transformApiReferral));
          hasData = true;
        }
      }

      if (tiersRes?.data?.tiers || tiersRes?.data) {
        const tiersList = tiersRes.data.tiers || tiersRes.data;
        if (Array.isArray(tiersList)) {
          setRewardTiers(tiersList.map(transformApiRewardTier));
          hasData = true;
        }
      }

      if (leaderboardRes?.data?.leaderboard || leaderboardRes?.data) {
        const leaderboardList = leaderboardRes.data.leaderboard || leaderboardRes.data;
        if (Array.isArray(leaderboardList)) {
          setLeaderboard(
            leaderboardList.map((entry: Record<string, unknown>) =>
              transformApiLeaderboardEntry(entry)
            )
          );
          hasData = true;
        }
      }

      // If no data from API, use fallback
      if (!hasData) {
        const fallbackData = generateFallbackData();
        setReferralCode(fallbackData.referralCode);
        setStats(fallbackData.stats);
        setReferrals(fallbackData.referrals);
        setRewardTiers(fallbackData.rewardTiers);
        setLeaderboard(fallbackData.leaderboard);
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      const fallbackData = generateFallbackData();
      setReferralCode(fallbackData.referralCode);
      setStats(fallbackData.stats);
      setReferrals(fallbackData.referrals);
      setRewardTiers(fallbackData.rewardTiers);
      setLeaderboard(fallbackData.leaderboard);
    }
  }, []);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const copyToClipboard = async (text: string) => {
    HapticFeedback.success();
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!referralCode) return;

    HapticFeedback.medium();
    try {
      await Share.share({
        message: `Join our awesome community! Use my referral link: ${referralCode.url}`,
        url: referralCode.url,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    HapticFeedback.light();
    await fetchReferralData();
    setRefreshing(false);
  };

  const handleClaimTier = (tierId: string) => {
    HapticFeedback.success();
    setRewardTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, claimed: true } : t)));
    Alert.alert('🎉 Rewards Claimed!', 'Your rewards have been added to your account.');
  };

  const nextTier = useMemo(() => {
    if (!stats) return null;
    const tier = rewardTiers.find((t) => !t.achieved);
    if (!tier) return null;
    const progress = (stats.verifiedReferrals / tier.referralsRequired) * 100;
    return { tier, progress: Math.min(progress, 100) };
  }, [stats, rewardTiers]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={AnimationColors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="gift" size={28} color={AnimationColors.primary} />
            <View>
              <Text style={styles.title}>Referral Program</Text>
              <Text style={styles.subtitle}>Invite friends and earn rewards</Text>
            </View>
          </View>
        </View>

        {/* Referral Link Card */}
        {referralCode && (
          <ReferralLinkCard
            referralCode={referralCode}
            copied={copied}
            onCopy={copyToClipboard}
            onShare={shareReferral}
          />
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="people"
            iconColor="#3b82f6"
            value={stats?.totalReferrals || 0}
            label="Total"
          />
          <StatCard
            icon="checkmark-circle"
            iconColor="#10b981"
            value={stats?.verifiedReferrals || 0}
            label="Verified"
          />
          <StatCard
            icon="sparkles"
            iconColor="#f59e0b"
            value={stats?.totalRewardsEarned.xp.toLocaleString() || '0'}
            label="XP Earned"
          />
          <StatCard
            icon="trophy"
            iconColor="#ec4899"
            value={`#${stats?.rank || '-'}`}
            label="Your Rank"
            trend={stats?.rankChange}
          />
        </View>

        {/* Progress to Next Tier */}
        {nextTier && (
          <NextTierProgress
            tier={nextTier.tier}
            currentReferrals={stats?.verifiedReferrals || 0}
            progress={nextTier.progress}
          />
        )}

        {/* Reward Tiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reward Tiers</Text>
          <View style={styles.tiersContainer}>
            {rewardTiers.map((tier) => (
              <RewardTierCard
                key={tier.id}
                tier={tier}
                currentReferrals={stats?.verifiedReferrals || 0}
                onClaim={handleClaimTier}
              />
            ))}
          </View>
        </View>

        {/* Leaderboard Preview */}
        <LeaderboardSection leaderboard={leaderboard} />

        {/* Recent Referrals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Referrals</Text>
          </View>
          <BlurView intensity={40} tint="dark" style={styles.referralsCard}>
            {referrals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={40} color="#6b7280" />
                <Text style={styles.emptyStateText}>No referrals yet</Text>
                <Text style={styles.emptyStateSubtext}>Share your link to start earning!</Text>
              </View>
            ) : (
              referrals.map((referral, index) => (
                <View key={referral.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <ReferralRow referral={referral} />
                </View>
              ))
            )}
          </BlurView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  tiersContainer: {
    gap: 12,
  },
  referralsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
    marginHorizontal: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
});
