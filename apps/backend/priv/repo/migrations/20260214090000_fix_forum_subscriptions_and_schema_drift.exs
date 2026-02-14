defmodule CGraph.Repo.Migrations.FixForumSubscriptionsAndSchemaDrift do
  use Ecto.Migration

  def up do
    # Make forum_id nullable - thread/board subscriptions don't need it
    execute "ALTER TABLE forum_subscriptions ALTER COLUMN forum_id DROP NOT NULL"

    # Add updated_at if missing (schema uses timestamps())
    unless column_exists?("forum_subscriptions", "updated_at") do
      alter table(:forum_subscriptions) do
        add :updated_at, :utc_datetime, null: false, default: fragment("NOW()")
      end
    end

    # Add thread_id and board_id if previous migration didn't add them
    unless column_exists?("forum_subscriptions", "thread_id") do
      alter table(:forum_subscriptions) do
        add :thread_id, references(:threads, type: :binary_id, on_delete: :delete_all)
      end
    end

    unless column_exists?("forum_subscriptions", "board_id") do
      alter table(:forum_subscriptions) do
        add :board_id, references(:boards, type: :binary_id, on_delete: :delete_all)
      end
    end

    # Add missing columns to user_event_progress that schema now defines
    unless column_exists?("user_event_progress", "first_activity_at") do
      alter table(:user_event_progress) do
        add :first_activity_at, :utc_datetime
      end
    end

    unless column_exists?("user_event_progress", "last_activity_at") do
      alter table(:user_event_progress) do
        add :last_activity_at, :utc_datetime
      end
    end

    unless column_exists?("user_event_progress", "days_participated") do
      alter table(:user_event_progress) do
        add :days_participated, :integer, default: 0
      end
    end

    unless column_exists?("user_event_progress", "streak_days") do
      alter table(:user_event_progress) do
        add :streak_days, :integer, default: 0
      end
    end

    unless column_exists?("user_event_progress", "longest_streak") do
      alter table(:user_event_progress) do
        add :longest_streak, :integer, default: 0
      end
    end

    unless column_exists?("user_event_progress", "completed") do
      alter table(:user_event_progress) do
        add :completed, :boolean, default: false
      end
    end

    unless column_exists?("user_event_progress", "completed_at") do
      alter table(:user_event_progress) do
        add :completed_at, :utc_datetime
      end
    end

    unless column_exists?("user_event_progress", "completion_rank") do
      alter table(:user_event_progress) do
        add :completion_rank, :integer
      end
    end

    unless column_exists?("user_event_progress", "leaderboard_rank") do
      alter table(:user_event_progress) do
        add :leaderboard_rank, :integer
      end
    end
  end

  def down do
    execute "ALTER TABLE forum_subscriptions ALTER COLUMN forum_id SET NOT NULL"
  end

  defp column_exists?(table, column) do
    result = repo().query!(
      "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
      [table, column]
    )
    result.num_rows > 0
  end
end
