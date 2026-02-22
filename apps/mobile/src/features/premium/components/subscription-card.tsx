/**
 * Subscription Card Component
 *
 * Displays subscription tier information with pricing and features.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SubscriptionCardProps {
  tier: 'premium' | 'enterprise';
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isCurrentPlan: boolean;
  isPopular?: boolean;
  onSelect: () => void;
}

const TIER_COLORS = {
  premium: { bg: ['#3B1F5B', '#1F1035'] as const, accent: '#8B5CF6' },
  enterprise: { bg: ['#4A3728', '#1F1610'] as const, accent: '#F59E0B' },
};

export default function SubscriptionCard({
  tier,
  name,
  priceMonthly,
  priceYearly,
  features,
  isCurrentPlan,
  isPopular = false,
  onSelect,
}: SubscriptionCardProps) {
  const colors = TIER_COLORS[tier];
  const yearlyDiscount = Math.round((1 - priceYearly / 12 / priceMonthly) * 100);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect();
  };

  return (
    <View style={styles.wrapper}>
      {isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}

      <LinearGradient
        colors={colors.bg}
        style={[styles.container, isCurrentPlan && styles.currentPlan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.tierName}>{name}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.price}>{priceMonthly}</Text>
          <Text style={styles.period}>/month</Text>
        </View>

        {yearlyDiscount > 0 && (
          <Text style={[styles.yearlyPrice, { color: colors.accent }]}>
            ${(priceYearly / 12).toFixed(2)}/mo when billed yearly (save {yearlyDiscount}%)
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.featuresList}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: isCurrentPlan ? '#4B5563' : colors.accent }]}
          onPress={handlePress}
          disabled={isCurrentPlan}
        >
          <Text style={styles.buttonText}>{isCurrentPlan ? 'Current Plan' : 'Select Plan'}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -60,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  container: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentPlan: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  tierName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 4,
  },
  currency: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 20,
    marginBottom: 4,
  },
  price: {
    color: 'white',
    fontSize: 48,
    fontWeight: '700',
  },
  period: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  yearlyPrice: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 10,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
