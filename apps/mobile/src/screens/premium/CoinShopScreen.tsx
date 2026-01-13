import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import GlassCard from '../../components/ui/GlassCard';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Coin Shop Screen (Mobile)
 *
 * Mobile-optimized virtual currency shop with:
 * - Coin purchase bundles with bonus coins
 * - Item shop (themes, badges, effects, boosts)
 * - Daily free coin bonus
 * - Purchase history
 * - Haptic feedback
 * - Glassmorphism design
 * - Native payment integration ready
 */

interface CoinBundle {
  id: string;
  coins: number;
  bonus: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'theme' | 'badge' | 'effect' | 'boost';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  preview?: string;
}

const COIN_BUNDLES: CoinBundle[] = [
  { id: 'small', coins: 100, bonus: 0, price: 0.99 },
  { id: 'medium', coins: 500, bonus: 50, price: 4.99, popular: true },
  { id: 'large', coins: 1200, bonus: 200, price: 9.99 },
  { id: 'mega', coins: 2500, bonus: 500, price: 19.99, bestValue: true },
  { id: 'ultra', coins: 6000, bonus: 1500, price: 49.99 },
];

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'theme_neon',
    name: 'Neon Dreams',
    description: 'Cyberpunk neon theme with animated gradients',
    price: 250,
    category: 'theme',
    rarity: 'epic',
    icon: 'color-palette',
  },
  {
    id: 'theme_ocean',
    name: 'Ocean Depths',
    description: 'Calming ocean-inspired color palette',
    price: 150,
    category: 'theme',
    rarity: 'rare',
    icon: 'water',
  },
  {
    id: 'badge_verified',
    name: 'Verified Badge',
    description: 'Official verification checkmark',
    price: 500,
    category: 'badge',
    rarity: 'legendary',
    icon: 'checkmark-circle',
  },
  {
    id: 'badge_star',
    name: 'Rising Star',
    description: 'Shining star badge with glow effect',
    price: 300,
    category: 'badge',
    rarity: 'epic',
    icon: 'star',
  },
  {
    id: 'effect_sparkles',
    name: 'Sparkle Trail',
    description: 'Animated sparkles follow your cursor',
    price: 200,
    category: 'effect',
    rarity: 'rare',
    icon: 'sparkles',
  },
  {
    id: 'boost_xp',
    name: 'XP Boost (24h)',
    description: '2x XP for 24 hours',
    price: 150,
    category: 'boost',
    rarity: 'common',
    icon: 'trending-up',
  },
];

const RARITY_COLORS = {
  common: ['#6b7280', '#4b5563'],
  rare: ['#3b82f6', '#2563eb'],
  epic: ['#8b5cf6', '#7c3aed'],
  legendary: ['#f59e0b', '#d97706'],
};

const CoinShopScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'bundles' | 'themes' | 'badges' | 'effects' | 'boosts'>('bundles');
  const [userCoins, setUserCoins] = useState(user?.coins || 0);
  const [canClaimDaily, setCanClaimDaily] = useState(true); // TODO: Check last claim time

  const categories = useMemo(
    () => [
      { id: 'bundles', name: 'Coin Bundles', icon: 'cash' },
      { id: 'themes', name: 'Themes', icon: 'color-palette' },
      { id: 'badges', name: 'Badges', icon: 'shield' },
      { id: 'effects', name: 'Effects', icon: 'sparkles' },
      { id: 'boosts', name: 'Boosts', icon: 'flash' },
    ],
    []
  );

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'bundles') return [];
    return SHOP_ITEMS.filter(item => {
      if (selectedCategory === 'themes') return item.category === 'theme';
      if (selectedCategory === 'badges') return item.category === 'badge';
      if (selectedCategory === 'effects') return item.category === 'effect';
      if (selectedCategory === 'boosts') return item.category === 'boost';
      return false;
    });
  }, [selectedCategory]);

  const handleCategorySelect = useCallback((categoryId: typeof selectedCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
  }, []);

  const handlePurchaseBundle = useCallback((bundle: CoinBundle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const totalCoins = bundle.coins + bundle.bonus;
    Alert.alert(
      'Purchase Coins',
      `Get ${totalCoins} coins for $${bundle.price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: () => {
            // TODO: Integrate payment provider
            console.log('Purchase bundle:', bundle.id);
            Alert.alert(
              'Coming Soon!',
              'Payment integration is under development. Check back soon!'
            );
          },
        },
      ]
    );
  }, []);

  const handlePurchaseItem = useCallback((item: ShopItem) => {
    if (userCoins < item.price) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Insufficient Coins',
        `You need ${item.price - userCoins} more coins to purchase this item.`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Buy Coins',
            onPress: () => handleCategorySelect('bundles'),
          },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Purchase Item',
      `Buy "${item.name}" for ${item.price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            // TODO: Implement purchase logic
            setUserCoins(prev => prev - item.price);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success!', `You've purchased ${item.name}!`);
          },
        },
      ]
    );
  }, [userCoins, handleCategorySelect]);

  const handleClaimDaily = useCallback(() => {
    if (!canClaimDaily) {
      Alert.alert('Already Claimed', 'Come back tomorrow for your next daily bonus!');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUserCoins(prev => prev + 50);
    setCanClaimDaily(false);

    Alert.alert(
      '🎁 Daily Bonus!',
      'You\'ve received 50 free coins! Come back tomorrow for more.',
      [{ text: 'Awesome!', style: 'default' }]
    );
  }, [canClaimDaily]);

  const renderBundles = () => (
    <View style={styles.bundlesGrid}>
      {COIN_BUNDLES.map((bundle) => {
        const totalCoins = bundle.coins + bundle.bonus;
        const pricePerCoin = (bundle.price / totalCoins).toFixed(3);

        return (
          <TouchableOpacity
            key={bundle.id}
            style={styles.bundleCard}
            onPress={() => handlePurchaseBundle(bundle)}
            activeOpacity={0.9}
          >
            <GlassCard
              variant={bundle.bestValue ? 'holographic' : bundle.popular ? 'neon' : 'crystal'}
              intensity="medium"
              style={styles.bundleCardInner}
              borderGradient={bundle.popular || bundle.bestValue}
            >
              {(bundle.popular || bundle.bestValue) && (
                <View style={styles.bundleBadge}>
                  <LinearGradient
                    colors={bundle.bestValue ? ['#f59e0b', '#d97706'] : ['#8b5cf6', '#7c3aed']}
                    style={styles.bundleBadgeGradient}
                  >
                    <Text style={styles.bundleBadgeText}>
                      {bundle.bestValue ? '🏆 BEST VALUE' : '⭐ POPULAR'}
                    </Text>
                  </LinearGradient>
                </View>
              )}

              <View style={styles.bundleIcon}>
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.bundleIconGradient}
                >
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
                <Text style={styles.bundlePrice}>${bundle.price.toFixed(2)}</Text>
                <Text style={styles.bundlePricePerCoin}>${pricePerCoin}/coin</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderItems = () => (
    <View style={styles.itemsGrid}>
      {filteredItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.itemCard}
          onPress={() => handlePurchaseItem(item)}
          activeOpacity={0.9}
        >
          <GlassCard
            variant="crystal"
            intensity="medium"
            style={styles.itemCardInner}
          >
            <LinearGradient
              colors={RARITY_COLORS[item.rarity]}
              style={styles.itemIcon}
            >
              <Ionicons name={item.icon as any} size={28} color="#fff" />
            </LinearGradient>

            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.itemFooter}>
                <View style={styles.itemRarityBadge}>
                  <LinearGradient
                    colors={RARITY_COLORS[item.rarity]}
                    style={styles.itemRarityGradient}
                  >
                    <Text style={styles.itemRarityText}>{item.rarity.toUpperCase()}</Text>
                  </LinearGradient>
                </View>

                <View style={styles.itemPriceContainer}>
                  <Ionicons name="diamond" size={14} color="#f59e0b" />
                  <Text style={styles.itemPrice}>{item.price}</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        {/* Coin Balance */}
        <GlassCard variant="neon" intensity="medium" style={styles.coinBalance}>
          <Ionicons name="diamond" size={20} color="#f59e0b" />
          <Text style={styles.coinBalanceText}>{userCoins.toLocaleString()}</Text>
        </GlassCard>

        {/* Daily Bonus */}
        <TouchableOpacity
          style={[styles.dailyButton, !canClaimDaily && styles.dailyButtonDisabled]}
          onPress={handleClaimDaily}
          disabled={!canClaimDaily}
          activeOpacity={0.8}
        >
          <Ionicons name="gift" size={20} color={canClaimDaily ? '#10b981' : '#6b7280'} />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabs}
        style={styles.categoryTabsContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.categoryTabActive,
            ]}
            onPress={() => handleCategorySelect(category.id as typeof selectedCategory)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={category.icon as any}
              size={20}
              color={selectedCategory === category.id ? '#fff' : 'rgba(255,255,255,0.6)'}
            />
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === category.id && styles.categoryTabTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {selectedCategory === 'bundles' ? renderBundles() : renderItems()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinBalance: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 12,
  },
  coinBalanceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  dailyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyButtonDisabled: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },

  // Category Tabs
  categoryTabsContainer: {
    maxHeight: 60,
    marginBottom: 12,
  },
  categoryTabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
  },
  categoryTabActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  categoryTabTextActive: {
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // Bundles
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

  // Items
  itemsGrid: {
    gap: 12,
  },
  itemCard: {
    width: '100%',
  },
  itemCardInner: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemRarityBadge: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemRarityGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  itemRarityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  itemPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default CoinShopScreen;
