import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { useTheme } from '../../theme/use-theme';
import { ModQueueList } from './components/mod-queue-list';

// ── Types ──────────────────────────────────────────────────────────
interface ModQueueItem {
  id: string;
  content_type: 'thread' | 'post' | 'comment';
  content_preview: string;
  reporter: { id: string; username: string; avatar_url?: string };
  reported_user: { id: string; username: string };
  reason: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

interface ModStats {
  pending_count: number;
  resolved_today: number;
  active_warnings: number;
  recent_bans: number;
}

interface ForumWarning {
  id: string;
  user: { id: string; username: string };
  reason: string;
  points: number;
  issued_by: { id: string; username: string };
  created_at: string;
  expires_at?: string;
  acknowledged: boolean;
  revoked: boolean;
}

// ── Tab Selector ───────────────────────────────────────────────────
type ModTab = 'queue' | 'warnings' | 'stats';

interface TabSelectorProps {
  activeTab: ModTab;
  onTabChange: (tab: ModTab) => void;
  pendingCount: number;
}

function TabSelector({ activeTab, onTabChange, pendingCount }: TabSelectorProps) {
  const { colors } = useTheme();

  const tabs: { key: ModTab; label: string; badge?: number }[] = [
    { key: 'queue', label: 'Mod Queue', badge: pendingCount },
    { key: 'warnings', label: 'Warnings' },
    { key: 'stats', label: 'Stats' },
  ];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === tab.key ? colors.primary : colors.textSecondary },
            ]}
          >
            {tab.label}
          </Text>
          {tab.badge != null && tab.badge > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{tab.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Warning Item ───────────────────────────────────────────────────
function WarningItem({
  warning,
  onRevoke,
}: {
  warning: ForumWarning;
  onRevoke: (id: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.warningCard, { backgroundColor: colors.surface }]}>
      <View style={styles.warningHeader}>
        <Text style={[styles.warningUser, { color: colors.text }]}>
          {warning.user.username}
        </Text>
        <View
          style={[
            styles.pointsBadge,
            {
              backgroundColor:
                warning.points >= 5
                  ? colors.error
                  : warning.points >= 3
                    ? '#f59e0b'
                    : colors.primary,
            },
          ]}
        >
          <Text style={styles.pointsText}>{warning.points} pts</Text>
        </View>
      </View>
      <Text style={[styles.warningReason, { color: colors.textSecondary }]}>
        {warning.reason}
      </Text>
      <View style={styles.warningMeta}>
        <Text style={[styles.metaText, { color: colors.textTertiary }]}>
          By {warning.issued_by.username} •{' '}
          {new Date(warning.created_at).toLocaleDateString()}
        </Text>
        {warning.expires_at && (
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            Expires: {new Date(warning.expires_at).toLocaleDateString()}
          </Text>
        )}
      </View>
      {!warning.revoked && (
        <TouchableOpacity
          style={[styles.revokeButton, { borderColor: colors.error }]}
          onPress={() => onRevoke(warning.id)}
        >
          <Text style={[styles.revokeText, { color: colors.error }]}>Revoke</Text>
        </TouchableOpacity>
      )}
      {warning.revoked && (
        <Text style={[styles.revokedLabel, { color: colors.textTertiary }]}>Revoked</Text>
      )}
    </View>
  );
}

// ── Stats Card ─────────────────────────────────────────────────────
function StatsCard({ stats }: { stats: ModStats }) {
  const { colors } = useTheme();

  const items = [
    { label: 'Pending Reports', value: stats.pending_count, color: '#f59e0b' },
    { label: 'Resolved Today', value: stats.resolved_today, color: '#10b981' },
    { label: 'Active Warnings', value: stats.active_warnings, color: colors.error },
    { label: 'Recent Bans', value: stats.recent_bans, color: '#ef4444' },
  ];

  return (
    <View style={styles.statsGrid}>
      {items.map((item) => (
        <View key={item.label} style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Quick Warn Form ────────────────────────────────────────────────
function QuickWarnButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.quickWarnButton, { backgroundColor: colors.primary }]}
      onPress={onPress}
    >
      <Text style={styles.quickWarnText}>+ Issue Warning</Text>
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────────────
interface ForumModerationScreenProps {
  route: { params: { forumId: string } };
}

export function ForumModerationScreen({ route }: ForumModerationScreenProps) {
  const { forumId } = route.params;
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<ModTab>('queue');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queue, setQueue] = useState<ModQueueItem[]>([]);
  const [warnings, setWarnings] = useState<ForumWarning[]>([]);
  const [stats, setStats] = useState<ModStats>({
    pending_count: 0,
    resolved_today: 0,
    active_warnings: 0,
    recent_bans: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      // API calls would go here - using forumId
      // const [queueRes, warningsRes, statsRes] = await Promise.all([
      //   forumService.getModQueue(forumId),
      //   forumService.getWarnings(forumId),
      //   forumService.getModStats(forumId),
      // ]);
      // setQueue(queueRes.data);
      // setWarnings(warningsRes.data);
      // setStats(statsRes.data);
    } catch (error) {
      console.error('[ForumModeration] Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [forumId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleModAction = useCallback(
    async (itemId: string, action: 'approve' | 'reject' | 'hide' | 'delete') => {
      try {
        // await forumService.takeModAction(forumId, itemId, action);
        setQueue((prev) => prev.filter((item) => item.id !== itemId));
        setStats((prev) => ({
          ...prev,
          pending_count: Math.max(0, prev.pending_count - 1),
          resolved_today: prev.resolved_today + 1,
        }));
      } catch (error) {
        Alert.alert('Error', 'Failed to perform moderation action');
      }
    },
    [forumId],
  );

  const handleRevokeWarning = useCallback(
    async (warningId: string) => {
      Alert.alert('Revoke Warning', 'Are you sure you want to revoke this warning?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              // await forumService.revokeWarning(forumId, warningId);
              setWarnings((prev) =>
                prev.map((w) => (w.id === warningId ? { ...w, revoked: true } : w)),
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke warning');
            }
          },
        },
      ]);
    },
    [forumId],
  );

  const handleIssueWarning = useCallback(() => {
    // Navigate to warning form or show bottom sheet
    Alert.alert('Issue Warning', 'Warning form would open here');
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TabSelector
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={stats.pending_count}
      />

      {activeTab === 'queue' && (
        <ModQueueList
          items={queue}
          onApprove={(id) => handleModAction(id, 'approve')}
          onReject={(id) => handleModAction(id, 'reject')}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      {activeTab === 'warnings' && (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <QuickWarnButton onPress={handleIssueWarning} />
          {warnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No warnings issued
              </Text>
            </View>
          ) : (
            warnings.map((warning) => (
              <WarningItem
                key={warning.id}
                warning={warning}
                onRevoke={handleRevokeWarning}
              />
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'stats' && (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <StatsCard stats={stats} />
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, padding: 16 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabLabel: { fontSize: 14, fontWeight: '600' },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  warningCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningUser: { fontSize: 16, fontWeight: '600' },
  pointsBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pointsText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  warningReason: { fontSize: 14, marginBottom: 8 },
  warningMeta: { gap: 2, marginBottom: 8 },
  metaText: { fontSize: 12 },
  revokeButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  revokeText: { fontSize: 13, fontWeight: '600' },
  revokedLabel: { fontSize: 13, fontStyle: 'italic' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center' },
  quickWarnButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  quickWarnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 15 },
});
