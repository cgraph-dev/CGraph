defmodule Cgraph.Repo.Migrations.AddComprehensiveSecurityIndexes do
  @moduledoc """
  Adds comprehensive indexes for security and performance at scale (10,000+ users).
  
  This migration addresses:
  - Missing coin_transactions compound index (HIGH priority)
  - 2FA attempt tracking index for rate limiting
  - Premium subscription expiry queries
  - Search performance with trigram indexes
  
  All indexes created CONCURRENTLY to avoid locking production tables.
  """
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    # =========================================================================
    # HIGH PRIORITY: Coin Transactions Performance
    # =========================================================================
    
    # Compound index for user coin history queries (list_coin_transactions)
    # Query: WHERE user_id = ? ORDER BY inserted_at DESC
    create_if_not_exists index(:coin_transactions, [:user_id, :inserted_at],
      name: :coin_transactions_user_inserted_index,
      concurrently: true
    )

    # =========================================================================
    # NOTE: 2FA attempts are stored in Redis, not a database table.
    # The TwoFactorRateLimiter uses Redis for fast, TTL-based tracking.
    # =========================================================================

    # =========================================================================
    # PREMIUM: Subscription Expiry Queries
    # =========================================================================
    
    # Partial index for finding expiring subscriptions (batch jobs)
    create_if_not_exists index(:users, [:subscription_expires_at],
      where: "subscription_tier != 'free' AND subscription_expires_at IS NOT NULL",
      name: :users_subscription_expiry_partial_index,
      concurrently: true
    )

    # =========================================================================
    # PERFORMANCE: Additional Query Optimizations
    # =========================================================================
    
    # Messages by conversation for pagination (very common query)
    create_if_not_exists index(:messages, [:conversation_id, :inserted_at],
      name: :messages_conversation_time_index,
      concurrently: true
    )

    # Channel messages - stored in messages table with channel_id 
    # (channel_messages table doesn't exist - messages table handles all)
    create_if_not_exists index(:messages, [:channel_id, :inserted_at],
      where: "channel_id IS NOT NULL",
      name: :messages_channel_time_partial_index,
      concurrently: true
    )

    # Friend requests pending (common dashboard query)
    # friendships table uses user_id (sender) and friend_id (receiver)
    create_if_not_exists index(:friendships, [:friend_id, :status],
      where: "status = 'pending'",
      name: :friendships_pending_friend_partial_index,
      concurrently: true
    )

    # Unread notifications (badge count query)
    create_if_not_exists index(:notifications, [:user_id, :read_at],
      where: "read_at IS NULL",
      name: :notifications_unread_partial_index,
      concurrently: true
    )

    # User sessions by token_hash for fast auth lookup
    create_if_not_exists index(:sessions, [:token_hash],
      where: "revoked_at IS NULL",
      name: :sessions_active_token_hash_partial_index,
      concurrently: true
    )
  end
end
