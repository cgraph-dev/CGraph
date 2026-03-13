/**
 * Individual tier card for the Premium screen.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../components/ui/glass-card';
import { PremiumTier, BillingCycle } from './premium-types';

interface TierCardProps {
  tier: PremiumTier;
  billingCycle: BillingCycle;
  isCurrentTier: boolean;
  isSelected: boolean;
  onSelect: (tierId: PremiumTier['id']) => void;
  onSubscribe: (tier: PremiumTier) => void;
}

/** Description. */
/** Tier Card component. */
export function TierCard({
  tier,
  billingCycle,
  isCurrentTier,
  isSelected,
  onSelect,
  onSubscribe,
}: TierCardProps) {
  const price = tier.price[billingCycle];
  const pricePerMonth = billingCycle === 'yearly' ? price / 12 : price;

  return (
    <TouchableOpacity style={styles.tierCard} onPress={() => onSelect(tier.id)} activeOpacity={0.9}>
      <GlassCard
        variant={isSelected ? 'neon' : 'crystal'}
        intensity="medium"
        style={{
          ...styles.tierCardInner,
          ...(isSelected ? styles.tierCardSelected : {}),
          ...(tier.popular ? styles.tierCardPopular : {}),
        }}
        borderGradient={isSelected}
      >
        {tier.popular && (
          <View style={styles.popularBadge}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.popularBadgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
            </LinearGradient>
          </View>
        )}

        {/* Tier Header */}
        <View style={styles.tierHeader}>
          <LinearGradient
            colors={tier.gradient}
            style={styles.tierIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={tier.id === 'free' ? 'people' : 'diamond'} size={28} color="#fff" />
          </LinearGradient>

          <View style={styles.tierInfo}>
            <Text style={styles.tierName}>{tier.name}</Text>
            {isCurrentTier && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            )}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.tierPricing}>
          {tier.id === 'free' ? (
            <Text style={styles.tierPrice}>Free Forever</Text>
          ) : (
            <>
              <View style={styles.tierPriceRow}>
                <Text style={styles.tierPrice}>${price}</Text>
                <Text style={styles.tierPriceCycle}>
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </Text>
              </View>
              {billingCycle === 'yearly' && (
                <Text style={styles.tierPricePerMonth}>Just ${pricePerMonth.toFixed(2)}/month</Text>
              )}
            </>
          )}
        </View>

        {/* Features */}
        <View style={styles.tierFeatures}>
          {tier.features.slice(0, 5).map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons
                name={feature.included ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={feature.included ? '#10b981' : '#6b7280'}
              />
              <Text style={[styles.featureText, !feature.included && styles.featureTextDisabled]}>
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Subscribe Button */}
        {tier.id !== 'free' && (
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => onSubscribe(tier)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isCurrentTier ? ['#6b7280', '#4b5563'] : tier.gradient}
              style={styles.subscribeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.subscribeButtonText}>
                {isCurrentTier ? 'Current Plan' : 'Subscribe Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tierCard: { width: '100%' },
  tierCardInner: { padding: 20 },
  tierCardSelected: { borderWidth: 2, borderColor: 'rgba(139, 92, 246, 0.5)' },
  tierCardPopular: { position: 'relative' },
  popularBadge: { position: 'absolute', top: 12, right: 12, zIndex: 1 },
  popularBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  popularBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tierIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierInfo: { flex: 1 },
  tierName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  currentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentBadgeText: { fontSize: 11, fontWeight: '600', color: '#10b981' },
  tierPricing: { marginBottom: 20 },
  tierPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  tierPrice: { fontSize: 32, fontWeight: '800', color: '#fff' },
  tierPriceCycle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  tierPricePerMonth: { fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4 },
  tierFeatures: { gap: 12, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { flex: 1, fontSize: 13, color: '#fff' },
  featureTextDisabled: { color: 'rgba(255, 255, 255, 0.4)', textDecorationLine: 'line-through' },
  subscribeButton: { borderRadius: 14, overflow: 'hidden' },
  subscribeButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  subscribeButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
