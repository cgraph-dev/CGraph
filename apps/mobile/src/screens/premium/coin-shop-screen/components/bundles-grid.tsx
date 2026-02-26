import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';
import { COIN_BUNDLES, CoinBundle } from './constants';

interface BundlesGridProps {
  onPurchase: (bundle: CoinBundle) => void;
}

/**
 *
 */
export function BundlesGrid({ onPurchase }: BundlesGridProps) {
  return (
    <View style={styles.bundlesGrid}>
      {COIN_BUNDLES.map((bundle) => {
        const totalCoins = bundle.coins + bundle.bonus;
        const priceNum = parseFloat(bundle.price.replace('$', ''));
        const pricePerCoin = (priceNum / totalCoins).toFixed(3);

        return (
          <TouchableOpacity
            key={bundle.id}
            style={styles.bundleCard}
            onPress={() => onPurchase(bundle)}
            activeOpacity={0.9}
          >
            <GlassCard
              variant={bundle.popular ? 'neon' : 'crystal'}
              intensity="medium"
              style={styles.bundleCardInner}
              borderGradient={bundle.popular}
            >
              {bundle.popular && (
                <View style={styles.bundleBadge}>
                  <LinearGradient
                    colors={['#8b5cf6', '#7c3aed']}
                    style={styles.bundleBadgeGradient}
                  >
                    <Text style={styles.bundleBadgeText}>⭐ POPULAR</Text>
                  </LinearGradient>
                </View>
              )}

              <View style={styles.bundleIcon}>
                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.bundleIconGradient}>
                  <Ionicons name="diamond" size={32} color="#fff" />
                </LinearGradient>
              </View>

              <Text style={styles.bundleCoins}>{totalCoins}</Text>
              <Text style={styles.bundleCoinsLabel}>Coins</Text>

              {bundle.bonus > 0 && (
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusBadgeText}>+{bundle.bonus} Bonus</Text>
                </View>
              )}

              <View style={styles.bundlePriceContainer}>
                <Text style={styles.bundlePrice}>{bundle.price}</Text>
                <Text style={styles.bundlePricePerCoin}>${pricePerCoin}/coin</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bundlesGrid: {
    gap: 12,
  },
  bundleCard: {
    width: '100%',
  },
  bundleCardInner: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  bundleBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  bundleBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bundleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  bundleIcon: {
    marginBottom: 12,
  },
  bundleIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bundleCoins: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  bundleCoinsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  bonusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  bonusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  bundlePriceContainer: {
    alignItems: 'center',
  },
  bundlePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  bundlePricePerCoin: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
});
