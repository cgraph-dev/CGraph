import React from 'react';

/**
 * PaidBadge — displays a price badge next to paid forum names.
 *
 * Usage:
 *   <PaidBadge priceCents={499} currency="usd" />
 *   → renders "$4.99/mo"
 */

export interface PaidBadgeProps {
  /** Subscription price in cents */
  priceCents: number;
  /** ISO 4217 currency code, default "usd" */
  currency?: string;
  /** Optional className override */
  className?: string;
}

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export const PaidBadge: React.FC<PaidBadgeProps> = ({
  priceCents,
  currency = 'usd',
  className,
}) => {
  const price = formatPrice(priceCents, currency);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 ${className ?? ''}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.5 7.5a1.5 1.5 0 113 0c0 .56-.31 1.05-.76 1.3a.75.75 0 00-.49.7V10a.75.75 0 001.5 0v-.08A3 3 0 008.5 7.5zM10 13a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
      {price}/mo
    </span>
  );
};

PaidBadge.displayName = 'PaidBadge';

export default PaidBadge;
