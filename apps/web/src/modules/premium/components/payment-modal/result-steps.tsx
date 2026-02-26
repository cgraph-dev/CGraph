/**
 * PaymentModal step result components
 * @module modules/premium/components/payment-modal
 */

import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationTriangleIcon, GiftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components';
import { calculateSavings } from './utils';
import type { PaymentItem } from './types';
import { tweens, loop, springs } from '@/lib/animation-presets';

/**
 * unknown for the premium module.
 */
/**
 * Processing Step component.
 */
export function ProcessingStep() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={loop(tweens.slow)}
        className="mx-auto h-16 w-16 rounded-full border-4 border-primary-500 border-t-transparent"
      />
      <p className="mt-6 text-lg text-white">Processing payment...</p>
      <p className="mt-2 text-sm text-white/60">Please don't close this window</p>
    </motion.div>
  );
}

interface SuccessStepProps {
  item: PaymentItem;
  transactionId: string;
  finalPrice: number;
  currency: string;
  promoDiscount: number;
  onClose: () => void;
}

/**
 * unknown for the premium module.
 */
/**
 * Success Step component.
 */
export function SuccessStep({
  item,
  transactionId,
  finalPrice,
  currency,
  promoDiscount,
  onClose,
}: SuccessStepProps) {
  const savings = calculateSavings(item.price, item.originalPrice, promoDiscount);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springs.wobbly}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20"
      >
        <CheckCircleIcon className="h-12 w-12 text-green-500" />
      </motion.div>
      <h3 className="mt-6 text-xl font-bold text-white">Payment Successful!</h3>
      <p className="mt-2 text-white/60">Thank you for your purchase</p>

      <div className="mt-6 rounded-xl bg-dark-800/50 p-4 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Transaction ID</span>
          <span className="font-mono text-white">{transactionId}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-white/60">Amount</span>
          <span className="text-white">
            ${finalPrice.toFixed(2)} {currency}
          </span>
        </div>
      </div>

      {savings > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 text-sm text-green-400"
        >
          <GiftIcon className="h-4 w-4" />
          You saved ${savings.toFixed(2)}!
        </motion.div>
      )}

      <Button
        onClick={onClose}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-semibold text-white hover:opacity-90"
      >
        Done
      </Button>
    </motion.div>
  );
}

interface ErrorStepProps {
  errorMessage: string;
  onClose: () => void;
  onRetry: () => void;
}

/**
 * unknown for the premium module.
 */
/**
 * Error Step — fallback UI for error states.
 */
export function ErrorStep({ errorMessage, onClose, onRetry }: ErrorStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springs.wobbly}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20"
      >
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
      </motion.div>
      <h3 className="mt-6 text-xl font-bold text-white">Payment Failed</h3>
      <p className="mt-2 text-white/60">{errorMessage}</p>

      <div className="mt-6 flex gap-3">
        <Button
          onClick={onClose}
          className="flex-1 rounded-xl bg-white/10 py-3 text-white hover:bg-white/20"
        >
          Cancel
        </Button>
        <Button
          onClick={onRetry}
          className="flex-1 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-semibold text-white hover:opacity-90"
        >
          Try Again
        </Button>
      </div>
    </motion.div>
  );
}
