defmodule Cgraph.Repo.Migrations.AddScalabilityIndexes do
  @moduledoc """
  Adds indexes for 10,000+ user scalability.
  
  These indexes optimize:
  - Message time-range queries for retention/cleanup
  - Active session lookups per user
  - Notification queries by actor
  - User read receipt lookups
  - Group banned member queries
  """
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    # Messages - time-range queries for retention/cleanup
    # CONCURRENTLY to avoid locking production tables
    create_if_not_exists index(:messages, [:inserted_at], concurrently: true)

    # Sessions - fast lookup of active sessions per user
    create_if_not_exists index(:sessions, [:user_id, :revoked_at], 
      name: :sessions_user_id_revoked_at_index,
      concurrently: true
    )

    # Read receipts - finding all receipts for a user
    create_if_not_exists index(:read_receipts, [:user_id], concurrently: true)

    # Notifications - finding notifications by actor (for cleanup/moderation)
    create_if_not_exists index(:notifications, [:actor_id], concurrently: true)

    # Group members - fast banned member lookups
    create_if_not_exists index(:group_members, [:user_id, :is_banned],
      name: :group_members_user_banned_index,
      concurrently: true
    )

    # Posts - finding pinned posts efficiently
    create_if_not_exists index(:posts, [:forum_id, :is_pinned],
      where: "is_pinned = true",
      name: :posts_forum_pinned_partial_index,
      concurrently: true
    )

    # Conversation participants - finding muted conversations
    create_if_not_exists index(:conversation_participants, [:user_id, :is_muted],
      name: :conversation_participants_user_muted_index,
      concurrently: true
    )

    # XP transactions - leaderboard queries (sum by user)
    create_if_not_exists index(:xp_transactions, [:user_id, :inserted_at], 
      name: :xp_transactions_user_inserted_index,
      concurrently: true
    )

    # User achievements - finding users with specific achievements
    create_if_not_exists index(:user_achievements, [:achievement_id, :unlocked_at], 
      name: :user_achievements_achievement_unlocked_index,
      concurrently: true
    )
  end
end
