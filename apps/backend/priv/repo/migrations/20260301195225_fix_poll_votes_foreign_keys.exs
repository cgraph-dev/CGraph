defmodule CGraph.Repo.Migrations.FixPollVotesForeignKeys do
  use Ecto.Migration

  def up do
    # Drop old FKs that reference legacy `polls` and `poll_options` tables
    execute "ALTER TABLE poll_votes DROP CONSTRAINT IF EXISTS poll_votes_poll_id_fkey"
    execute "ALTER TABLE poll_votes DROP CONSTRAINT IF EXISTS poll_votes_option_id_fkey"

    # Drop the option_id column — options are now JSONB in thread_polls.options
    alter table(:poll_votes) do
      remove_if_exists :option_id, :binary_id
    end

    # Add FK to thread_polls (Phase 14 table)
    alter table(:poll_votes) do
      modify :poll_id, references(:thread_polls, type: :binary_id, on_delete: :delete_all),
        from: :binary_id
    end
  end

  def down do
    execute "ALTER TABLE poll_votes DROP CONSTRAINT IF EXISTS poll_votes_poll_id_fkey"

    alter table(:poll_votes) do
      modify :poll_id, references(:polls, type: :binary_id, on_delete: :delete_all),
        from: :binary_id
      add_if_not_exists :option_id, references(:poll_options, type: :binary_id, on_delete: :delete_all)
    end
  end
end
