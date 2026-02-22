/**
 * PaymentStep component - payment form
 * @module modules/premium/components/payment-modal
 */

import { motion } from 'framer-motion';
import { CreditCardIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { PaymentMethod, CardFormData } from './types';
import { PAYMENT_METHODS } from './constants';
import { formatCardNumber, formatExpiry, formatCvc } from './utils';

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  cardData: CardFormData;
  finalPrice: number;
  isCardFormValid: boolean;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onCardDataChange: (updates: Partial<CardFormData>) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function PaymentStep({
  paymentMethod,
  cardData,
  finalPrice,
  isCardFormValid,
  onPaymentMethodChange,
  onCardDataChange,
  onBack,
  onSubmit,
}: PaymentStepProps) {
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
                onPaymentMethodChange(method.id);
              }}
              className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                paymentMethod === method.id
                  ? 'border-primary-500 bg-primary-500/20'
                  : 'border-white/10 bg-dark-800/50 hover:border-white/20'
              } `}
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
              <CreditCardIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={cardData.cardNumber}
                onChange={(e) => onCardDataChange({ cardNumber: formatCardNumber(e.target.value) })}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full rounded-lg border border-white/10 bg-dark-800/50 py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60">Expiry</label>
              <input
                type="text"
                value={cardData.cardExpiry}
                onChange={(e) => onCardDataChange({ cardExpiry: formatExpiry(e.target.value) })}
                placeholder="MM/YY"
                maxLength={5}
                className="mt-1 w-full rounded-lg border border-white/10 bg-dark-800/50 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm text-white/60">CVC</label>
              <input
                type="text"
                value={cardData.cardCvc}
                onChange={(e) => onCardDataChange({ cardCvc: formatCvc(e.target.value) })}
                placeholder="123"
                maxLength={4}
                className="mt-1 w-full rounded-lg border border-white/10 bg-dark-800/50 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60">Name on Card</label>
            <input
              type="text"
              value={cardData.cardName}
              onChange={(e) => onCardDataChange({ cardName: e.target.value })}
              placeholder="John Doe"
              className="mt-1 w-full rounded-lg border border-white/10 bg-dark-800/50 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={cardData.saveCard}
              onChange={(e) => onCardDataChange({ saveCard: e.target.checked })}
              className="rounded border-white/20 bg-dark-800 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-white/70">Save card for future purchases</span>
          </label>
        </motion.div>
      )}

      {/* Other payment methods message */}
      {paymentMethod !== 'card' && (
        <div className="rounded-xl bg-dark-800/50 p-4 text-center">
          <p className="text-white/60">
            You will be redirected to {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.name} to
            complete your payment.
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
          onClick={onBack}
          className="flex-1 rounded-xl bg-white/10 py-3 text-white hover:bg-white/20"
        >
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={paymentMethod === 'card' && !isCardFormValid}
          className="flex-1 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Pay ${finalPrice.toFixed(2)}
        </Button>
      </div>
    </motion.div>
  );
}
