import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import api from '../../lib/api';

// ============================================================================
// Types
// ============================================================================

type AdminTab = 'overview' | 'users' | 'reports' | 'audit' | 'settings';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalPosts: number;
  postsToday: number;
  totalThreads: number;
  pendingReports: number;
  bannedUsers: number;
}

interface RecentUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  status: 'active' | 'pending' | 'banned';
}

interface Report {
  id: string;
  type: 'post' | 'user' | 'thread';
  reason: string;
  reportedBy: string;
  targetId: string;
  targetName: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  timestamp: string;
}

// ============================================================================
// FALLBACK DATA
// ============================================================================

const FALLBACK_STATS: DashboardStats = {
  totalUsers: 1234,
  activeUsers: 456,
  newUsersToday: 12,
  totalPosts: 45678,
  postsToday: 89,
  totalThreads: 2345,
  pendingReports: 5,
  bannedUsers: 23,
};

const FALLBACK_RECENT_USERS: RecentUser[] = [
  {
    id: '1',
    username: 'newuser1',
    email: 'new1@example.com',
    createdAt: new Date().toISOString(),
    status: 'active',
  },
  {
    id: '2',
    username: 'newuser2',
    email: 'new2@example.com',
    createdAt: new Date().toISOString(),
    status: 'pending',
  },
  {
    id: '3',
    username: 'newuser3',
    email: 'new3@example.com',
    createdAt: new Date().toISOString(),
    status: 'active',
  },
];

const FALLBACK_REPORTS: Report[] = [
  {
    id: '1',
    type: 'post',
    reason: 'Spam content',
    reportedBy: 'user1',
    targetId: 'p1',
    targetName: 'Suspicious post',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'user',
    reason: 'Harassment',
    reportedBy: 'user2',
    targetId: 'u1',
    targetName: 'BadUser',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

const FALLBACK_AUDIT: AuditLog[] = [
  {
    id: '1',
    action: 'user.ban',
    actor: 'admin',
    target: 'spammer123',
    details: 'Banned for spam',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    action: 'post.delete',
    actor: 'moderator',
    target: 'Post #123',
    details: 'Removed inappropriate content',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    action: 'settings.update',
    actor: 'admin',
    target: 'Registration',
    details: 'Enabled email verification',
    timestamp: new Date().toISOString(),
  },
];

// ============================================================================
// TAB BAR COMPONENT
// ============================================================================

interface TabBarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingReports: number;
}

function TabBar({ activeTab, onTabChange, pendingReports }: TabBarProps) {
  const tabs: { id: AdminTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'users', label: 'Users', icon: 'people' },
    { id: 'reports', label: 'Reports', icon: 'flag' },
    { id: 'audit', label: 'Audit', icon: 'time' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabBar}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          onPress={() => {
            HapticFeedback.light();
            onTabChange(tab.id);
          }}
        >
          <View style={styles.tabIconContainer}>
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? '#10b981' : '#9ca3af'}
            />
            {tab.id === 'reports' && pendingReports > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {pendingReports > 9 ? '9+' : pendingReports}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={20} color={color} />
        {trend && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend.isPositive ? '#10b98120' : '#ef444420' },
            ]}
          >
            <Ionicons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.isPositive ? '#10b981' : '#ef4444'}
            />
            <Text style={[styles.trendText, { color: trend.isPositive ? '#10b981' : '#ef4444' }]}>
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

interface OverviewTabProps {
  stats: DashboardStats;
  recentUsers: RecentUser[];
}

function OverviewTab({ stats, recentUsers }: OverviewTabProps) {
  return (
    <View style={styles.tabContent}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon="people"
          color="#10b981"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard label="Active Today" value={stats.activeUsers} icon="pulse" color="#6366f1" />
        <StatCard label="New Today" value={stats.newUsersToday} icon="person-add" color="#f59e0b" />
        <StatCard
          label="Total Posts"
          value={stats.totalPosts.toLocaleString()}
          icon="document-text"
          color="#3b82f6"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard label="Posts Today" value={stats.postsToday} icon="chatbubbles" color="#8b5cf6" />
        <StatCard
          label="Pending Reports"
          value={stats.pendingReports}
          icon="flag"
          color={stats.pendingReports > 0 ? '#ef4444' : '#10b981'}
        />
      </View>

      {/* Recent Users */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recent Registrations</Text>
        {recentUsers.map((user) => (
          <View key={user.id} style={styles.userItem}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>{user.username[0].toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.username}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    user.status === 'active'
                      ? '#10b98120'
                      : user.status === 'pending'
                        ? '#f59e0b20'
                        : '#ef444420',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      user.status === 'active'
                        ? '#10b981'
                        : user.status === 'pending'
                          ? '#f59e0b'
                          : '#ef4444',
                  },
                ]}
              >
                {user.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// REPORTS TAB
// ============================================================================

interface ReportsTabProps {
  reports: Report[];
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
}

function ReportsTab({ reports, onResolve, onDismiss }: ReportsTabProps) {
  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'post':
        return 'document-text';
      case 'user':
        return 'person';
      case 'thread':
        return 'chatbubbles';
      default:
        return 'alert';
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const resolvedReports = reports.filter((r) => r.status !== 'pending');

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Pending Reports ({pendingReports.length})</Text>

      {pendingReports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={48} color="#10b981" />
          <Text style={styles.emptyText}>No pending reports!</Text>
        </View>
      ) : (
        pendingReports.map((report) => (
          <BlurView key={report.id} intensity={40} tint="dark" style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportType}>
                <Ionicons name={getTypeIcon(report.type)} size={16} color="#9ca3af" />
                <Text style={styles.reportTypeText}>{report.type}</Text>
              </View>
              <Text style={styles.reportDate}>
                {new Date(report.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.reportTarget}>{report.targetName}</Text>
            <Text style={styles.reportReason}>{report.reason}</Text>
            <Text style={styles.reportBy}>Reported by: {report.reportedBy}</Text>
            <View style={styles.reportActions}>
              <TouchableOpacity
                style={[styles.reportButton, styles.reportButtonResolve]}
                onPress={() => onResolve(report.id)}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.reportButtonText}>Resolve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportButton, styles.reportButtonDismiss]}
                onPress={() => onDismiss(report.id)}
              >
                <Ionicons name="close" size={16} color="#fff" />
                <Text style={styles.reportButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        ))
      )}
    </View>
  );
}

