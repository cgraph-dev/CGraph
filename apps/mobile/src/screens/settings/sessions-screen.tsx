/**
 * Sessions Screen (Mobile)
 *
 * Displays active sessions and allows revoking them.
 * API: GET /api/v1/me/sessions, DELETE /api/v1/me/sessions/:id
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
import { useTheme } from '../../contexts/theme-context';
import api from '../../lib/api';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Sessions'>;
};

interface Session {
  id: string;
  ip: string;
  user_agent: string;
  location: string | null;
  current: boolean;
  last_active_at: string;
  created_at: string;
}

function formatLastActive(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function parseBrowser(ua: string): string {
  if (/CGraph Mobile/i.test(ua)) return 'CGraph Mobile';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Edg/i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/Opera|OPR/i.test(ua)) return 'Opera';
  return 'Unknown Browser';
}

function getDeviceIcon(ua: string): keyof typeof Ionicons.glyphMap {
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) return 'phone-portrait-outline';
  if (/Tablet|iPad/i.test(ua)) return 'tablet-portrait-outline';
  return 'desktop-outline';
}

export default function SessionsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/me/sessions');
      const data = response.data?.data ?? response.data ?? [];
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = useCallback((session: Session) => {
    Alert.alert(
      'Revoke Session',
      `End the session on ${parseBrowser(session.user_agent)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setRevokingId(session.id);
            try {
              await api.delete(`/api/v1/me/sessions/${session.id}`);
              setSessions((prev) => prev.filter((s) => s.id !== session.id));
            } catch {
              Alert.alert('Error', 'Failed to revoke session');
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  }, []);

  const handleRevokeAll = useCallback(() => {
    const otherSessions = sessions.filter((s) => !s.current);
    if (otherSessions.length === 0) return;

    Alert.alert(
      'Revoke All Sessions',
      `End ${otherSessions.length} other session${otherSessions.length > 1 ? 's' : ''}? You will stay logged in on this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: async () => {
            setRevokingId('all');
            try {
              await Promise.all(
                otherSessions.map((s) => api.delete(`/api/v1/me/sessions/${s.id}`))
              );
              setSessions((prev) => prev.filter((s) => s.current));
            } catch {
              Alert.alert('Error', 'Some sessions could not be revoked');
              fetchSessions();
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  }, [sessions, fetchSessions]);

  const currentSession = sessions.find((s) => s.current);
  const otherSessions = sessions.filter((s) => !s.current);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Active Sessions</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={otherSessions}
        keyExtractor={(item) => item.id}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <>
            {/* Current Session */}
            {currentSession && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Current Session
                </Text>
                <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
                  <View style={styles.sessionItem}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons
                        name={getDeviceIcon(currentSession.user_agent)}
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionRow}>
                        <Text style={[styles.sessionDevice, { color: colors.text }]}>
                          {parseBrowser(currentSession.user_agent)}
                        </Text>
                        <View style={[styles.currentBadge, { backgroundColor: '#10B981' }]}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      </View>
                      <Text style={[styles.sessionDetail, { color: colors.textSecondary }]}>
                        {currentSession.location || 'Unknown location'} · {currentSession.ip}
                      </Text>
                      <Text style={[styles.sessionDetail, { color: colors.textSecondary }]}>
                        Active now
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Section title for other sessions */}
            {otherSessions.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Other Sessions ({otherSessions.length})
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item: session, index: idx }) => (
          <View style={[styles.sectionContent, idx === 0 ? { backgroundColor: colors.surface, borderTopLeftRadius: 12, borderTopRightRadius: 12 } : { backgroundColor: colors.surface }, idx === otherSessions.length - 1 ? { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 } : {}]}>
            <View style={styles.sessionItem}>
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceHover || colors.border }]}>
                <Ionicons
                  name={getDeviceIcon(session.user_agent)}
                  size={22}
                  color={colors.textSecondary}
                />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionDevice, { color: colors.text }]}>
                  {parseBrowser(session.user_agent)}
                </Text>
                <Text style={[styles.sessionDetail, { color: colors.textSecondary }]}>
                  {session.location || 'Unknown location'} · {session.ip}
                </Text>
                <Text style={[styles.sessionDetail, { color: colors.textSecondary }]}>
                  {formatLastActive(session.last_active_at || session.created_at)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRevoke(session)}
                disabled={revokingId === session.id || revokingId === 'all'}
                style={[styles.revokeButton, { borderColor: '#EF4444' }]}
              >
                {revokingId === session.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text style={styles.revokeButtonText}>Revoke</Text>
                )}
              </Pressable>
            </View>
            {idx < otherSessions.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            )}
          </View>
        )}
        ListFooterComponent={
          <>
            {/* Revoke All Button */}
            {otherSessions.length > 0 && (
              <Pressable
                onPress={handleRevokeAll}
                disabled={revokingId === 'all'}
                style={[styles.revokeAllButton, { backgroundColor: '#EF4444' + '15' }]}
              >
                {revokingId === 'all' ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    <Text style={styles.revokeAllText}>Revoke All Other Sessions</Text>
                  </>
                )}
              </Pressable>
            )}

            {/* Empty state */}
            {otherSessions.length === 0 && currentSession && (
              <View style={styles.emptyState}>
                <Ionicons name="shield-checkmark-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  No other active sessions. Only this device is signed in.
                </Text>
              </View>
            )}
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDevice: {
    fontSize: 16,
    fontWeight: '500',
  },
  sessionDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  revokeButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  revokeButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
  revokeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  revokeAllText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
