/**
 * Premium subscription screen - Orchestrator.
 * Delegates to sub-components in ./premium/
 * @module screens/premium/premium-screen
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import GlassCard from '../../components/ui/glass-card';
import { useAuthStore, useThemeStore } from '@/stores';
import paymentService, { PRODUCT_IDS, SubscriptionStatus } from '../../lib/payment';
import { iapService, type IAPProduct } from '../../features/premium/services/iap-service';
import { PremiumTier, BillingCycle, PREMIUM_TIERS } from './premium/premium-types';
import { BillingToggle } from './premium/billing-toggle';
import { TierCard } from './premium/tier-card';
import { PremiumFooter } from './premium/premium-footer';

/**
 *
 */
function PremiumScreen(): React.ReactElement | null {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { user: _user } = useAuthStore();
  const { colors } = useThemeStore();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [selectedTier, setSelectedTier] = useState<PremiumTier['id']>('premium');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [_isLoading, setIsLoading] = useState(true);
  const [_isPurchasing, setIsPurchasing] = useState(false);
  const [iapProducts, setIapProducts] = useState<IAPProduct[]>([]);

  useEffect(() => {
    const initializePayments = async () => {
      try {
        await paymentService.initialize();
        const status = await paymentService.getSubscriptionStatus();
        setSubscriptionStatus(status);

        // Initialize native IAP and load real store prices
        try {
          await iapService.initialize();
          const products = await iapService.loadProducts();
          setIapProducts(products);
        } catch (iapErr) {
          console.warn('[PremiumScreen] IAP init failed (expected in simulator):', iapErr);
        }
      } catch (error) {
        console.error('[PremiumScreen] Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializePayments();

    return () => {
      iapService.destroy();
    };
  }, []);

  const currentTier = subscriptionStatus?.tier || 'free';

  const handleBillingToggle = useCallback((cycle: BillingCycle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBillingCycle(cycle);
  }, []);

  const handleSelectTier = useCallback((tierId: PremiumTier['id']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTier(tierId);
  }, []);

  const handleSubscribe = useCallback(
    async (tier: PremiumTier) => {
      if (tier.id === 'free') {
        Alert.alert('Already Free', 'You are currently on the free plan.');
        return;
      }
      if (currentTier === tier.id) {
        Alert.alert('Already Subscribed', `You're already on the ${tier.name} plan.`);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const price = tier.price[billingCycle];
      const priceText =
        billingCycle === 'yearly' ? `$${price}/year (Save 20%!)` : `$${price}/month`;

      Alert.alert(`Subscribe to ${tier.name}`, `You'll be charged ${priceText}. Continue?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            setIsPurchasing(true);
            try {
              // Use native IAP for subscription purchases on mobile
              const iapSku =
                tier.id === 'premium'
                  ? billingCycle === 'yearly' ? 'com.cgraph.premium.yearly' : 'com.cgraph.premium.monthly'
                  : billingCycle === 'yearly' ? 'com.cgraph.enterprise.yearly' : 'com.cgraph.enterprise.monthly';

              const hasIAP = iapProducts.length > 0;
              if (hasIAP) {
                await iapService.purchaseSubscription(iapSku, {
                  onSuccess: async () => {
                    const status = await paymentService.getSubscriptionStatus();
                    setSubscriptionStatus(status);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Success!', `Welcome to ${tier.name}! Your subscription is now active.`);
                  },
                });
              } else {
                // Fallback to REST-based purchase (simulator / web)
                const productId =
                  tier.id === 'premium'
                    ? billingCycle === 'yearly' ? PRODUCT_IDS.PREMIUM_YEARLY : PRODUCT_IDS.PREMIUM_MONTHLY
                    : billingCycle === 'yearly' ? PRODUCT_IDS.PREMIUM_PLUS_YEARLY : PRODUCT_IDS.PREMIUM_PLUS_MONTHLY;
                const purchase = await paymentService.purchaseProduct(productId);
                if (purchase) {
                  const status = await paymentService.getSubscriptionStatus();
                  setSubscriptionStatus(status);
                  if (purchase.purchaseState === 'purchased') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Success!', `Welcome to ${tier.name}! Your subscription is now active.`);
                  } else if (purchase.purchaseState === 'pending') {
                    Alert.alert('Processing', 'Your purchase is being processed. It may take a few moments.');
                  }
                }
              }
            } catch (error: unknown) {
              const err = error as Error;
              console.error('[PremiumScreen] Purchase error:', err);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Purchase Failed', err?.message || 'Unable to complete purchase.');
            } finally {
              setIsPurchasing(false);
            }
          },
        },
      ]);
    },
    [billingCycle, currentTier]
  );

  const handleRestorePurchases = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Restore Purchases', "We'll restore any previous purchases linked to your account.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: async () => {
          setIsPurchasing(true);
          try {
            const restoredPurchases = await paymentService.restorePurchases();
            if (restoredPurchases.length > 0) {
              const status = await paymentService.getSubscriptionStatus();
              setSubscriptionStatus(status);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `Restored ${restoredPurchases.length} purchase(s)!`);
            } else {
              Alert.alert('No Purchases', 'No previous purchases found to restore.');
            }
          } catch (error: unknown) {
            const err = error as Error;
            console.error('[PremiumScreen] Restore error:', err);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Restore Failed', err?.message || 'Unable to restore purchases.');
          } finally {
            setIsPurchasing(false);
          }
        },
      },
    ]);
  }, []);

  const handleManageSubscription = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') Linking.openURL('https://apps.apple.com/account/subscriptions');
    else Linking.openURL('https://play.google.com/store/account/subscriptions');
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.premiumIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="diamond" size={24} color="#fff" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: colors.text }]}>CGraph Premium</Text>
        </View>
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases} activeOpacity={0.7}>
          <Text style={styles.restoreButtonText}>Restore</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <GlassCard variant="holographic" intensity="strong" style={styles.heroCard}>
        <Text style={styles.heroTitle}>Upgrade Your Experience</Text>
        <Text style={styles.heroSubtitle}>Get access to premium features, exclusive themes, and priority support</Text>
      </GlassCard>

      {/* Billing Toggle */}
      <BillingToggle billingCycle={billingCycle} onToggle={handleBillingToggle} />

      {/* Pricing Tiers */}
      <View style={styles.tiersContainer}>
        {PREMIUM_TIERS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            billingCycle={billingCycle}
            isCurrentTier={currentTier === tier.id}
            isSelected={selectedTier === tier.id}
            onSelect={handleSelectTier}
            onSubscribe={handleSubscribe}
          />
        ))}
      </View>

      {/* Footer */}
      <PremiumFooter
        currentTier={currentTier}
        onManageSubscription={handleManageSubscription}
        colors={colors as unknown as Record<string, string>}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  premiumIconGradient: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  restoreButton: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  restoreButtonText: { fontSize: 12, fontWeight: '600', color: '#8b5cf6' },
  heroCard: { padding: 24, marginBottom: 20, alignItems: 'center' },
  heroTitle: {
    fontSize: 24, fontWeight: '800', color: '#fff',
    textAlign: 'center', marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14, color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center', lineHeight: 20,
  },
  tiersContainer: { gap: 16, marginBottom: 24 },
});

export default PremiumScreen;
