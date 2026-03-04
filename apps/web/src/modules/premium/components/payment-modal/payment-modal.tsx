/**
 * PaymentModal Component - Main component
 * @module modules/premium/components/payment-modal
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { PaymentModalProps } from './types';
import { usePaymentModal } from './usePaymentModal';
import { OrderDetailsStep } from './order-details-step';
import { PaymentStep } from './payment-step';
import { ProcessingStep, SuccessStep, ErrorStep } from './result-steps';

/**
 * unknown for the premium module.
 */
/**
 * Payment Modal dialog component.
 */
export function PaymentModal({
  isOpen,
  onClose,
  item,
  onSuccess,
  onError,
}: PaymentModalProps): React.ReactElement {
  const {
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
    setStep,
    setPaymentMethod,
    setPromoCode,
    updateCardData,
    handleApplyPromo,
    handleSubmitPayment,
    resetState,
  } = usePaymentModal(item, onSuccess, onError);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'details':
        return (
          <OrderDetailsStep
            item={item}
            promoCode={promoCode}
            promoApplied={promoApplied}
            promoDiscount={promoDiscount}
            finalPrice={finalPrice}
            onPromoChange={setPromoCode}
            onApplyPromo={handleApplyPromo}
            onContinue={() => setStep('payment')}
          />
        );

      case 'payment':
        return (
          <PaymentStep
            paymentMethod={paymentMethod}
            cardData={cardData}
            finalPrice={finalPrice}
            isCardFormValid={isCardFormValid}
            onPaymentMethodChange={setPaymentMethod}
            onCardDataChange={updateCardData}
            onBack={() => setStep('details')}
            onSubmit={handleSubmitPayment}
          />
        );

      case 'processing':
        return <ProcessingStep />;

      case 'success':
        return (
          <SuccessStep
            item={item}
            transactionId={transactionId}
            finalPrice={finalPrice}
            currency={currency}
            promoDiscount={promoDiscount}
            onClose={handleClose}
          />
        );

      case 'error':
        return (
          <ErrorStep
            errorMessage={errorMessage}
            onClose={handleClose}
            onRetry={() => setStep('payment')}
          />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
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
                  className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10"
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
                  <p className="mt-1 text-sm text-white/60">
                    {step === 'details' ? 'Review your order' : 'Enter your payment information'}
                  </p>
                </div>
              )}

              {/* Step indicator */}
              {step !== 'processing' && step !== 'success' && step !== 'error' && (
                <div className="mb-6 flex gap-2">
                  {['details', 'payment'].map((s) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        step === s || (step === 'payment' && s === 'details')
                          ? 'bg-primary-500'
                          : 'bg-white/10'
                      } `}
                    />
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
