/**
 * PaymentModal Component
 *
 * Handles payment flow for subscriptions and coin purchases.
 * Features:
 * - Multiple payment methods
 * - Stripe integration ready
 * - Order summary
 * - Promo code input
 * - Success/error states
 * - Secure payment form
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CreditCardIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { usePremiumStore } from '@/features/premium/stores';
import confetti from 'canvas-confetti';

export interface PaymentItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  type: 'subscription' | 'coins' | 'item';
  billingInterval?: 'monthly' | 'yearly' | 'one-time';
  quantity?: number;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PaymentItem;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
}

type PaymentStep = 'details' | 'payment' | 'processing' | 'success' | 'error';
type PaymentMethod = 'card' | 'paypal' | 'apple' | 'google';

const PAYMENT_METHODS: { id: PaymentMethod; name: string; icon: string }[] = [
  { id: 'card', name: 'Credit Card', icon: '💳' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️' },
  { id: 'apple', name: 'Apple Pay', icon: '🍎' },
  { id: 'google', name: 'Google Pay', icon: '🔵' },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
  onError,
}) => {
  const { addCoins, setSubscription, addPurchase } = usePremiumStore();
  
  const [step, setStep] = useState<PaymentStep>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const currency = item.currency || 'USD';
  const finalPrice = promoApplied 
    ? item.price * (1 - promoDiscount)
    : item.price;
  const savings = item.originalPrice 
    ? item.originalPrice - item.price + (promoDiscount * item.price)
    : promoDiscount * item.price;

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleApplyPromo = useCallback(() => {
    HapticFeedback.light();
    // Demo promo codes
    if (promoCode.toLowerCase() === 'save20') {
      setPromoDiscount(0.2);
      setPromoApplied(true);
    } else if (promoCode.toLowerCase() === 'vip50') {
      setPromoDiscount(0.5);
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
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate success (90% success rate for demo)
    if (Math.random() > 0.1) {
      const txId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setTransactionId(txId);
      
      // Update store based on purchase type
      if (item.type === 'subscription') {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + (item.billingInterval === 'yearly' ? 1 : 0));
        expiresAt.setMonth(expiresAt.getMonth() + (item.billingInterval === 'monthly' ? 1 : 0));
        setSubscription(item.id as any, expiresAt.toISOString());
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

  const handleClose = () => {
    setStep('details');
    setPromoCode('');
    setPromoApplied(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardName('');
    setErrorMessage('');
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'details':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Order summary */}
            <div className="bg-dark-800/50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-white">Order Summary</h3>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-sm text-white/60">{item.description}</p>
                  {item.billingInterval && item.billingInterval !== 'one-time' && (
                    <p className="text-xs text-white/40 mt-1">
                      Billed {item.billingInterval}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {item.originalPrice && (
                    <p className="text-sm text-white/40 line-through">
                      ${item.originalPrice.toFixed(2)}
                    </p>
                  )}
                  <p className="font-bold text-white">${item.price.toFixed(2)}</p>
                </div>
              </div>
              
              {promoApplied && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex justify-between text-green-400"
                >
                  <span>Promo discount ({Math.round(promoDiscount * 100)}%)</span>
                  <span>-${(item.price * promoDiscount).toFixed(2)}</span>
                </motion.div>
              )}
              
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="font-semibold text-white">Total</span>
                <span className="font-bold text-xl text-white">${finalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Promo code */}
            <div className="space-y-2">
              <label className="text-sm text-white/60">Promo Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 bg-dark-800/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  onClick={handleApplyPromo}
                  disabled={!promoCode}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50"
                >
                  Apply
                </Button>
              </div>
              {promoApplied && (
                <p className="text-sm text-green-400">✓ Promo code applied!</p>
              )}
            </div>

            {/* Continue button */}
            <Button
              onClick={() => setStep('payment')}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90"
            >
              Continue to Payment
            </Button>
          </motion.div>
        );

      case 'payment':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Payment method selection */}
            <div className="space-y-3">
              <label className="text-sm text-white/60">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <motion.button
                    key={method.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      HapticFeedback.light();
                      setPaymentMethod(method.id);
                    }}
                    className={`
                      p-3 rounded-xl border transition-all flex items-center gap-2
                      ${paymentMethod === method.id
                        ? 'border-primary-500 bg-primary-500/20'
                        : 'border-white/10 bg-dark-800/50 hover:border-white/20'
                      }
                    `}
                  >
                    <span className="text-xl">{method.icon}</span>
                    <span className="text-sm text-white">{method.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Card form */}
            {paymentMethod === 'card' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm text-white/60">Card Number</label>
                  <div className="relative mt-1">
                    <CreditCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full bg-dark-800/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full mt-1 bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60">CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full mt-1 bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60">Name on Card</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full mt-1 bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="rounded border-white/20 bg-dark-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-white/70">Save card for future purchases</span>
                </label>
              </motion.div>
            )}

            {/* Other payment methods message */}
            {paymentMethod !== 'card' && (
              <div className="bg-dark-800/50 rounded-xl p-4 text-center">
                <p className="text-white/60">
                  You will be redirected to {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name} to complete your payment.
                </p>
              </div>
            )}

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs text-white/40">
              <LockClosedIcon className="h-4 w-4" />
              <span>Secured with 256-bit SSL encryption</span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setStep('details')}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitPayment}
                disabled={paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvc || !cardName)}
                className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                Pay ${finalPrice.toFixed(2)}
              </Button>
            </div>
          </motion.div>
        );

      case 'processing':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-16 h-16 mx-auto border-4 border-primary-500 border-t-transparent rounded-full"
            />
            <p className="mt-6 text-lg text-white">Processing payment...</p>
            <p className="mt-2 text-sm text-white/60">Please don't close this window</p>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200 }}
              className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center"
            >
              <CheckCircleIcon className="h-12 w-12 text-green-500" />
            </motion.div>
            <h3 className="mt-6 text-xl font-bold text-white">Payment Successful!</h3>
            <p className="mt-2 text-white/60">Thank you for your purchase</p>
            
            <div className="mt-6 bg-dark-800/50 rounded-xl p-4 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Transaction ID</span>
                <span className="text-white font-mono">{transactionId}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-white/60">Amount</span>
                <span className="text-white">${finalPrice.toFixed(2)} {currency}</span>
              </div>
            </div>

            {savings > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm"
              >
                <GiftIcon className="h-4 w-4" />
                You saved ${savings.toFixed(2)}!
              </motion.div>
            )}

            <Button
              onClick={handleClose}
              className="w-full mt-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90"
            >
              Done
            </Button>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200 }}
              className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center"
            >
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
            </motion.div>
            <h3 className="mt-6 text-xl font-bold text-white">Payment Failed</h3>
            <p className="mt-2 text-white/60">{errorMessage}</p>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleClose}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep('payment')}
                className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <GlassCard variant="crystal" className="relative p-6">
              {/* Close button */}
              {step !== 'processing' && (
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-white/60" />
                </button>
              )}

              {/* Header */}
              {step !== 'success' && step !== 'error' && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {step === 'details' ? 'Checkout' : 'Payment Details'}
                  </h2>
                  <p className="text-sm text-white/60 mt-1">
                    {step === 'details' 
                      ? 'Review your order'
                      : 'Enter your payment information'
                    }
                  </p>
                </div>
              )}

              {/* Step indicator */}
              {step !== 'processing' && step !== 'success' && step !== 'error' && (
                <div className="flex gap-2 mb-6">
                  {['details', 'payment'].map((s) => (
                    <div
                      key={s}
                      className={`
                        flex-1 h-1 rounded-full transition-colors
                        ${step === s || (step === 'payment' && s === 'details')
                          ? 'bg-primary-500'
                          : 'bg-white/10'
                        }
                      `}
                    />
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                {renderContent()}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
