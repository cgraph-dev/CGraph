/**
 * Billing cycle toggle for the Premium screen.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BillingCycle } from './premium-types';

interface BillingToggleProps {
  billingCycle: BillingCycle;
  onToggle: (cycle: BillingCycle) => void;
}

function DiscountBadge() {
  return (
    <View style={styles.discountBadge}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.discountBadgeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.discountBadgeText}>SAVE 20%</Text>
      </LinearGradient>
    </View>
  );
}

/** Description. */
/** Billing Toggle component. */
export function BillingToggle({ billingCycle, onToggle }: BillingToggleProps) {
  return (
    <View style={styles.billingToggleContainer}>
      <TouchableOpacity
        style={[styles.billingOption, billingCycle === 'monthly' && styles.billingOptionActive]}
        onPress={() => onToggle('monthly')}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.billingOptionText,
            billingCycle === 'monthly' && styles.billingOptionTextActive,
          ]}
        >
          Monthly
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.billingOption, billingCycle === 'yearly' && styles.billingOptionActive]}
        onPress={() => onToggle('yearly')}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.billingOptionText,
            billingCycle === 'yearly' && styles.billingOptionTextActive,
          ]}
        >
          Yearly
        </Text>
        {billingCycle === 'yearly' && <DiscountBadge />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  billingToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    position: 'relative',
  },
  billingOptionActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  billingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  billingOptionTextActive: {
    color: '#fff',
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
  },
  discountBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
