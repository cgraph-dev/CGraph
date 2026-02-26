/**
 * Hook managing coin shop state, purchases, and animations.
 * @module screens/premium/coin-shop-screen/hooks/useCoinShop
 */
import { durations } from '@cgraph/animation-constants';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useSharedValue, withTiming, withDelay, withSpring, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import api from '../../../../lib/api';
import paymentService, { PRODUCT_IDS } from '../../../../lib/payment';
import { SHOP_ITEMS, COIN_BUNDLES, CoinBundle, ShopItem } from '../components';
import { CategoryId } from '../types';

/**
 *
 */
export function useCoinShop() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('bundles');
  const [userCoins, setUserCoins] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Entry animations
  const headerAnim = useSharedValue(0);
  const balanceScaleAnim = useSharedValue(0);

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

  useEffect(() => {
    headerAnim.value = withTiming(1, { duration: durations.slower.ms });
    balanceScaleAnim.value = withDelay(durations.normal.ms, withSpring(1, { damping: 6 }));
  }, []);

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

  const handleCategorySelect = useCallback((categoryId: CategoryId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
  }, []);

  const handlePurchaseBundle = useCallback(
    async (bundle: CoinBundle) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const totalCoins = bundle.coins + bundle.bonus;
      Alert.alert('Purchase Coins', `Get ${totalCoins} coins for ${bundle.price}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            setIsPurchasing(true);
            try {
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
            } catch (err) {
               
              const error = err as Error & {
                response?: { status: number; data?: { message?: string } };
              };
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
            { text: 'Buy Coins', onPress: () => handleCategorySelect('bundles') },
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
              await api.post(`/api/v1/shop/${item.id}/purchase`);
              setUserCoins((prev) => prev - item.price);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success!', `You've purchased ${item.name}!`);
            } catch (err) {
               
              const error = err as Error & {
                response?: { status: number; data?: { message?: string } };
              };
              console.error('[CoinShop] Item purchase error:', error);
              if (error.response?.status === 404 || !error.response) {
                setUserCoins((prev) => prev - item.price);
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
      const response = await api.post('/api/v1/coins/daily-claim');
      const coinsAwarded = response.data.coins || 50;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUserCoins((prev) => prev + coinsAwarded);
      setCanClaimDaily(false);

      Alert.alert(
        '🎁 Daily Bonus!',
        `You've received ${coinsAwarded} free coins! Come back tomorrow for more.`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    } catch (err) {
       
      const error = err as Error & { response?: { status: number; data?: { message?: string } } };
      console.error('[CoinShop] Daily claim error:', error);

      if (error.response?.status === 404 || !error.response) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUserCoins((prev) => prev + 50);
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

  return {
    selectedCategory,
    userCoins,
    canClaimDaily,
    isLoading,
    isPurchasing,
    headerAnim,
    balanceScaleAnim,
    filteredItems,
    handleCategorySelect,
    handlePurchaseBundle,
    handlePurchaseItem,
    handleClaimDaily,
  };
}
