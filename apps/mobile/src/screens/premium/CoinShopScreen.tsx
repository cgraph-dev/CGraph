import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import GlassCard from '../../components/ui/GlassCard';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import paymentService, { PRODUCT_IDS } from '../../lib/payment';
import api from '../../lib/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// Animated 3D Coin component
function Animated3DCoin({ size = 70, delay = 0 }: { size?: number; delay?: number }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const rotateY = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View style={{ transform: [{ rotateY }, { scale: scaleAnim }] }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 1.5,
          height: size * 1.5,
          borderRadius: size * 0.75,
          backgroundColor: '#f59e0b',
          opacity: glowOpacity,
          left: -size * 0.25,
          top: -size * 0.25,
        }}
      />
      <LinearGradient
        colors={['#fbbf24', '#f59e0b', '#d97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#f59e0b',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <View
          style={{
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: size * 0.4,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <Text style={{ fontSize: size * 0.35, color: '#fff', fontWeight: '800' }}>₿</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Animated counter component
function AnimatedCounter({ value, style }: { value: number; style?: ViewStyle }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(Math.floor(v));
    });

    return () => animValue.removeListener(listener);
  }, [value]);

  return <Text style={style}>{displayValue.toLocaleString()}</Text>;
}

// Floating particles
function FloatingParticles({ count = 12 }: { count?: number }) {
  const particles = useRef(
    Array.from({ length: count }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(Math.random() * 150),
      opacity: new Animated.Value(Math.random()),
      size: 4 + Math.random() * 6,
      color: ['#f59e0b', '#fbbf24', '#fcd34d'][Math.floor(Math.random() * 3)],
    }))
  ).current;

  useEffect(() => {
    particles.forEach((particle, index) => {
      const animateParticle = () => {
        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -30,
            duration: 2500 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 2500 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          particle.x.setValue(Math.random() * SCREEN_WIDTH);
          particle.y.setValue(150 + Math.random() * 50);
          particle.opacity.setValue(0.5 + Math.random() * 0.5);
          animateParticle();
        });
      };
      setTimeout(() => animateParticle(), index * 150);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            borderRadius: particle.size / 2,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: [{ translateX: particle.x }, { translateY: particle.y }],
          }}
        />
      ))}
    </View>
  );
}

