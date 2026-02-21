/**
 * SubscriptionCard Component (Mobile)
 *
 * Mobile-optimized subscription tier display.
 * Features:
 * - Compact card layout
 * - Feature list
 * - Price display
 * - Subscribe action
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../ui/GlassCard';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  yearlyPrice?: number;
  description: string;
  features: string[];
  color: string;
  badge?: string;
  popular?: boolean;
}

export interface SubscriptionCardProps {
  tier: SubscriptionTier;
  currentTier?: string;
  yearly?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  onSubscribe?: (tierId: string) => void;
}

export function SubscriptionCard({
  tier,
  currentTier,
  yearly = false,
  variant = 'default',
  onSubscribe,
}: SubscriptionCardProps): React.ReactElement {
  const isCurrentPlan = currentTier === tier.id;
  const displayPrice = yearly && tier.yearlyPrice ? tier.yearlyPrice / 12 : tier.price;
  const savings =
    yearly && tier.yearlyPrice
      ? Math.round(((tier.price * 12 - tier.yearlyPrice) / (tier.price * 12)) * 100)
      : 0;

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubscribe?.(tier.id);
  };

  if (variant === 'compact') {
    return (
      <GlassCard style={[styles.compactCard, tier.popular && styles.popularCard] as unknown}>
        <View style={styles.compactHeader}>
          <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
            <Text style={styles.tierBadgeText}>{tier.name}</Text>
          </View>
          {tier.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
        </View>

        <View style={styles.compactPrice}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.amount}>{displayPrice.toFixed(2)}</Text>
          <Text style={styles.period}>/mo</Text>
        </View>

        <Pressable
          onPress={handleSubscribe}
          disabled={isCurrentPlan}
          style={[styles.compactButton, isCurrentPlan && styles.currentButton]}
        >
          <Text style={styles.buttonText}>{isCurrentPlan ? 'Current Plan' : 'Select'}</Text>
        </Pressable>
      </GlassCard>
    );
  }

  if (variant === 'featured') {
    return (
      <LinearGradient colors={[tier.color + '40', tier.color + '10']} style={styles.featuredCard}>
        <View style={styles.featuredBorder}>
          {/* Header */}
          <View style={styles.featuredHeader}>
            <View style={[styles.tierIcon, { backgroundColor: tier.color }]}>
              <MaterialCommunityIcons name="crown" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierDescription}>{tier.description}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.featuredAmount}>{displayPrice.toFixed(2)}</Text>
              <Text style={styles.period}>/month</Text>
            </View>
            {yearly && savings > 0 && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save {savings}%</Text>
              </View>
            )}
          </View>

          {/* Features */}
          <View style={styles.featuresList}>
            {tier.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <MaterialCommunityIcons name="check-circle" size={18} color={tier.color} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <Pressable onPress={handleSubscribe} disabled={isCurrentPlan}>
            <LinearGradient
              colors={isCurrentPlan ? ['#374151', '#374151'] : [tier.color, tier.color + 'CC']}
              style={styles.subscribeButton}
            >
              <Text style={styles.subscribeText}>
                {isCurrentPlan ? 'Current Plan' : 'Subscribe Now'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  // Default variant
  return (
    <GlassCard style={[styles.card, tier.popular && styles.popularCard] as unknown}>
      {/* Badge */}
      {tier.popular && (
        <View style={[styles.cardBadge, { backgroundColor: tier.color }]}>
          <Text style={styles.cardBadgeText}>Most Popular</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTierName, { color: tier.color }]}>{tier.name}</Text>
        <Text style={styles.cardDescription}>{tier.description}</Text>
      </View>

      {/* Price */}
      <View style={styles.cardPriceSection}>
        <View style={styles.priceRow}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.cardAmount}>{displayPrice.toFixed(2)}</Text>
          <Text style={styles.period}>/month</Text>
        </View>
        {yearly && (
          <Text style={styles.billedYearly}>
            Billed annually (${tier.yearlyPrice?.toFixed(2)}/year)
          </Text>
        )}
      </View>

      {/* Features */}
      <ScrollView style={styles.cardFeatures} showsVerticalScrollIndicator={false}>
        {tier.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <MaterialCommunityIcons name="check" size={16} color="#10B981" />
            <Text style={styles.cardFeatureText}>{feature}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Action */}
      <Pressable
        onPress={handleSubscribe}
        disabled={isCurrentPlan}
        style={({ pressed }) => [
          styles.cardButton,
          { backgroundColor: isCurrentPlan ? '#374151' : tier.color },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={styles.cardButtonText}>{isCurrentPlan ? 'Current Plan' : 'Get Started'}</Text>
      </Pressable>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  // Compact variant
  compactCard: {
    padding: 16,
    width: 140,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  popularBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  compactPrice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  period: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  compactButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  popularCard: {
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  // Featured variant
  featuredCard: {
    borderRadius: 20,
    padding: 2,
  },
  featuredBorder: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: 18,
    padding: 20,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tierDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featuredAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuresList: {
    marginBottom: 20,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Default variant
  card: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  cardBadge: {
    position: 'absolute',
    top: 12,
    right: -28,
    paddingHorizontal: 32,
    paddingVertical: 4,
    transform: [{ rotate: '45deg' }],
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTierName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  cardPriceSection: {
    marginBottom: 20,
  },
  cardAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  billedYearly: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  cardFeatures: {
    maxHeight: 200,
    marginBottom: 20,
  },
  cardFeatureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  cardButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SubscriptionCard;
