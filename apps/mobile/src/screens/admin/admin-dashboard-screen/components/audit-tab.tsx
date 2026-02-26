/**
 * AuditTab - Audit log viewer
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AuditLog } from '../types';

export interface AuditTabProps {
  logs: AuditLog[];
}

function getActionIcon(action: string): keyof typeof Ionicons.glyphMap {
  if (action.includes('ban')) return 'ban';
  if (action.includes('delete')) return 'trash';
  if (action.includes('update')) return 'create';
  if (action.includes('create')) return 'add';
  return 'document';
}

function getActionColor(action: string): string {
  if (action.includes('ban') || action.includes('delete')) return '#ef4444';
  if (action.includes('update')) return '#f59e0b';
  if (action.includes('create')) return '#10b981';
  return '#6366f1';
}

/**
 *
 */
export function AuditTab({ logs }: AuditTabProps) {
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
});

export default AuditTab;
