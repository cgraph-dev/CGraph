/**
 * Native IAP Service for Apple App Store and Google Play Store.
 *
 * Uses react-native-iap to interface with native purchase APIs.
 * Complements (does NOT replace) the existing payment.ts for non-IAP flows.
 * After a native purchase, sends receipt to backend POST /api/v1/iap/validate.
 *
 * @module features/premium/services/iap-service
 */

import {
  initConnection,
  endConnection,
  // @ts-expect-error - react-native-iap types are installed at runtime
  getSubscriptions,
  // @ts-expect-error - react-native-iap types are installed at runtime
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
  type Purchase,
  type Subscription,
  type PurchaseError,
} from 'react-native-iap';
import { Platform } from 'react-native';
import api from '../../../lib/api';

// ---------------------------------------------------------------------------
// Product SKUs
// ---------------------------------------------------------------------------

const SUBSCRIPTION_SKUS =
  Platform.select({
    ios: ['com.cgraph.premium.monthly', 'com.cgraph.premium.yearly'],
    android: ['com.cgraph.premium.monthly', 'com.cgraph.premium.yearly'],
  }) ?? [];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  localizedPrice: string;
  price: string;
  currency: string;
}

export interface IAPValidationResult {
  success: boolean;
  data?: {
    platform: string;
    product_id: string;
    validation_status: string;
    expires_at: string | null;
  };
  error?: string;
}

export type PurchaseCallback = (purchase: Purchase) => void;
export type ErrorCallback = (error: PurchaseError) => void;

// ---------------------------------------------------------------------------
// IAP Service
// ---------------------------------------------------------------------------

class IAPService {
  private products: Subscription[] = [];
  private purchaseListener: ReturnType<typeof purchaseUpdatedListener> | null = null;
  private errorListener: ReturnType<typeof purchaseErrorListener> | null = null;
  private initialized = false;
  private onPurchaseSuccess: PurchaseCallback | null = null;
  private onPurchaseError: ErrorCallback | null = null;

  /**
   * Initialize the IAP connection and set up purchase listeners.
   * Must be called before any other IAP operations.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await initConnection();

      this.purchaseListener = purchaseUpdatedListener(this.handlePurchase.bind(this));

      this.errorListener = purchaseErrorListener((error: PurchaseError) => {
        console.warn('[IAPService] Purchase error:', error.code, error.message);
        this.onPurchaseError?.(error);
      });

      this.initialized = true;
    } catch (error) {
      console.error('[IAPService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Load available subscription products from the store.
   */
  async loadProducts(): Promise<IAPProduct[]> {
    try {
      this.products = await getSubscriptions({ skus: SUBSCRIPTION_SKUS });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.products.map((p: any) => ({
        productId: p.productId,
        title: p.title,
        description: p.description,
        localizedPrice: p.localizedPrice,
        price: p.price,
        currency: p.currency,
      }));
    } catch (error) {
      console.error('[IAPService] Failed to load products:', error);
      return [];
    }
  }

  /**
   * Purchase a subscription via native IAP.
   * The purchase listener will handle receipt validation.
   */
  async purchaseSubscription(
    productId: string,
    callbacks?: { onSuccess?: PurchaseCallback; onError?: ErrorCallback }
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.onPurchaseSuccess = callbacks?.onSuccess ?? null;
    this.onPurchaseError = callbacks?.onError ?? null;

    await requestSubscription({ sku: productId });
    // Purchase listener (handlePurchase) processes the result asynchronously
  }

  /**
   * Restore previous purchases. Re-validates receipts on the backend.
   */
  async restorePurchases(): Promise<IAPValidationResult> {
    try {
      // First refresh native available purchases
      if (this.initialized) {
        await getAvailablePurchases();
      }

      // Then tell backend to re-validate stored receipts
      const response = await api.post('/api/v1/iap/restore');
      return response.data;
    } catch (error) {
      console.error('[IAPService] Restore failed:', error);
      return { success: false, error: 'Failed to restore purchases' };
    }
  }

  /**
   * Register callbacks for purchase events.
   */
  setCallbacks(callbacks: { onSuccess?: PurchaseCallback; onError?: ErrorCallback }): void {
    this.onPurchaseSuccess = callbacks.onSuccess ?? null;
    this.onPurchaseError = callbacks.onError ?? null;
  }

  /**
   * Destroy the IAP connection and clean up listeners.
   * Call on unmount or app background.
   */
  async destroy(): Promise<void> {
    this.purchaseListener?.remove();
    this.errorListener?.remove();
    this.purchaseListener = null;
    this.errorListener = null;
    this.initialized = false;

    try {
      await endConnection();
    } catch {
      // Ignore end connection errors
    }
  }

  // -------------------------------------------------------------------------
  // Private Methods
  // -------------------------------------------------------------------------

  /**
   * Handle a completed purchase from the native IAP listener.
   * Sends receipt to backend for validation, then finishes the transaction.
   */
  private async handlePurchase(purchase: Purchase): Promise<void> {
    if (!purchase.transactionId) return;

    try {
      // Send receipt to backend for server-side validation
      const result = await this.validateReceipt(purchase);

      if (result.success) {
        // Finish transaction — REQUIRED by both Apple and Google
        await finishTransaction({ purchase, isConsumable: false });
        this.onPurchaseSuccess?.(purchase);
      }
    } catch (error) {
      console.error('[IAPService] handlePurchase failed:', error);
    }
  }

  /**
   * Send a purchase receipt to the backend for validation.
   */
  private async validateReceipt(purchase: Purchase): Promise<IAPValidationResult> {
    const platform = Platform.OS === 'ios' ? 'apple' : 'google';

    const response = await api.post('/api/v1/iap/validate', {
      platform,
      transaction_id: purchase.transactionId,
      receipt_data: purchase.transactionId, // receipt validated via transaction ID
      product_id: purchase.productId,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      purchase_token: (purchase as unknown as Record<string, unknown>).purchaseToken, // Google-specific
    });

    return response.data;
  }
}

export const iapService = new IAPService();
export default iapService;
