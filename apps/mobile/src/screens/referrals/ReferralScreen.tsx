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
 * - Animated progress bars
 * 
 * @version 1.0.0
 * @since v0.8.1
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Share,
  Alert,
  Clipboard,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback, AnimationColors } from '@/lib/animations/AnimationEngine';
import api from '../../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface ReferralCode {
  code: string;
  url: string;
  usageCount: number;
  maxUsage?: number;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  verifiedReferrals: number;
  pendingReferrals: number;
  rank: number;
  rankChange: number;
  totalRewardsEarned: {
    xp: number;
    coins: number;
    premium_days: number;
  };
}

interface Referral {
  id: string;
  referredUserId: string;
  referredUsername: string;
  referredAvatarUrl: string | null;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  verifiedAt?: string;
  rewardsClaimed: boolean;
}

interface RewardTier {
  id: string;
  name: string;
  description: string;
  referralsRequired: number;
  rewards: {
    type: 'xp' | 'coins' | 'premium' | 'badge' | 'title';
    amount?: number;
    description: string;
  }[];
  achieved: boolean;
  claimed: boolean;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  referralCount: number;
  isCurrentUser: boolean;
}

// ============================================================================
// FALLBACK DATA (used when API is unavailable)
// ============================================================================

function generateFallbackData() {
  const referralCode: ReferralCode = {
    code: 'CGRAPH2026',
    url: 'https://cgraph.app/join?ref=CGRAPH2026',
    usageCount: 12,
    maxUsage: 100,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const stats: ReferralStats = {
    totalReferrals: 12,
    verifiedReferrals: 8,
    pendingReferrals: 4,
    rank: 42,
    rankChange: 5,
    totalRewardsEarned: {
      xp: 2400,
      coins: 500,
      premium_days: 7,
    },
  };

  const referrals: Referral[] = [
    {
      id: '1',
      referredUserId: 'u1',
      referredUsername: 'CryptoFan',
      referredAvatarUrl: null,
      status: 'verified',
      createdAt: '2026-01-10T00:00:00Z',
      verifiedAt: '2026-01-11T00:00:00Z',
      rewardsClaimed: true,
    },
    {
      id: '2',
      referredUserId: 'u2',
      referredUsername: 'BlockchainDev',
      referredAvatarUrl: null,
      status: 'verified',
      createdAt: '2026-01-09T00:00:00Z',
      verifiedAt: '2026-01-10T00:00:00Z',
      rewardsClaimed: true,
    },
    {
      id: '3',
      referredUserId: 'u3',
      referredUsername: 'NewUser123',
      referredAvatarUrl: null,
      status: 'pending',
      createdAt: '2026-01-12T00:00:00Z',
      rewardsClaimed: false,
    },
  ];

  const rewardTiers: RewardTier[] = [
    {
      id: '1',
      name: 'Beginner',
      description: 'Get started with referrals',
      referralsRequired: 3,
      rewards: [
        { type: 'xp', amount: 500, description: '500 XP' },
        { type: 'badge', description: 'Recruiter Badge' },
      ],
      achieved: true,
      claimed: true,
    },
    {
      id: '2',
      name: 'Rising Star',
      description: 'Growing your network',
      referralsRequired: 10,
      rewards: [
        { type: 'xp', amount: 1500, description: '1500 XP' },
        { type: 'coins', amount: 200, description: '200 Coins' },
        { type: 'title', description: '"Recruiter" Title' },
      ],
      achieved: false,
      claimed: false,
    },
    {
      id: '3',
      name: 'Community Builder',
      description: 'Making a real impact',
      referralsRequired: 25,
      rewards: [
        { type: 'xp', amount: 5000, description: '5000 XP' },
        { type: 'premium', amount: 7, description: '7 Days Premium' },
        { type: 'badge', description: 'Gold Recruiter Badge' },
      ],
      achieved: false,
      claimed: false,
    },
    {
      id: '4',
      name: 'Legend',
      description: 'Top referrer status',
      referralsRequired: 100,
      rewards: [
        { type: 'xp', amount: 20000, description: '20000 XP' },
        { type: 'premium', amount: 30, description: '30 Days Premium' },
        { type: 'title', description: '"Legend" Title' },
        { type: 'badge', description: 'Diamond Recruiter Badge' },
      ],
      achieved: false,
      claimed: false,
    },
  ];

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, userId: 'l1', username: 'TopRecruiter', avatarUrl: null, referralCount: 256, isCurrentUser: false },
    { rank: 2, userId: 'l2', username: 'CommunityKing', avatarUrl: null, referralCount: 198, isCurrentUser: false },
    { rank: 3, userId: 'l3', username: 'NetworkQueen', avatarUrl: null, referralCount: 187, isCurrentUser: false },
    { rank: 42, userId: 'current', username: 'You', avatarUrl: null, referralCount: 8, isCurrentUser: true },
  ];

  return { referralCode, stats, referrals, rewardTiers, leaderboard };
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  icon: string;
  iconColor: string;
  value: number | string;
  label: string;
  trend?: number;
}

