/**
 * AdminDashboardScreen
 *
 * Admin control panel with stats, user management, reports, and settings.
 *
 * @refactored Extracted from 1147-line file:
 * - types.ts: Types and fallback data
 * - hooks/useAdminDashboard: Data fetching and state
 * - components/TabBar: Navigation tabs
 * - components/StatCard: Statistics display
 * - components/OverviewTab: Dashboard overview
 * - components/ReportsTab: Report management
 * - components/AuditTab: Audit logs
 * - components/SettingsTab: Settings navigation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { AdminTab } from './types';
import { useAdminDashboard } from './hooks';
import { TabBar, OverviewTab, ReportsTab, AuditTab, SettingsTab } from './components';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const {
    stats,
    recentUsers,
    reports,
    auditLogs,
    isLoading,
    isRefreshing,
    handleRefresh,
    updateReportStatus,
  } = useAdminDashboard();

  // Handle report actions
  const handleResolveReport = (id: string) => {
    HapticFeedback.medium();
    Alert.alert('Resolve Report', 'Mark this report as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: () => {
          updateReportStatus(id, 'resolved');
          HapticFeedback.success();
        },
      },
    ]);
  };

  const handleDismissReport = (id: string) => {
    HapticFeedback.medium();
    Alert.alert('Dismiss Report', 'Dismiss this report without action?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dismiss',
        style: 'destructive',
        onPress: () => {
          updateReportStatus(id, 'dismissed');
        },
      },
    ]);
  };

  // Handle settings navigation
  const handleSettingsNavigate = (screen: string) => {
    Alert.alert('Navigate', `Would navigate to ${screen}`);
  };

  const onRefresh = () => {
    HapticFeedback.light();
    handleRefresh();
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
        <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
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
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
        >
          {renderTabContent()}
        </ScrollView>
      )}
    </View>
  );
}

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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  comingSoon: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
});
