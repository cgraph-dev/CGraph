/**
 * ReportsTab - Report management view
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { Report } from '../types';

export interface ReportsTabProps {
  reports: Report[];
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
}

function getTypeIcon(type: string): keyof typeof Ionicons.glyphMap {
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
}

/**
 * Reports Tab component.
 *
 */
export function ReportsTab({ reports, onResolve, onDismiss }: ReportsTabProps) {
  const pendingReports = reports.filter((r) => r.status === 'pending');

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

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
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
});

export default ReportsTab;