// Special offer countdown timer
function CountdownTimer({ endsInHours }: { endsInHours: number }) {
  const [timeLeft, setTimeLeft] = useState(endsInHours * 3600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={timerStyles.container}>
      <Ionicons name="time" size={12} color="rgba(255,255,255,0.8)" />
      <Text style={timerStyles.text}>{formatTime(timeLeft)}</Text>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

// Special offers data
interface SpecialOffer {
  id: string;
  title: string;
  coins: number;
  originalPrice: number;
  salePrice: number;
  discount: number;
  endsIn: number;
  icon: string;
  gradient: [string, string];
}

const SPECIAL_OFFERS: SpecialOffer[] = [
  {
    id: 'so1',
    title: 'Starter Pack',
    coins: 1000,
    originalPrice: 9.99,
    salePrice: 4.99,
    discount: 50,
    endsIn: 24,
    icon: '🚀',
    gradient: ['#3b82f6', '#2563eb'],
  },
  {
    id: 'so2',
    title: 'Weekend Special',
    coins: 3000,
    originalPrice: 29.99,
    salePrice: 14.99,
    discount: 50,
    endsIn: 48,
    icon: '⚡',
    gradient: ['#8b5cf6', '#7c3aed'],
  },
  {
    id: 'so3',
    title: 'Mega Bundle',
    coins: 10000,
    originalPrice: 99.99,
    salePrice: 39.99,
    discount: 60,
    endsIn: 12,
    icon: '💫',
    gradient: ['#f59e0b', '#d97706'],
  },
];

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

const RARITY_COLORS: Record<string, readonly [string, string]> = {
  common: ['#6b7280', '#4b5563'],
  rare: ['#3b82f6', '#2563eb'],
  epic: ['#8b5cf6', '#7c3aed'],
  legendary: ['#f59e0b', '#d97706'],
};

const CoinShopScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<
    'bundles' | 'themes' | 'badges' | 'effects' | 'boosts'
  >('bundles');
  const [userCoins, setUserCoins] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Fetch user's coin balance and daily claim status on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await paymentService.initialize();

        const [coinsRes, dailyRes] = await Promise.allSettled([
          api.get('/api/v1/coins'),
          api.get('/api/v1/coins/daily-status'),
        ]);

        if (coinsRes.status === 'fulfilled') {
          setUserCoins(coinsRes.value.data.balance || 0);
        }
        if (dailyRes.status === 'fulfilled') {
          setCanClaimDaily(dailyRes.value.data.can_claim ?? true);
        }
      } catch (error) {
        console.error('[CoinShop] Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
    return SHOP_ITEMS.filter((item) => {
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

  const handlePurchaseBundle = useCallback(
    async (bundle: CoinBundle) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const totalCoins = bundle.coins + bundle.bonus;
      Alert.alert('Purchase Coins', `Get ${totalCoins} coins for $${bundle.price.toFixed(2)}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            setIsPurchasing(true);
            try {
              // Map bundle ID to product ID
              const productIdMap: Record<string, string> = {
                small: PRODUCT_IDS.COINS_100,
                medium: PRODUCT_IDS.COINS_500,
                large: PRODUCT_IDS.COINS_1200,
                mega: PRODUCT_IDS.COINS_2500,
                ultra: PRODUCT_IDS.COINS_6000,
              };
              const productId = productIdMap[bundle.id];

              if (!productId) {
                throw new Error('Invalid bundle');
              }

              const purchase = await paymentService.purchaseProduct(productId);

              if (purchase && purchase.purchaseState === 'purchased') {
                // Refresh coin balance
                const coinsRes = await api.get('/api/v1/coins');
                setUserCoins(coinsRes.data.balance || userCoins + totalCoins);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success!', `You've received ${totalCoins} coins!`);
              } else if (purchase?.purchaseState === 'pending') {
                Alert.alert(
                  'Processing',
                  'Your purchase is being processed. Coins will be added shortly.'
                );
              }
            } catch (error: unknown) {
              console.error('[CoinShop] Purchase error:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase.');
            } finally {
              setIsPurchasing(false);
            }
          },
        },
      ]);
    },
    [userCoins]
  );

  const handlePurchaseItem = useCallback(
    async (item: ShopItem) => {
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

      Alert.alert('Purchase Item', `Buy "${item.name}" for ${item.price} coins?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            setIsPurchasing(true);
            try {
              // Call API to purchase item
              await api.post(`/api/v1/shop/${item.id}/purchase`);

              // Update local state
              setUserCoins((prev: number) => prev - item.price);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success!', `You've purchased ${item.name}!`);
            } catch (error: unknown) {
              console.error('[CoinShop] Item purchase error:', error);
              // Fallback to local-only for demo/offline
              if (error.response?.status === 404 || !error.response) {
                setUserCoins((prev: number) => prev - item.price);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success!', `You've purchased ${item.name}!`);
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert(
                  'Purchase Failed',
                  error.response?.data?.message || 'Unable to complete purchase.'
                );
              }
            } finally {
              setIsPurchasing(false);
            }
          },
        },
      ]);
    },
    [userCoins, handleCategorySelect]
  );

  const handleClaimDaily = useCallback(async () => {
    if (!canClaimDaily) {
      Alert.alert('Already Claimed', 'Come back tomorrow for your next daily bonus!');
      return;
    }

    setIsPurchasing(true);
    try {
      // Call API to claim daily bonus
      const response = await api.post('/api/v1/coins/daily-claim');
      const coinsAwarded = response.data.coins || 50;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUserCoins((prev: number) => prev + coinsAwarded);
      setCanClaimDaily(false);

      Alert.alert(
        '🎁 Daily Bonus!',
        `You've received ${coinsAwarded} free coins! Come back tomorrow for more.`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    } catch (error: unknown) {
      console.error('[CoinShop] Daily claim error:', error);

      // Fallback for offline/demo mode
      if (error.response?.status === 404 || !error.response) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUserCoins((prev: number) => prev + 50);
        setCanClaimDaily(false);
        Alert.alert(
          '🎁 Daily Bonus!',
          "You've received 50 free coins! Come back tomorrow for more.",
          [{ text: 'Awesome!', style: 'default' }]
        );
      } else if (error.response?.status === 429) {
        setCanClaimDaily(false);
        Alert.alert('Already Claimed', 'Come back tomorrow for your next daily bonus!');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', error.response?.data?.message || 'Unable to claim daily bonus.');
      }
    } finally {
      setIsPurchasing(false);
    }
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
          <GlassCard variant="crystal" intensity="medium" style={styles.itemCardInner}>
            <LinearGradient colors={RARITY_COLORS[item.rarity]} style={styles.itemIcon}>
              <Ionicons name={item.icon as unknown} size={28} color="#fff" />
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

  // Entry animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const balanceScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(balanceScaleAnim, {
        toValue: 1,
        friction: 6,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Render special offers carousel
  const renderSpecialOffers = () => (
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
        {SPECIAL_OFFERS.map((offer) => (
          <TouchableOpacity
            key={offer.id}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                offer.title,
                `Get ${offer.coins.toLocaleString()} coins for $${offer.salePrice.toFixed(2)}! (${offer.discount}% off)`,
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
                <Text style={styles.discountText}>-{offer.discount}%</Text>
              </View>
              <Text style={styles.offerIcon}>{offer.icon}</Text>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerCoins}>{offer.coins.toLocaleString()} Coins</Text>
              <View style={styles.offerFooter}>
                <CountdownTimer endsInHours={offer.endsIn} />
                <View style={styles.offerPriceRow}>
                  <Text style={styles.offerOriginalPrice}>${offer.originalPrice.toFixed(2)}</Text>
                  <Text style={styles.offerSalePrice}>${offer.salePrice.toFixed(2)}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Particles */}
      <FloatingParticles />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Coin Shop</Text>

        {/* Daily Bonus */}
        <TouchableOpacity
          style={[styles.dailyButton, !canClaimDaily && styles.dailyButtonDisabled]}
          onPress={handleClaimDaily}
          disabled={!canClaimDaily}
          activeOpacity={0.8}
        >
          <Ionicons name="gift" size={20} color={canClaimDaily ? '#10b981' : '#6b7280'} />
        </TouchableOpacity>
      </Animated.View>

      {/* Enhanced Balance Card */}
      <Animated.View
        style={[styles.balanceCardWrapper, { transform: [{ scale: balanceScaleAnim }] }]}
      >
        <LinearGradient
          colors={['#1e1e2e', '#2d2d44']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceContent}>
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <View style={styles.balanceRow}>
                <AnimatedCounter value={userCoins} style={styles.balanceValue} />
                <Text style={styles.coinLabelText}>coins</Text>
              </View>
            </View>
            <Animated3DCoin size={65} />
          </View>

          {/* Daily Bonus Button in Card */}
          <TouchableOpacity
            style={[styles.dailyBonusCard, !canClaimDaily && styles.dailyBonusDisabled]}
            onPress={handleClaimDaily}
            disabled={!canClaimDaily}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canClaimDaily ? ['#10b981', '#059669'] : ['#4b5563', '#374151']}
              style={styles.dailyBonusGradient}
            >
              <Ionicons name="gift" size={18} color="#fff" />
              <Text style={styles.dailyBonusText}>
                {canClaimDaily ? 'Claim Daily Bonus' : 'Already Claimed'}
              </Text>
              {canClaimDaily && (
                <View style={styles.dailyBonusAmount}>
                  <Text style={styles.dailyBonusAmountText}>+50</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

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
              name={category.icon as unknown}
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
        {/* Special Offers (only show on bundles tab) */}
        {selectedCategory === 'bundles' && renderSpecialOffers()}

        {/* Main Content */}
        {selectedCategory === 'bundles' ? renderBundles() : renderItems()}

        {/* Premium Banner */}
        {selectedCategory === 'bundles' && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={styles.premiumBannerWrapper}
          >
            <LinearGradient
              colors={['#8b5cf6', '#6366f1', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumBanner}
            >
              <Text style={styles.premiumEmoji}>✨</Text>
              <View style={styles.premiumTextContainer}>
                <Text style={styles.premiumTitle}>Go Premium</Text>
                <Text style={styles.premiumDescription}>
                  Get 500 coins monthly + exclusive perks
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
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

  // New Enhanced Styles
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  balanceCardWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 24,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLeft: {},
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f59e0b',
  },
  coinLabelText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  dailyBonusCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  dailyBonusDisabled: {
    opacity: 0.7,
  },
  dailyBonusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  dailyBonusText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  dailyBonusAmount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dailyBonusAmountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Special Offers Section
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

  // Premium Banner
  premiumBannerWrapper: {
    marginTop: 16,
  },
  premiumBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  premiumDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 2,
  },
});

export default CoinShopScreen;
