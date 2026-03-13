/**
 * Premium screen footer: manage subscription + legal links.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../../components/ui/glass-card';

interface PremiumFooterProps {
  currentTier: string;
  onManageSubscription: () => void;
  colors: Record<string, string>;
}

/** Description. */
/** Premium Footer component. */
export function PremiumFooter({ currentTier, onManageSubscription, colors }: PremiumFooterProps) {
  return (
    <>
      {/* Manage Subscription */}
      {currentTier !== 'free' && (
        <TouchableOpacity
          style={styles.manageButton}
          onPress={onManageSubscription}
          activeOpacity={0.8}
        >
          <GlassCard variant="frosted" intensity="subtle" style={styles.manageCard}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
            <Text style={[styles.manageText, { color: colors.text }]}>Manage Subscription</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </GlassCard>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Subscriptions automatically renew unless canceled at least 24 hours before the end of the
          current period.
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL('https://cgraph.org/terms');
          }}
        >
          <Text style={styles.footerLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  manageButton: { marginBottom: 24 },
  manageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  manageText: { flex: 1, fontSize: 15, fontWeight: '600' },
  footer: { alignItems: 'center', gap: 12 },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
    textDecorationLine: 'underline',
  },
});