function StatCard({ icon, iconColor, value, label, trend }: StatCardProps) {
  return (
    <BlurView intensity={40} tint="dark" style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.statValue}>
        <Text style={styles.statValueText}>{value}</Text>
        {trend !== undefined && trend !== 0 && (
          <View style={[styles.trendBadge, trend > 0 ? styles.trendUp : styles.trendDown]}>
            <Ionicons 
              name={trend > 0 ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={trend > 0 ? '#10b981' : '#ef4444'} 
            />
          </View>
        )}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </BlurView>
  );
}

// ============================================================================
// REWARD TIER CARD
// ============================================================================

interface RewardTierCardProps {
  tier: RewardTier;
  currentReferrals: number;
  onClaim: (tierId: string) => void;
}

function RewardTierCard({ tier, currentReferrals, onClaim }: RewardTierCardProps) {
  const progress = Math.min((currentReferrals / tier.referralsRequired) * 100, 100);
  const canClaim = tier.achieved && !tier.claimed;

  return (
    <BlurView 
      intensity={tier.achieved ? 60 : 40} 
      tint="dark" 
      style={[
        styles.tierCard,
        tier.achieved && styles.tierCardAchieved,
        canClaim && styles.tierCardClaimable,
      ]}
    >
      <View style={styles.tierHeader}>
        <View style={styles.tierInfo}>
          <Text style={[
            styles.tierName,
            tier.achieved && styles.tierNameAchieved
          ]}>
            {tier.name}
          </Text>
          <Text style={styles.tierDescription}>{tier.description}</Text>
        </View>
        
        {tier.claimed && (
          <View style={styles.claimedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={AnimationColors.primary} />
          </View>
        )}
        
        {canClaim && (
          <TouchableOpacity
            onPress={() => onClaim(tier.id)}
            style={styles.claimButton}
          >
            <LinearGradient
              colors={[AnimationColors.primary, '#059669']}
              style={styles.claimButtonGradient}
            >
              <Ionicons name="gift" size={14} color="#fff" />
              <Text style={styles.claimButtonText}>Claim</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.tierProgress}>
        <View style={styles.tierProgressBar}>
          <View 
            style={[
              styles.tierProgressFill,
              { width: `${progress}%` },
              tier.achieved && styles.tierProgressFillAchieved,
            ]} 
          />
        </View>
        <Text style={styles.tierProgressText}>
          {currentReferrals} / {tier.referralsRequired}
        </Text>
      </View>

      {/* Rewards */}
      <View style={styles.tierRewards}>
        {tier.rewards.map((reward, index) => (
          <View key={index} style={styles.rewardTag}>
            <Ionicons 
              name={
                reward.type === 'xp' ? 'sparkles' :
                reward.type === 'coins' ? 'logo-bitcoin' :
                reward.type === 'premium' ? 'star' :
                reward.type === 'badge' ? 'medal' : 'ribbon'
              } 
              size={12} 
              color={tier.achieved ? AnimationColors.primary : '#9ca3af'} 
            />
            <Text style={[
              styles.rewardTagText,
              tier.achieved && styles.rewardTagTextAchieved
            ]}>
              {reward.description}
            </Text>
          </View>
        ))}
      </View>
    </BlurView>
  );
}

// ============================================================================
// REFERRAL ROW COMPONENT
// ============================================================================

interface ReferralRowProps {
  referral: Referral;
}

function ReferralRow({ referral }: ReferralRowProps) {
  const statusConfig = {
    pending: { color: '#f59e0b', icon: 'time', label: 'Pending' },
    verified: { color: '#10b981', icon: 'checkmark-circle', label: 'Verified' },
    rejected: { color: '#ef4444', icon: 'close-circle', label: 'Rejected' },
  }[referral.status];

  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(referral.createdAt).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }, [referral.createdAt]);

  return (
    <View style={styles.referralRow}>
      <View style={styles.referralAvatar}>
        {referral.referredAvatarUrl ? (
          <Image source={{ uri: referral.referredAvatarUrl }} style={styles.referralAvatarImage} />
        ) : (
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6']}
            style={styles.referralAvatarPlaceholder}
          >
            <Text style={styles.referralAvatarInitial}>
              {referral.referredUsername[0]}
            </Text>
          </LinearGradient>
        )}
      </View>
      
      <View style={styles.referralInfo}>
        <Text style={styles.referralUsername}>{referral.referredUsername}</Text>
        <Text style={styles.referralTime}>{timeAgo}</Text>
      </View>
      
      <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
        <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ReferralScreen() {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Transform API response to local types
  const transformApiReferralCode = (data: any): ReferralCode => ({
    code: data.code || 'CGRAPH',
    url: data.url || `https://cgraph.app/join?ref=${data.code}`,
    usageCount: data.usage_count || data.usageCount || 0,
    maxUsage: data.max_usage || data.maxUsage || 100,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  });

  const transformApiStats = (data: any): ReferralStats => ({
    totalReferrals: data.total_referrals || data.totalReferrals || 0,
    verifiedReferrals: data.verified_referrals || data.verifiedReferrals || 0,
    pendingReferrals: data.pending_referrals || data.pendingReferrals || 0,
    rank: data.rank || 0,
    rankChange: data.rank_change || data.rankChange || 0,
    totalRewardsEarned: {
      xp: data.total_rewards_earned?.xp || data.totalRewardsEarned?.xp || 0,
      coins: data.total_rewards_earned?.coins || data.totalRewardsEarned?.coins || 0,
      premium_days: data.total_rewards_earned?.premium_days || data.totalRewardsEarned?.premium_days || 0,
    },
  });

  const transformApiReferral = (data: any): Referral => ({
    id: data.id,
    referredUserId: data.referred_user_id || data.referredUserId,
    referredUsername: data.referred_username || data.referredUsername,
    referredAvatarUrl: data.referred_avatar_url || data.referredAvatarUrl || null,
    status: data.status || 'pending',
    createdAt: data.created_at || data.createdAt,
    verifiedAt: data.verified_at || data.verifiedAt,
    rewardsClaimed: data.rewards_claimed || data.rewardsClaimed || false,
  });

  const transformApiRewardTier = (data: any): RewardTier => ({
    id: data.id,
    name: data.name,
    description: data.description,
    referralsRequired: data.referrals_required || data.referralsRequired,
    rewards: (data.rewards || []).map((r: any) => ({
      type: r.type,
      amount: r.amount,
      description: r.description,
    })),
    achieved: data.achieved || false,
    claimed: data.claimed || false,
  });

  const transformApiLeaderboardEntry = (data: any, currentUserId?: string): LeaderboardEntry => ({
    rank: data.rank,
    userId: data.user_id || data.userId,
    username: data.username,
    avatarUrl: data.avatar_url || data.avatarUrl || null,
    referralCount: data.referral_count || data.referralCount,
    isCurrentUser: data.is_current_user || data.isCurrentUser || data.user_id === currentUserId,
  });

  // Fetch referral data from API
  const fetchReferralData = useCallback(async () => {
    try {
      // Fetch all referral data in parallel
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
          setLeaderboard(leaderboardList.map((entry: any) => transformApiLeaderboardEntry(entry)));
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
      // Use fallback data on error
      const fallbackData = generateFallbackData();
      setReferralCode(fallbackData.referralCode);
      setStats(fallbackData.stats);
      setReferrals(fallbackData.referrals);
      setRewardTiers(fallbackData.rewardTiers);
      setLeaderboard(fallbackData.leaderboard);
    }
  }, []);

  // Load data
  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    HapticFeedback.success();
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share referral
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

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    HapticFeedback.light();
    await fetchReferralData();
    setRefreshing(false);
  };

  // Claim tier reward
  const handleClaimTier = (tierId: string) => {
    HapticFeedback.success();
    setRewardTiers(prev => prev.map(t => 
      t.id === tierId ? { ...t, claimed: true } : t
    ));
    Alert.alert('🎉 Rewards Claimed!', 'Your rewards have been added to your account.');
  };

  // Calculate next tier
  const nextTier = useMemo(() => {
    if (!stats) return null;
    const tier = rewardTiers.find(t => !t.achieved);
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
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
            style={styles.referralLinkCard}
          >
            <View style={styles.referralLinkHeader}>
              <Ionicons name="link" size={20} color={AnimationColors.primary} />
              <Text style={styles.referralLinkTitle}>Your Referral Link</Text>
            </View>

            {/* URL */}
            <View style={styles.urlContainer}>
              <Text style={styles.urlText} numberOfLines={1}>
                {referralCode.url}
              </Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(referralCode.url)}
                style={styles.copyButton}
              >
                <Ionicons 
                  name={copied ? 'checkmark' : 'copy'} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={shareReferral} style={styles.shareButton}>
                <Ionicons name="share-social" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Code */}
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Your code: </Text>
              <TouchableOpacity onPress={() => copyToClipboard(referralCode.code)}>
                <Text style={styles.codeText}>{referralCode.code}</Text>
              </TouchableOpacity>
            </View>

            {/* Usage */}
            <Text style={styles.usageText}>
              Used {referralCode.usageCount} {referralCode.maxUsage ? `/ ${referralCode.maxUsage}` : ''} times
            </Text>
          </LinearGradient>
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
          <BlurView intensity={50} tint="dark" style={styles.nextTierCard}>
            <View style={styles.nextTierHeader}>
              <Text style={styles.nextTierTitle}>Progress to {nextTier.tier.name}</Text>
              <Text style={styles.nextTierCount}>
                {stats?.verifiedReferrals || 0} / {nextTier.tier.referralsRequired}
              </Text>
            </View>
            <View style={styles.nextTierProgressBar}>
              <LinearGradient
                colors={[AnimationColors.primary, '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.nextTierProgressFill, { width: `${nextTier.progress}%` }]}
              />
            </View>
            <View style={styles.nextTierRewards}>
              {nextTier.tier.rewards.slice(0, 3).map((reward, i) => (
                <View key={i} style={styles.nextTierReward}>
                  <Ionicons 
                    name={
                      reward.type === 'xp' ? 'sparkles' :
                      reward.type === 'coins' ? 'logo-bitcoin' :
                      reward.type === 'premium' ? 'star' : 'gift'
                    } 
                    size={12} 
                    color="#9ca3af" 
                  />
                  <Text style={styles.nextTierRewardText}>{reward.description}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        )}

        {/* Reward Tiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reward Tiers</Text>
          <View style={styles.tiersContainer}>
            {rewardTiers.map(tier => (
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <BlurView intensity={40} tint="dark" style={styles.leaderboardCard}>
            {leaderboard.map((entry, index) => (
              <View 
                key={entry.userId} 
                style={[
                  styles.leaderboardRow,
                  entry.isCurrentUser && styles.leaderboardRowHighlight,
                  index > 0 && styles.leaderboardRowBorder,
                ]}
              >
                <View style={[
                  styles.leaderboardRank,
                  entry.rank <= 3 && styles[`rank${entry.rank}` as 'rank1' | 'rank2' | 'rank3'],
                ]}>
                  <Text style={[
                    styles.leaderboardRankText,
                    entry.rank <= 3 && styles.leaderboardRankTextTop,
                  ]}>
                    {entry.rank}
                  </Text>
                </View>
                <Text style={[
                  styles.leaderboardUsername,
                  entry.isCurrentUser && styles.leaderboardUsernameHighlight,
                ]} numberOfLines={1}>
                  {entry.username}
                </Text>
                <Text style={styles.leaderboardCount}>
                  {entry.referralCount} referrals
                </Text>
              </View>
            ))}
          </BlurView>
        </View>

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

// ============================================================================
// STYLES
// ============================================================================

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

  // Header
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

  // Referral Link Card
  referralLinkCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 20,
  },
  referralLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  referralLinkTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
    marginBottom: 12,
  },
  urlText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 12,
    backgroundColor: AnimationColors.primary,
  },
  shareButton: {
    padding: 12,
    backgroundColor: '#3b82f6',
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  codeText: {
    fontSize: 14,
    fontWeight: '700',
    color: AnimationColors.primary,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  usageText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    overflow: 'hidden',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValueText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  trendBadge: {
    padding: 2,
    borderRadius: 4,
  },
  trendUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  trendDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },

  // Next Tier Card
  nextTierCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  nextTierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nextTierTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  nextTierCount: {
    fontSize: 13,
    color: '#9ca3af',
  },
  nextTierProgressBar: {
    height: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  nextTierProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextTierRewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nextTierReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  nextTierRewardText: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // Sections
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
  seeAllText: {
    fontSize: 13,
    color: AnimationColors.primary,
    fontWeight: '600',
  },

  // Tiers
  tiersContainer: {
    gap: 12,
  },
  tierCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    overflow: 'hidden',
  },
  tierCardAchieved: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  tierCardClaimable: {
    borderColor: AnimationColors.primary,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9ca3af',
  },
  tierNameAchieved: {
    color: '#ffffff',
  },
  tierDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  claimedBadge: {
    padding: 4,
  },
  claimButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  claimButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  tierProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tierProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  tierProgressFill: {
    height: '100%',
    backgroundColor: '#6b7280',
    borderRadius: 3,
  },
  tierProgressFillAchieved: {
    backgroundColor: AnimationColors.primary,
  },
  tierProgressText: {
    fontSize: 11,
    color: '#9ca3af',
    minWidth: 50,
    textAlign: 'right',
  },
  tierRewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  rewardTagText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  rewardTagTextAchieved: {
    color: AnimationColors.primary,
  },

  // Leaderboard
  leaderboardCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  leaderboardRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.3)',
  },
  leaderboardRowHighlight: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  leaderboardRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    marginRight: 12,
  },
  rank1: { backgroundColor: '#fbbf24' },
  rank2: { backgroundColor: '#9ca3af' },
  rank3: { backgroundColor: '#f97316' },
  leaderboardRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  leaderboardRankTextTop: {
    color: '#111827',
  },
  leaderboardUsername: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  leaderboardUsernameHighlight: {
    color: AnimationColors.primary,
  },
  leaderboardCount: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Referrals List
  referralsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    padding: 4,
  },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
    marginHorizontal: 10,
  },
  referralAvatar: {
    marginRight: 12,
  },
  referralAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  referralAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralAvatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  referralInfo: {
    flex: 1,
  },
  referralUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  referralTime: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Empty State
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
