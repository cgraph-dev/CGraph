import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '@/stores';
import { useCoinShop } from './hooks/useCoinShop';
import {
  FloatingParticles,
  ShopHeader,
  BalanceCard,
  CategoryTabs,
  SpecialOffersSection,
  BundlesGrid,
  ItemsGrid,
  PremiumBannerFull,
} from './components';

/**
 * Coin Shop Screen - Revolutionary Premium Edition
 *
 * Next-generation virtual currency shop featuring:
 * - Animated 3D coin display with rotation and glow
 * - Floating particle effects and confetti
 * - Rarity-based item system (Common to Divine)
 * - Animated bundle cards with parallax effects
 * - Streak bonuses and daily rewards
 * - Premium subscription showcase
 * - Purchase animations with celebration effects
 * - Wallet balance with animated counter
 * - Special offers carousel with countdown
 * - Achievement-based discounts
 * - Haptic feedback throughout
 * - Glassmorphism design
 * - Native payment integration
 *
 * @version 2.0.0 - Revolutionary Edition
 */
function CoinShopScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { colors } = useThemeStore();
  const {
    selectedCategory,
    userCoins,
    canClaimDaily,
    headerAnim,
    balanceScaleAnim,
    filteredItems,
    handleCategorySelect,
    handlePurchaseBundle,
    handlePurchaseItem,
    handleClaimDaily,
  } = useCoinShop();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FloatingParticles />

      <ShopHeader
        title="Coin Shop"
        textColor={colors.text}
        canClaimDaily={canClaimDaily}
        onGoBack={() => navigation.goBack()}
        onClaimDaily={handleClaimDaily}
        animValue={headerAnim}
      />

      <BalanceCard
        userCoins={userCoins}
        canClaimDaily={canClaimDaily}
        onClaimDaily={handleClaimDaily}
        scaleAnim={balanceScaleAnim}
      />

      <CategoryTabs selectedCategory={selectedCategory} onSelect={handleCategorySelect} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {selectedCategory === 'bundles' && <SpecialOffersSection />}

        {selectedCategory === 'bundles' ? (
          <BundlesGrid onPurchase={handlePurchaseBundle} />
        ) : (
          <ItemsGrid items={filteredItems} onPurchase={handlePurchaseItem} />
        )}

        {selectedCategory === 'bundles' && <PremiumBannerFull />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
});

export default CoinShopScreen;
