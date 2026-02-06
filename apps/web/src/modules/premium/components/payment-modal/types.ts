/**
 * PaymentModal type definitions
 * @module modules/premium/components/payment-modal
 */

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

export type PaymentStep = 'details' | 'payment' | 'processing' | 'success' | 'error';
export type PaymentMethod = 'card' | 'paypal' | 'apple' | 'google';

export interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: string;
}

export interface CardFormData {
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
  saveCard: boolean;
}

export interface PaymentState {
  step: PaymentStep;
  paymentMethod: PaymentMethod;
  promoCode: string;
  promoApplied: boolean;
  promoDiscount: number;
  cardData: CardFormData;
  errorMessage: string;
  transactionId: string;
}
