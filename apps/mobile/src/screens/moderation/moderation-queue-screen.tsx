/**
 * ModerationQueueScreen - Pending reports with swipe actions
 * Approve/reject reports via swipe gestures
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { SlideInUp, FadeOutLeft, FadeOutRight, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';

// ── Types ──────────────────────────────────────────────────
type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
type ReportReason = 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'adult_content' | 'other';

interface Report {
  id: string;
  reporterUsername: string;
  targetUsername: string;
  reason: ReportReason;
  description: string;
  contentPreview: string;
  status: ReportStatus;
  createdAt: string;
}

// ── Mock Data ──────────────────────────────────────────────
const _MOCK_REPORTS: Report[] = [
  {
    id: '1',
    reporterUsername: 'alice',
    targetUsername: 'baduser123',
    reason: 'spam',
    description: 'Sending repeated promotional messages',
    contentPreview: 'BUY NOW!!! Best deal at example.com...',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    reporterUsername: 'bob',
    targetUsername: 'troll42',
    reason: 'harassment',
    description: 'Targeted harassment in group chat',
    contentPreview: 'Offensive message content...',
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    reporterUsername: 'charlie',
    targetUsername: 'spambot',
    reason: 'spam',
    description: 'Bot-like behavior, automated messages',
    contentPreview: 'Join discord.gg/spam for free...',
    status: 'pending',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

// ── Helpers ────────────────────────────────────────────────
const REASON_CONFIG: Record<ReportReason, { icon: string; color: string; label: string }> = {
  spam: { icon: 'mail-unread', color: '#f59e0b', label: 'Spam' },
  harassment: { icon: 'warning', color: '#ef4444', label: 'Harassment' },
  hate_speech: { icon: 'alert-circle', color: '#dc2626', label: 'Hate Speech' },
  violence: { icon: 'flame', color: '#f97316', label: 'Violence' },
  adult_content: { icon: 'eye-off', color: '#a855f7', label: 'Adult Content' },
  other: { icon: 'flag', color: '#6b7280', label: 'Other' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Component ──────────────────────────────────────────────

/**
 * Moderation Queue Screen component.
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ModerationQueueScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/reports', { params: { status: 'pending' } });
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setReports(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((r: Record<string, any>) => ({
          id: r.id,
          reporterUsername: r.reporter_username ?? r.reporter?.username ?? 'unknown',
          targetUsername: r.target_username ?? r.target?.username ?? 'unknown',
          reason: r.reason ?? 'other',
          description: r.description ?? '',
          contentPreview: r.content_preview ?? r.content ?? '',
          status: r.status ?? 'pending',
          createdAt: r.created_at ?? r.inserted_at ?? new Date().toISOString(),
        }))
      );
    } catch {
      // Fall back to empty list on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]);

  const handleApprove = useCallback((report: Report) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setResolvedIds((prev) => new Set(prev).add(report.id));
    setTimeout(() => {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    }, 300);
  }, []);

  const handleDismiss = useCallback((report: Report) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDismissedIds((prev) => new Set(prev).add(report.id));
    setTimeout(() => {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    }, 300);
  }, []);

  const handleAction = useCallback(
    (report: Report) => {
      Alert.alert('Moderate', `Take action on report from @${report.reporterUsername}`, [
        {
          text: 'Dismiss Report',
          onPress: () => handleDismiss(report),
        },
        {
          text: 'Warn User',
          onPress: () => handleApprove(report),
        },
        {
          text: 'Ban User',
          style: 'destructive',
          onPress: () => handleApprove(report),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [handleApprove, handleDismiss]
  );

  const renderReport = useCallback(
    ({ item, index }: { item: Report; index: number }) => {
      const reason = REASON_CONFIG[item.reason];
      const isResolved = resolvedIds.has(item.id);
      const isDismissed = dismissedIds.has(item.id);

      return (
        <Animated.View
          style={[styles.card, { backgroundColor: colors.surface }]}
          entering={SlideInUp.springify()
            .damping(18)
            .stiffness(180)
            .delay(index * 40)}
          exiting={
            isResolved
              ? FadeOutRight.duration(200)
              : isDismissed
                ? FadeOutLeft.duration(200)
                : undefined
          }
          layout={Layout.springify()}
        >
          {/* Reason badge */}
          <View style={styles.cardHeader}>
            <View style={[styles.reasonBadge, { backgroundColor: reason.color + '20' }]}>
              {/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */}
              <Ionicons name={reason.icon as any} size={14} color={reason.color} />
              <Text style={[styles.reasonText, { color: reason.color }]}>{reason.label}</Text>
            </View>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>

          {/* Users */}
          <View style={styles.userRow}>
            <Text style={[styles.userLabel, { color: colors.textSecondary }]}>Reporter:</Text>
            <Text style={[styles.username, { color: colors.text }]}>@{item.reporterUsername}</Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={colors.textSecondary}
              style={{ marginHorizontal: 6 }}
            />
            <Text style={[styles.userLabel, { color: colors.textSecondary }]}>Target:</Text>
            <Text style={[styles.username, { color: '#ef4444' }]}>@{item.targetUsername}</Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {item.description}
          </Text>

          {/* Content preview */}
          <View style={[styles.previewBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.previewText, { color: colors.textSecondary }]} numberOfLines={2}>
              "{item.contentPreview}"
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.dismissButton]}
              onPress={() => handleDismiss(item)}
            >
              <Ionicons name="close-circle" size={18} color="#6b7280" />
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(item)}>
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="hammer" size={16} color="#fff" />
                <Text style={styles.actionText}>Take Action</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    },
    [colors, handleAction, handleDismiss, resolvedIds, dismissedIds]
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Moderation Queue</Text>
        <View style={[styles.countBadge, { backgroundColor: '#ef4444' }]}>
          <Text style={styles.countText}>{reports.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary, marginTop: 12 }]}>
            Loading reports...
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, reports.length === 0 && styles.emptyList]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear!</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No pending reports to review.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 14,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 11,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  userLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  username: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  previewBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  dismissText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
  },
});
