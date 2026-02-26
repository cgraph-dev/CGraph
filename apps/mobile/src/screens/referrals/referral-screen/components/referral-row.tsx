/**
 * ReferralRow - Individual referral display row
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Referral } from '../types';

export interface ReferralRowProps {
  referral: Referral;
}

/**
 *
 */
export function ReferralRow({ referral }: ReferralRowProps) {
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
    <View style={styles.container}>
      <View style={styles.avatar}>
        {referral.referredAvatarUrl ? (
          <Image source={{ uri: referral.referredAvatarUrl }} style={styles.avatarImage} />
        ) : (
          <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{referral.referredUsername[0]}</Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.username}>{referral.referredUsername}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
        <Ionicons
           
          name={statusConfig.icon as keyof typeof Ionicons.glyphMap}
          size={14}
          color={statusConfig.color}
        />
        <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  time: {
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
});

export default ReferralRow;
