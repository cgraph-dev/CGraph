/**
 * usePaymentModal hook - manages payment modal state and logic
 * @module modules/premium/components/payment-modal
 */

import { useState, useCallback } from 'react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { usePremiumStore } from '@/modules/premium/store';
import confetti from 'canvas-confetti';
import type { PaymentItem, PaymentStep, PaymentMethod, CardFormData } from './types';
import { PROMO_CODES, SUBSCRIPTION_TIER_MAP } from './constants';
import { generateTransactionId, calculateFinalPrice } from './utils';

const initialCardData: CardFormData = {
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  cardName: '',
  saveCard: true,
};

/**
 * unknown for the premium module.
 */
/**
 * Hook for managing payment modal.
 *
 * @param item - The item.
 * @param onSuccess - The on success.
 */
export function usePaymentModal(
  item: PaymentItem,
  onSuccess?: (transactionId: string) => void,
  onError?: (error: string) => void
) {
  const { addCoins, setSubscription, addPurchase } = usePremiumStore();

  const [step, setStep] = useState<PaymentStep>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [cardData, setCardData] = useState<CardFormData>(initialCardData);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const currency = item.currency || 'USD';
  const finalPrice = calculateFinalPrice(item.price, promoDiscount, promoApplied);

  const updateCardData = useCallback((updates: Partial<CardFormData>) => {
    setCardData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleApplyPromo = useCallback(() => {
    HapticFeedback.light();
    const discount = PROMO_CODES[promoCode.toLowerCase()];
    if (discount) {
      setPromoDiscount(discount);
      setPromoApplied(true);
    } else {
      setPromoApplied(false);
      setPromoDiscount(0);
    }
  }, [promoCode]);

  const handleSubmitPayment = useCallback(async () => {
    HapticFeedback.medium();
    setStep('processing');

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate success (90% success rate for demo)
    if (Math.random() > 0.1) {
      const txId = generateTransactionId();
      setTransactionId(txId);

      // Update store based on purchase type
      if (item.type === 'subscription') {
        const expiresAt = new Date();
        expiresAt.setFullYear(
          expiresAt.getFullYear() + (item.billingInterval === 'yearly' ? 1 : 0)
        );
        expiresAt.setMonth(expiresAt.getMonth() + (item.billingInterval === 'monthly' ? 1 : 0));
        const tier = SUBSCRIPTION_TIER_MAP[item.id] || 'premium';
        setSubscription(tier, expiresAt.toISOString());
      } else if (item.type === 'coins') {
        addCoins(item.quantity || 0);
      }

      // Add to purchase history
      addPurchase({
        id: txId,
        type: item.type,
        productId: item.id,
        productName: item.name,
        amount: finalPrice,
        currency,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });

      setStep('success');
      HapticFeedback.success();

      // Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      onSuccess?.(txId);
    } else {
      setErrorMessage('Payment failed. Please try again.');
      setStep('error');
      HapticFeedback.error();
      onError?.('Payment failed');
    }
  }, [item, finalPrice, currency, addCoins, setSubscription, addPurchase, onSuccess, onError]);

  const resetState = useCallback(() => {
    setStep('details');
    setPromoCode('');
    setPromoApplied(false);
    setPromoDiscount(0);
    setCardData(initialCardData);
    setErrorMessage('');
    setTransactionId('');
  }, []);

  const isCardFormValid = !!(
    cardData.cardNumber &&
    cardData.cardExpiry &&
    cardData.cardCvc &&
    cardData.cardName
  );

  return {
    // State
    step,
    paymentMethod,
    promoCode,
    promoApplied,
    promoDiscount,
    cardData,
    errorMessage,
    transactionId,
    finalPrice,
    currency,
    isCardFormValid,

    // Actions
    setStep,
    setPaymentMethod,
    setPromoCode,
    updateCardData,
    handleApplyPromo,
    handleSubmitPayment,
    resetState,
  };
}
