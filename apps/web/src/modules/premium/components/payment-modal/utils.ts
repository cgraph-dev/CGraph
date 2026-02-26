/**
 * PaymentModal utility functions
 * @module modules/premium/components/payment-modal
 */

/**
 * unknown for the premium module.
 */
/**
 * Formats card number.
 *
 * @param value - The value to set.
 * @returns The processed result.
 */
export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
}

/**
 * unknown for the premium module.
 */
/**
 * Formats expiry.
 *
 * @param value - The value to set.
 * @returns The processed result.
 */
export function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
  }
  return cleaned;
}

/**
 * unknown for the premium module.
 */
/**
 * Formats cvc.
 *
 * @param value - The value to set.
 * @returns The processed result.
 */
export function formatCvc(value: string): string {
  return value.replace(/\D/g, '').substring(0, 4);
}

/**
 * unknown for the premium module.
 */
/**
 * generate Transaction Id for the premium module.
 * @returns The newly created instance.
 */
export function generateTransactionId(): string {
  return `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * unknown for the premium module.
 */
/**
 * Computes final price.
 *
 * @param price - The price.
 * @param promoDiscount - The promo discount.
 * @param promoApplied - The promo applied.
 * @returns The computed value.
 */
export function calculateFinalPrice(
  price: number,
  promoDiscount: number,
  promoApplied: boolean
): number {
  return promoApplied ? price * (1 - promoDiscount) : price;
}

/**
 * unknown for the premium module.
 */
/**
 * Computes savings.
 *
 * @param price - The price.
 * @param originalPrice - The original price.
 * @param promoDiscount - The promo discount.
 * @returns The computed value.
 */
export function calculateSavings(
  price: number,
  originalPrice: number | undefined,
  promoDiscount: number
): number {
  return originalPrice ? originalPrice - price + promoDiscount * price : promoDiscount * price;
}
