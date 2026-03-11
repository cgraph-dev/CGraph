/**
 * Special offers section displaying limited-time coin shop deals.
 * @module screens/premium/coin-shop-screen/components/special-offers-section
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import { SPECIAL_OFFERS } from './constants';
import { CountdownTimer } from './countdown-timer';

/**
 *
 */
export function SpecialOffersSection() {
  const { colors } = useThemeStore();

  return (
    <View style={styles.specialOffersSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <LinearGradient colors={['#ef4444', '#f97316']} style={styles.sectionIcon}>
            <Ionicons name="flash" size={16} color="#fff" />
          </LinearGradient>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Special Offers</Text>
        </View>
        <View style={styles.limitedBadge}>
          <Text style={styles.limitedText}>LIMITED</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.offersScroll}
      >
        {SPECIAL_OFFERS.map((offer) => {
          const discountPercent = Math.round(
            ((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100
          );
          return (
            <TouchableOpacity
              key={offer.id}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  offer.title,
                  `Get ${offer.coins.toLocaleString()} coins for $${offer.discountPrice.toFixed(2)}! (${discountPercent}% off)`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Buy Now', onPress: () => {} },
                  ]
                );
              }}
            >
              <LinearGradient
                colors={offer.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.offerCard}
              >
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{discountPercent}%</Text>
                </View>
                <Text style={styles.offerIcon}>{offer.icon}</Text>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerCoins}>{offer.coins.toLocaleString()} Coins</Text>
                <View style={styles.offerFooter}>
                  <CountdownTimer endsInHours={offer.endsInHours} />
                  <View style={styles.offerPriceRow}>
                    <Text style={styles.offerOriginalPrice}>${offer.originalPrice.toFixed(2)}</Text>
                    <Text style={styles.offerSalePrice}>${offer.discountPrice.toFixed(2)}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  specialOffersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  limitedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  limitedText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  offersScroll: {
    paddingRight: 16,
  },
  offerCard: {
    width: 260,
    marginRight: 12,
    borderRadius: 20,
    padding: 16,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  discountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  offerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  offerCoins: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  offerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerOriginalPrice: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  offerSalePrice: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
});
