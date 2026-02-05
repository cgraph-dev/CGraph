/**
 * OverviewTab - Dashboard overview with stats and recent users
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DashboardStats, RecentUser } from '../types';
import { StatCard } from './StatCard';

export interface OverviewTabProps {
  stats: DashboardStats;
  recentUsers: RecentUser[];
}

export function OverviewTab({ stats, recentUsers }: OverviewTabProps) {
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

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
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
});

export default OverviewTab;
