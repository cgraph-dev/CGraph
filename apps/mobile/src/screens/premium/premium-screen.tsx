/**
 * Premium subscription screen with plan details and purchase options.
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

/**
 * Premium Subscription Screen (Mobile)
 *
 * Mobile-optimized premium subscription screen with:
 * - 3-tier subscription system (Free, Premium, Premium+)
 * - Monthly/yearly billing toggle with 20% discount
 * - Feature comparison matrix
 * - Touch-optimized purchase flow
 * - Haptic feedback on interactions
 * - Glassmorphism design
 * - Native payment integration ready (Stripe/IAP)
 */

interface PremiumTier {
  id: 'free' | 'premium';
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  popular?: boolean;
  gradient: readonly [string, string, ...string[]];
  features: {
    text: string;
    included: boolean;
  }[];
}

const PREMIUM_TIERS: PremiumTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: {
      monthly: 0,
      yearly: 0,
    },
    gradient: ['#6b7280', '#4b5563'],
    features: [
      { text: '50 Direct messages/day', included: true },
      { text: '5 Group memberships', included: true },
      { text: 'Basic encryption', included: true },
      { text: '5 MB file uploads', included: true },
      { text: 'Standard avatar frames', included: true },
      { text: 'Premium features', included: false },
      { text: 'Custom themes', included: false },
      { text: 'Priority support', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: {
      monthly: 9.99,
      yearly: 95.9, // 20% discount
    },
    popular: true,
    gradient: ['#8b5cf6', '#7c3aed'],
    features: [
      { text: 'Unlimited messages', included: true },
      { text: 'Unlimited groups', included: true },
      { text: 'Enhanced E2EE', included: true },
      { text: '100 MB file uploads', included: true },
      { text: '30+ premium avatar frames', included: true },
      { text: '10+ animated effects', included: true },
      { text: '50 custom themes', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Full API access', included: true },
    ],
  },
];

type BillingCycle = 'monthly' | 'yearly';

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

  // Fetch subscription status on mount
  useEffect(() => {
    const initializePayments = async () => {
      try {
        await paymentService.initialize();
        const status = await paymentService.getSubscriptionStatus();
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('[PremiumScreen] Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializePayments();
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
              // Get the correct product ID based on tier and billing cycle
              const productId =
                tier.id === 'premium'
                  ? billingCycle === 'yearly'
                    ? PRODUCT_IDS.PREMIUM_YEARLY
                    : PRODUCT_IDS.PREMIUM_MONTHLY
                  : billingCycle === 'yearly'
                    ? PRODUCT_IDS.PREMIUM_PLUS_YEARLY
                    : PRODUCT_IDS.PREMIUM_PLUS_MONTHLY;

              const purchase = await paymentService.purchaseProduct(productId);

              if (purchase) {
                // Refresh subscription status
                const status = await paymentService.getSubscriptionStatus();
                setSubscriptionStatus(status);

                if (purchase.purchaseState === 'purchased') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert(
                    'Success!',
                    `Welcome to ${tier.name}! Your subscription is now active.`
                  );
                } else if (purchase.purchaseState === 'pending') {
                  Alert.alert(
                    'Processing',
                    'Your purchase is being processed. It may take a few moments.'
                  );
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
    Alert.alert(
      'Restore Purchases',
      "We'll restore any previous purchases linked to your account.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setIsPurchasing(true);
            try {
              const restoredPurchases = await paymentService.restorePurchases();

              if (restoredPurchases.length > 0) {
                // Refresh subscription status
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
      ]
    );
  }, []);

  const handleManageSubscription = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }, []);

  const renderDiscountBadge = useCallback(() => {
    if (billingCycle !== 'yearly') return null;

    return (
      <View style={styles.discountBadge}>
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.discountBadgeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.discountBadgeText}>SAVE 20%</Text>
        </LinearGradient>
      </View>
    );
  }, [billingCycle]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            style={styles.premiumIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="diamond" size={24} color="#fff" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: colors.text }]}>CGraph Premium</Text>
        </View>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          activeOpacity={0.7}
        >
          <Text style={styles.restoreButtonText}>Restore</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <GlassCard variant="holographic" intensity="strong" style={styles.heroCard}>
        <Text style={styles.heroTitle}>Upgrade Your Experience</Text>
        <Text style={styles.heroSubtitle}>
          Get access to premium features, exclusive themes, and priority support
        </Text>
      </GlassCard>

      {/* Billing Toggle */}
      <View style={styles.billingToggleContainer}>
        <TouchableOpacity
          style={[styles.billingOption, billingCycle === 'monthly' && styles.billingOptionActive]}
          onPress={() => handleBillingToggle('monthly')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.billingOptionText,
              billingCycle === 'monthly' && styles.billingOptionTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.billingOption, billingCycle === 'yearly' && styles.billingOptionActive]}
          onPress={() => handleBillingToggle('yearly')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.billingOptionText,
              billingCycle === 'yearly' && styles.billingOptionTextActive,
            ]}
          >
            Yearly
          </Text>
          {renderDiscountBadge()}
        </TouchableOpacity>
      </View>

      {/* Pricing Tiers */}
      <View style={styles.tiersContainer}>
        {PREMIUM_TIERS.map((tier) => {
          const isCurrentTier = currentTier === tier.id;
          const isSelected = selectedTier === tier.id;
          const price = tier.price[billingCycle];
          const pricePerMonth = billingCycle === 'yearly' ? price / 12 : price;

          return (
            <TouchableOpacity
              key={tier.id}
              style={styles.tierCard}
              onPress={() => handleSelectTier(tier.id)}
              activeOpacity={0.9}
            >
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
                    <Ionicons
                      name={tier.id === 'free' ? 'people' : 'diamond'}
                      size={28}
                      color="#fff"
                    />
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
                        <Text style={styles.tierPricePerMonth}>
                          Just ${pricePerMonth.toFixed(2)}/month
                        </Text>
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
                      <Text
                        style={[
                          styles.featureText,
                          !feature.included && styles.featureTextDisabled,
                        ]}
                      >
                        {feature.text}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Subscribe Button */}
                {tier.id !== 'free' && (
                  <TouchableOpacity
                    style={styles.subscribeButton}
                    onPress={() => handleSubscribe(tier)}
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
        })}
      </View>

      {/* Manage Subscription */}
      {currentTier !== 'free' && (
        <TouchableOpacity
          style={styles.manageButton}
          onPress={handleManageSubscription}
          activeOpacity={0.8}
        >
          <GlassCard variant="frosted" intensity="subtle" style={styles.manageCard}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
            <Text style={[styles.manageText, { color: colors.text }]}>Manage Subscription</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </GlassCard>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Subscriptions automatically renew unless canceled at least 24 hours before the end of the
          current period.
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL('https://cgraph.org/terms');
          }}
        >
          <Text style={styles.footerLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  premiumIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  restoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  restoreButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },

  // Hero
  heroCard: {
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Billing Toggle
  billingToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    position: 'relative',
  },
  billingOptionActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  billingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  billingOptionTextActive: {
    color: '#fff',
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
  },
  discountBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // Pricing Tiers
  tiersContainer: {
    gap: 16,
    marginBottom: 24,
  },
  tierCard: {
    width: '100%',
  },
  tierCardInner: {
    padding: 20,
  },
  tierCardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  tierCardPopular: {
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  popularBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
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
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  currentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  tierPricing: {
    marginBottom: 20,
  },
  tierPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  tierPriceCycle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  tierPricePerMonth: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  tierFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
  },
  featureTextDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
    textDecorationLine: 'line-through',
  },
  subscribeButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  subscribeButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Manage Subscription
  manageButton: {
    marginBottom: 24,
  },
  manageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  manageText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
    textDecorationLine: 'underline',
  },
});

export default PremiumScreen;
