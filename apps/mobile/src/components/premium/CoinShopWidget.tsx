/**
 * CoinShopWidget Component (Mobile)
 *
 * Mobile-optimized virtual currency purchase interface.
 * Features:
 * - Package cards with bonus display
 * - Popular/best value badges
 * - Purchase flow integration
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../ui/GlassCard';

export interface CoinPackage {
  id: string;
  coins: number;
  bonusCoins?: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
}

export interface CoinShopWidgetProps {
  packages: CoinPackage[];
  currentBalance?: number;
  variant?: 'default' | 'compact' | 'inline';
  onPurchase?: (packageId: string) => void;
}

const DEFAULT_PACKAGES: CoinPackage[] = [
  { id: 'pack_100', coins: 100, price: 0.99 },
  { id: 'pack_500', coins: 500, bonusCoins: 50, price: 4.99, popular: true },
  { id: 'pack_1000', coins: 1000, bonusCoins: 150, price: 9.99 },
  { id: 'pack_5000', coins: 5000, bonusCoins: 1000, price: 39.99, bestValue: true },
];

export const CoinShopWidget: React.FC<CoinShopWidgetProps> = ({
  packages = DEFAULT_PACKAGES,
  currentBalance = 0,
  variant = 'default',
  onPurchase,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSelectPackage = (pkg: CoinPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPackage(pkg);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = () => {
    if (selectedPackage) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPurchase?.(selectedPackage.id);
    }
    setShowConfirmModal(false);
    setSelectedPackage(null);
  };

  const renderPackageCard = (pkg: CoinPackage) => {
    const totalCoins = pkg.coins + (pkg.bonusCoins || 0);
    const pricePerCoin = pkg.price / totalCoins;

    return (
      <Pressable
        key={pkg.id}
        onPress={() => handleSelectPackage(pkg)}
        style={({ pressed }) => (pressed ? { opacity: 0.8, transform: [{ scale: 0.98 }] } : {})}
      >
        <GlassCard
          style={
            [
              variant === 'compact' ? styles.compactPackage : styles.packageCard,
              (pkg.popular || pkg.bestValue) && styles.highlightedPackage,
            ] as unknown
          }
        >
          {/* Badges */}
          {pkg.popular && (
            <View style={[styles.badge, styles.popularBadge]}>
              <MaterialCommunityIcons name="star" size={10} color="#FFFFFF" />
              <Text style={styles.badgeText}>Popular</Text>
            </View>
          )}
          {pkg.bestValue && (
            <View style={[styles.badge, styles.bestValueBadge]}>
              <MaterialCommunityIcons name="trophy" size={10} color="#FFFFFF" />
              <Text style={styles.badgeText}>Best Value</Text>
            </View>
          )}

          {/* Coin Icon */}
          <View style={styles.coinIconContainer}>
            <MaterialCommunityIcons name="circle-multiple" size={32} color="#F59E0B" />
          </View>

          {/* Coins */}
          <View style={styles.coinsSection}>
            <Text style={styles.coinAmount}>{pkg.coins.toLocaleString()}</Text>
            {pkg.bonusCoins && pkg.bonusCoins > 0 && (
              <View style={styles.bonusTag}>
                <Text style={styles.bonusText}>+{pkg.bonusCoins}</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.priceButton}>
            <Text style={styles.priceText}>${pkg.price.toFixed(2)}</Text>
          </LinearGradient>

          {/* Value indicator */}
          {variant !== 'compact' && (
            <Text style={styles.valueText}>${(pricePerCoin * 100).toFixed(2)}/100 coins</Text>
          )}
        </GlassCard>
      </Pressable>
    );
  };

  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        <View style={styles.inlineHeader}>
          <View style={styles.balanceDisplay}>
            <MaterialCommunityIcons name="circle-multiple" size={20} color="#F59E0B" />
            <Text style={styles.balanceAmount}>{currentBalance.toLocaleString()}</Text>
          </View>
          <Pressable onPress={() => setShowConfirmModal(true)} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Coins</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Balance Display */}
      <GlassCard style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <View style={styles.balanceValueRow}>
              <MaterialCommunityIcons name="circle-multiple" size={28} color="#F59E0B" />
              <Text style={styles.balanceValue}>{currentBalance.toLocaleString()}</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="wallet" size={40} color="#F59E0B" />
        </View>
      </GlassCard>

      {/* Packages Grid */}
      <Text style={styles.sectionTitle}>Get More Coins</Text>
      <ScrollView
        horizontal={variant === 'compact'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={variant === 'compact' ? styles.compactScroll : styles.packagesGrid}
      >
        {packages.map(renderPackageCard)}
      </ScrollView>

      {/* Confirm Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>

            {selectedPackage && (
              <View style={styles.modalDetails}>
                <View style={styles.modalCoinRow}>
                  <MaterialCommunityIcons name="circle-multiple" size={40} color="#F59E0B" />
                  <View>
                    <Text style={styles.modalCoins}>
                      {selectedPackage.coins.toLocaleString()} Coins
                    </Text>
                    {selectedPackage.bonusCoins && (
                      <Text style={styles.modalBonus}>
                        +{selectedPackage.bonusCoins} bonus coins!
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.modalPrice}>
                  <Text style={styles.modalPriceLabel}>Total</Text>
                  <Text style={styles.modalPriceAmount}>${selectedPackage.price.toFixed(2)}</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowConfirmModal(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmPurchase}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.confirmButton}>
                  <Text style={styles.confirmText}>Purchase</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  balanceCard: {
    padding: 16,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  packagesGrid: {
    gap: 12,
  },
  compactScroll: {
    paddingVertical: 4,
    gap: 12,
  },
  packageCard: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  compactPackage: {
    padding: 12,
    alignItems: 'center',
    width: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  highlightedPackage: {
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadge: {
    backgroundColor: '#3B82F6',
  },
  bestValueBadge: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  coinIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  coinsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  coinAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bonusTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  valueText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  inlineContainer: {
    padding: 12,
  },
  inlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDetails: {
    marginBottom: 24,
  },
  modalCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalCoins: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalBonus: {
    fontSize: 14,
    color: '#10B981',
  },
  modalPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalPriceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modalPriceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CoinShopWidget;
