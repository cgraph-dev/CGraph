/**
 * ReferralLinkCard - Shareable referral link display
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimationColors } from '@/lib/animations/animation-engine';
import type { ReferralCode } from '../types';

export interface ReferralLinkCardProps {
  referralCode: ReferralCode;
  copied: boolean;
  onCopy: (text: string) => void;
  onShare: () => void;
}

/**
 * Referral Link Card component.
 *
 */
export function ReferralLinkCard({ referralCode, copied, onCopy, onShare }: ReferralLinkCardProps) {
  return (
    <LinearGradient
      colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Ionicons name="link" size={20} color={AnimationColors.primary} />
        <Text style={styles.title}>Your Referral Link</Text>
      </View>

      {/* URL */}
      <View style={styles.urlContainer}>
        <Text style={styles.urlText} numberOfLines={1}>
          {referralCode.url}
        </Text>
        <TouchableOpacity onPress={() => onCopy(referralCode.url)} style={styles.copyButton}>
          <Ionicons name={copied ? 'checkmark' : 'copy'} size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} style={styles.shareButton}>
          <Ionicons name="share-social" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Code */}
      <View style={styles.codeRow}>
        <Text style={styles.codeLabel}>Your code: </Text>
        <TouchableOpacity onPress={() => onCopy(referralCode.code)}>
          <Text style={styles.codeText}>{referralCode.code}</Text>
        </TouchableOpacity>
      </View>

      {/* Usage */}
      <Text style={styles.usageText}>
        Used {referralCode.usageCount} {referralCode.maxUsage ? `/ ${referralCode.maxUsage}` : ''}{' '}
        times
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
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
});

export default ReferralLinkCard;