// ============================================================================
// AUDIT TAB
// ============================================================================

interface AuditTabProps {
  logs: AuditLog[];
}

function AuditTab({ logs }: AuditTabProps) {
  const getActionIcon = (action: string): keyof typeof Ionicons.glyphMap => {
    if (action.includes('ban')) return 'ban';
    if (action.includes('delete')) return 'trash';
    if (action.includes('update')) return 'create';
    if (action.includes('create')) return 'add';
    return 'document';
  };

  const getActionColor = (action: string): string => {
    if (action.includes('ban') || action.includes('delete')) return '#ef4444';
    if (action.includes('update')) return '#f59e0b';
    if (action.includes('create')) return '#10b981';
    return '#6366f1';
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      {logs.map((log) => (
        <View key={log.id} style={styles.auditItem}>
          <View style={[styles.auditIcon, { backgroundColor: getActionColor(log.action) + '20' }]}>
            <Ionicons
              name={getActionIcon(log.action)}
              size={16}
              color={getActionColor(log.action)}
            />
          </View>
          <View style={styles.auditContent}>
            <Text style={styles.auditAction}>{log.action.replace('.', ' → ')}</Text>
            <Text style={styles.auditDetails}>
              <Text style={styles.auditActor}>{log.actor}</Text> → {log.target}
            </Text>
            <Text style={styles.auditMeta}>{log.details}</Text>
            <Text style={styles.auditTime}>{new Date(log.timestamp).toLocaleString()}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

interface SettingsTabProps {
  onNavigate: (screen: string) => void;
}

function SettingsTab({ onNavigate }: SettingsTabProps) {
  const settingsGroups = [
    {
      title: 'General',
      items: [
        { id: 'site', label: 'Site Settings', icon: 'globe', screen: 'SiteSettings' },
        {
          id: 'registration',
          label: 'Registration',
          icon: 'person-add',
          screen: 'RegistrationSettings',
        },
        { id: 'email', label: 'Email Configuration', icon: 'mail', screen: 'EmailSettings' },
      ],
    },
    {
      title: 'Content',
      items: [
        { id: 'forums', label: 'Forum Management', icon: 'chatbubbles', screen: 'ForumManagement' },
        { id: 'moderation', label: 'Moderation Rules', icon: 'shield', screen: 'ModerationRules' },
        { id: 'badwords', label: 'Word Filters', icon: 'ban', screen: 'WordFilters' },
      ],
    },
    {
      title: 'Security',
      items: [
        { id: 'permissions', label: 'Permissions', icon: 'key', screen: 'Permissions' },
        { id: 'bans', label: 'Ban Management', icon: 'hand-left', screen: 'BanManagement' },
        { id: 'api', label: 'API Keys', icon: 'code', screen: 'ApiKeys' },
      ],
    },
  ];

  return (
    <View style={styles.tabContent}>
      {settingsGroups.map((group) => (
        <View key={group.title} style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>{group.title}</Text>
          <View style={styles.settingsCard}>
            {group.items.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingsItem,
                  index < group.items.length - 1 && styles.settingsItemBorder,
                ]}
                onPress={() => {
                  HapticFeedback.light();
                  onNavigate(item.screen);
                }}
              >
                <View style={styles.settingsItemIcon}>
                  <Ionicons name={item.icon as unknown} size={20} color="#10b981" />
                </View>
                <Text style={styles.settingsItemLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats>(FALLBACK_STATS);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>(FALLBACK_RECENT_USERS);
  const [reports, setReports] = useState<Report[]>(FALLBACK_REPORTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(FALLBACK_AUDIT);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [metricsRes, usersRes, reportsRes, auditRes] = await Promise.allSettled([
        api.get('/api/v1/admin/metrics'),
        api.get('/api/v1/admin/users', {
          params: { per_page: 10, sort: 'created_at', order: 'desc' },
        }),
        api.get('/api/v1/admin/reports'),
        api.get('/api/v1/admin/audit'),
      ]);

      if (metricsRes.status === 'fulfilled') {
        const data = metricsRes.value.data?.data || metricsRes.value.data;
        setStats({
          totalUsers: data.total_users || data.users?.total || 0,
          activeUsers: data.active_users || data.users?.active || 0,
          newUsersToday: data.new_users_today || data.users?.new_today || 0,
          totalPosts: data.total_posts || data.posts?.total || 0,
          postsToday: data.posts_today || data.posts?.today || 0,
          totalThreads: data.total_threads || data.threads?.total || 0,
          pendingReports: data.pending_reports || data.reports?.pending || 0,
          bannedUsers: data.banned_users || data.users?.banned || 0,
        });
      }

      if (usersRes.status === 'fulfilled') {
        const users =
          usersRes.value.data?.data || usersRes.value.data?.users || usersRes.value.data || [];
        setRecentUsers(
          Array.isArray(users)
            ? users.slice(0, 10).map((u: Record<string, unknown>) => ({
                id: u.id,
                username: u.username,
                email: u.email,
                createdAt: u.created_at || u.inserted_at,
                status: u.banned ? 'banned' : u.verified ? 'active' : 'pending',
              }))
            : []
        );
      }

      if (reportsRes.status === 'fulfilled') {
        const reports =
          reportsRes.value.data?.data ||
          reportsRes.value.data?.reports ||
          reportsRes.value.data ||
          [];
        setReports(
          Array.isArray(reports)
            ? reports.map((r: Record<string, unknown>) => ({
                id: r.id,
                type: r.type || r.report_type || 'post',
                reason: r.reason || '',
                reportedBy: r.reported_by || r.reporter?.username || 'Anonymous',
                targetId: r.target_id || r.content_id || '',
                targetName: r.target_name || r.content_preview || 'Unknown',
                status: r.status || 'pending',
                createdAt: r.created_at || r.inserted_at,
              }))
            : []
        );
      }

      if (auditRes.status === 'fulfilled') {
        const logs =
          auditRes.value.data?.data || auditRes.value.data?.logs || auditRes.value.data || [];
        setAuditLogs(
          Array.isArray(logs)
            ? logs.map((l: Record<string, unknown>) => ({
                id: l.id,
                action: l.action || '',
                actor: l.actor || l.user?.username || 'System',
                target: l.target || l.resource || '',
                details: l.details || l.metadata || '',
                timestamp: l.created_at || l.inserted_at,
              }))
            : []
        );
      }
    } catch (err) {
      console.error('[AdminDashboard] Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    HapticFeedback.light();
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // Handle report actions
  const handleResolveReport = async (id: string) => {
    HapticFeedback.medium();
    Alert.alert('Resolve Report', 'Mark this report as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: () => {
          setReports(reports.map((r) => (r.id === id ? { ...r, status: 'resolved' } : r)));
          setStats({ ...stats, pendingReports: stats.pendingReports - 1 });
          HapticFeedback.success();
        },
      },
    ]);
  };

  const handleDismissReport = async (id: string) => {
    HapticFeedback.medium();
    Alert.alert('Dismiss Report', 'Dismiss this report without action?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dismiss',
        style: 'destructive',
        onPress: () => {
          setReports(reports.map((r) => (r.id === id ? { ...r, status: 'dismissed' } : r)));
          setStats({ ...stats, pendingReports: stats.pendingReports - 1 });
        },
      },
    ]);
  };

  // Handle settings navigation
  const handleSettingsNavigate = (screen: string) => {
    Alert.alert('Navigate', `Would navigate to ${screen}`);
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} recentUsers={recentUsers} />;
      case 'users':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>User Management</Text>
            <Text style={styles.comingSoon}>Full user management coming soon</Text>
          </View>
        );
      case 'reports':
        return (
          <ReportsTab
            reports={reports}
            onResolve={handleResolveReport}
            onDismiss={handleDismissReport}
          />
        );
      case 'audit':
        return <AuditTab logs={auditLogs} />;
      case 'settings':
        return <SettingsTab onNavigate={handleSettingsNavigate} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            HapticFeedback.light();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Site management</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingReports={stats.pendingReports}
      />

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#10b981"
            />
          }
        >
          {renderTabContent()}
        </ScrollView>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  tabLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  tabLabelActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tabContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9ca3af',
  },
  reportCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportTypeText: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  reportDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  reportTarget: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  reportReason: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 6,
  },
  reportBy: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 10,
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  reportButtonResolve: {
    backgroundColor: '#10b981',
  },
  reportButtonDismiss: {
    backgroundColor: '#6b7280',
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  auditItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  auditIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditContent: {
    flex: 1,
  },
  auditAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  auditDetails: {
    fontSize: 13,
    color: '#d1d5db',
    marginTop: 2,
  },
  auditActor: {
    fontWeight: '600',
    color: '#10b981',
  },
  auditMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  auditTime: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 4,
  },
  settingsGroup: {
    marginBottom: 20,
  },
  settingsGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingsItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemLabel: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  comingSoon: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
});
