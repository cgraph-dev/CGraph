defmodule CGraph.Repo.Migrations.AddMissingPaginationIndexes do
  use Ecto.Migration

  @moduledoc """
  Add missing composite indexes to improve pagination performance.

  These indexes optimize common query patterns:
  - Forum posts ordered by creation time
  - User messages in conversations
  - Achievements earned by users
  - User notifications ordered by time

  Performance impact: Pagination queries will be significantly faster
  on large datasets (10K+ rows).
  """

  def change do
    # Thread posts pagination (ordered by creation within thread)
    create_if_not_exists index(:thread_posts, [:thread_id, :inserted_at],
      name: :idx_thread_posts_thread_created,
      comment: "Optimize thread post pagination"
    )

    # Messages pagination (ordered by creation within conversation)
    create_if_not_exists index(:messages, [:conversation_id, :inserted_at],
      name: :idx_messages_conversation_created,
      comment: "Optimize message list pagination"
    )

    # User achievements (by user, ordered by earned date)
    create_if_not_exists index(:user_achievements, [:user_id, :unlocked_at],
      name: :idx_user_achievements_user_earned,
      comment: "Optimize user achievement history queries"
    )

    # Notifications pagination (by user, ordered by creation, with read status)
    create_if_not_exists index(:notifications, [:user_id, :inserted_at, :is_read],
      name: :idx_notifications_user_created_read,
      comment: "Optimize notification list and unread count queries"
    )

    # Threads pagination (ordered by last post within board)
    create_if_not_exists index(:threads, [:board_id, :last_post_at],
      name: :idx_threads_board_activity,
      comment: "Optimize thread list queries ordered by activity"
    )
  end
end
