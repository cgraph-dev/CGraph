/**
 * OrderDetailsStep component - checkout order summary
 * @module modules/premium/components/payment-modal
 */

import { motion } from 'motion/react';
import { Button } from '@/components';
import type { PaymentItem } from './types';

interface OrderDetailsStepProps {
  item: PaymentItem;
  promoCode: string;
  promoApplied: boolean;
  promoDiscount: number;
  finalPrice: number;
  onPromoChange: (code: string) => void;
  onApplyPromo: () => void;
  onContinue: () => void;
}

/**
 * unknown for the premium module.
 */
/**
 * Order Details Step component.
 */
export function OrderDetailsStep({
  item,
  promoCode,
  promoApplied,
  promoDiscount,
  finalPrice,
  onPromoChange,
  onApplyPromo,
  onContinue,
}: OrderDetailsStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Order summary */}
      <div className="space-y-3 rounded-xl bg-dark-800/50 p-4">
        <h3 className="font-semibold text-white">Order Summary</h3>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-white">{item.name}</p>
            <p className="text-sm text-white/60">{item.description}</p>
            {item.billingInterval && item.billingInterval !== 'one-time' && (
              <p className="mt-1 text-xs text-white/40">Billed {item.billingInterval}</p>
            )}
          </div>
          <div className="text-right">
            {item.originalPrice && (
              <p className="text-sm text-white/40 line-through">${item.originalPrice.toFixed(2)}</p>
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

        <div className="flex justify-between border-t border-white/10 pt-3">
          <span className="font-semibold text-white">Total</span>
          <span className="text-xl font-bold text-white">${finalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Promo code */}
      <div className="space-y-2">
        <label className="text-sm text-white/60">Promo Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => onPromoChange(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 rounded-lg border border-white/10 bg-dark-800/50 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button
            onClick={onApplyPromo}
            disabled={!promoCode}
            className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20 disabled:opacity-50"
          >
            Apply
          </Button>
        </div>
        {promoApplied && <p className="text-sm text-green-400">✓ Promo code applied!</p>}
      </div>

      {/* Continue button */}
      <Button
        onClick={onContinue}
        className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-semibold text-white hover:opacity-90"
      >
        Continue to Payment
      </Button>
    </motion.div>
  );
}
