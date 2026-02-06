/**
 * PaymentModal utility functions
 * @module modules/premium/components/payment-modal
 */

export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
}

export function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
  }
  return cleaned;
}

export function formatCvc(value: string): string {
  return value.replace(/\D/g, '').substring(0, 4);
}

export function generateTransactionId(): string {
  return `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export function calculateFinalPrice(
  price: number,
  promoDiscount: number,
  promoApplied: boolean
): number {
  return promoApplied ? price * (1 - promoDiscount) : price;
}

export function calculateSavings(
  price: number,
  originalPrice: number | undefined,
  promoDiscount: number
): number {
  return originalPrice ? originalPrice - price + promoDiscount * price : promoDiscount * price;
}
