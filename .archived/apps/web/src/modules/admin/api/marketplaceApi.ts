/**
 * Admin Marketplace API
 *
 * Marketplace moderation endpoints for admin dashboard.
 */

import { api as apiClient } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface FlaggedListing {
  id: string;
  title: string;
  sellerId: string;
  sellerUsername: string;
  price: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  flaggedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DisputedTransaction {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

interface ApiFlaggedListingResponse {
  id: string;
  title: string;
  seller_id: string;
  seller_username: string;
  price: number;
  risk_level: string;
  reason: string;
  flagged_at: string;
  status: string;
}

// ============================================================================
// Transformer
// ============================================================================

function transformFlaggedListing(data: ApiFlaggedListingResponse): FlaggedListing {
  return {
    id: data.id,
    title: data.title,
    sellerId: data.seller_id,
    sellerUsername: data.seller_username,
    price: data.price,
    // type assertion: API response field maps to known union type

    riskLevel: data.risk_level as FlaggedListing['riskLevel'],
    reason: data.reason,
    flaggedAt: data.flagged_at,
    // type assertion: API response field maps to known union type

    status: data.status as FlaggedListing['status'],
  };
}

// ============================================================================
// API Functions
// ============================================================================

export const marketplaceApi = {
  /**
   * Get flagged listings
   */
  async getFlaggedListings(params?: {
    page?: number;
    perPage?: number;
  }): Promise<{ listings: FlaggedListing[]; totalCount: number }> {
    const response = await apiClient.get('/api/v1/admin/marketplace/flagged', { params });
    return {
      listings: (response.data.data || []).map(transformFlaggedListing),
      totalCount: response.data.meta?.total_count || response.data.data?.length || 0,
    };
  },

  /**
   * Approve a flagged listing
   */
  async approveListing(listingId: string): Promise<void> {
    await apiClient.post(`/api/v1/admin/marketplace/listings/${listingId}/approve`);
  },

  /**
   * Reject a flagged listing
   */
  async rejectListing(listingId: string): Promise<void> {
    await apiClient.post(`/api/v1/admin/marketplace/listings/${listingId}/reject`);
  },

  /**
   * Bulk approve listings
   */
  async bulkApprove(listingIds: string[]): Promise<void> {
    await apiClient.post('/api/v1/admin/marketplace/listings/bulk-approve', {
      listing_ids: listingIds,
    });
  },

  /**
   * Bulk reject listings
   */
  async bulkReject(listingIds: string[]): Promise<void> {
    await apiClient.post('/api/v1/admin/marketplace/listings/bulk-reject', {
      listing_ids: listingIds,
    });
  },

  /**
   * Get disputed transactions
   */
  async getDisputedTransactions(params?: { page?: number; perPage?: number }): Promise<{
    transactions: DisputedTransaction[];
    totalCount: number;
  }> {
    const response = await apiClient.get('/api/v1/admin/marketplace/transactions/disputed', {
      params,
    });
    return {
      transactions: (response.data.data || []).map(
        (t: {
          id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          reason: string;
          status: string;
          created_at: string;
        }) => ({
          id: t.id,
          buyerId: t.buyer_id,
          sellerId: t.seller_id,
          amount: t.amount,
          reason: t.reason,
          status: t.status,
          createdAt: t.created_at,
        })
      ),
      totalCount: response.data.meta?.total_count || 0,
    };
  },

  /**
   * Get marketplace analytics
   */
  async getAnalytics(): Promise<{
    totalListings: number;
    flaggedCount: number;
    disputeCount: number;
    bannedItemCount: number;
  }> {
    const response = await apiClient.get('/api/v1/admin/marketplace/analytics');
    return {
      totalListings: response.data.total_listings || 0,
      flaggedCount: response.data.flagged_count || 0,
      disputeCount: response.data.dispute_count || 0,
      bannedItemCount: response.data.banned_item_count || 0,
    };
  },

  /**
   * Get banned items list
   */
  async getBannedItems(): Promise<{
    items: Array<{ id: string; name: string; bannedAt: string; reason: string }>;
    totalCount: number;
  }> {
    const response = await apiClient.get('/api/v1/admin/marketplace/banned-items');
    return {
      items: (response.data.data || []).map(
        (item: { id: string; name: string; banned_at: string; reason: string }) => ({
          id: item.id,
          name: item.name,
          bannedAt: item.banned_at,
          reason: item.reason,
        })
      ),
      totalCount: response.data.meta?.total_count || 0,
    };
  },
};
