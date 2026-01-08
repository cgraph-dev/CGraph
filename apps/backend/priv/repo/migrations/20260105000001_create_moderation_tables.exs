defmodule Cgraph.Repo.Migrations.CreateModerationTables do
  @moduledoc """
  Creates database tables for the moderation/reporting system.

  ## Tables

  - `reports` - User-submitted content reports
  - `review_actions` - Actions taken by moderators
  - `user_restrictions` - Account suspensions and bans
  - `appeals` - User appeals against moderation actions
  """

  use Ecto.Migration

  def change do
    # Create enum types
    execute """
      CREATE TYPE report_category AS ENUM (
        'csam',
        'terrorism',
        'violence_threat',
        'harassment',
        'hate_speech',
        'doxxing',
        'spam',
        'scam',
        'impersonation',
        'copyright',
        'nsfw_unlabeled',
        'self_harm',
        'other'
      )
    """, "DROP TYPE report_category"

    execute """
      CREATE TYPE report_target_type AS ENUM (
        'user',
        'message',
        'group',
        'forum',
        'post',
        'comment'
      )
    """, "DROP TYPE report_target_type"

    execute """
      CREATE TYPE report_status AS ENUM (
        'pending',
        'reviewing',
        'resolved',
        'dismissed'
      )
    """, "DROP TYPE report_status"

    execute """
      CREATE TYPE report_priority AS ENUM (
        'critical',
        'high',
        'normal',
        'low'
      )
    """, "DROP TYPE report_priority"

    execute """
      CREATE TYPE moderation_action AS ENUM (
        'dismiss',
        'warn',
        'remove_content',
        'suspend',
        'ban'
      )
    """, "DROP TYPE moderation_action"

    execute """
      CREATE TYPE restriction_type AS ENUM (
        'suspended',
        'banned'
      )
    """, "DROP TYPE restriction_type"

    execute """
      CREATE TYPE appeal_status AS ENUM (
        'pending',
        'approved',
        'denied'
      )
    """, "DROP TYPE appeal_status"

    # Reports table
    create table(:reports, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :reporter_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :target_type, :report_target_type, null: false
      add :target_id, :binary_id, null: false
      add :category, :report_category, null: false
      add :description, :text
      add :evidence_urls, {:array, :string}, default: []
      add :status, :report_status, default: "pending", null: false
      add :priority, :report_priority, default: "normal", null: false
      add :reviewed_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:reports, [:reporter_id])
    create index(:reports, [:target_type, :target_id])
    create index(:reports, [:status])
    create index(:reports, [:priority, :inserted_at], where: "status = 'pending'")
    create index(:reports, [:category])

    # Prevent duplicate pending reports for same content by same user
    create unique_index(:reports, [:reporter_id, :target_type, :target_id],
      where: "status = 'pending'",
      name: :reports_no_duplicate_pending)

    # Review actions table
    create table(:review_actions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :report_id, references(:reports, type: :binary_id, on_delete: :delete_all), null: false
      add :reviewer_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :action, :moderation_action, null: false
      add :notes, :text
      add :duration_hours, :integer  # For suspensions

      timestamps(type: :utc_datetime)
    end

    create index(:review_actions, [:report_id])
    create index(:review_actions, [:reviewer_id])
    create index(:review_actions, [:action])

    # User restrictions table
    create table(:user_restrictions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :type, :restriction_type, null: false
      add :reason, :text
      add :expires_at, :utc_datetime  # null = permanent
      add :active, :boolean, default: true, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:user_restrictions, [:user_id])
    create index(:user_restrictions, [:user_id, :active], where: "active = true")
    create index(:user_restrictions, [:expires_at], where: "active = true AND expires_at IS NOT NULL")

    # Appeals table
    create table(:appeals, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :review_action_id, references(:review_actions, type: :binary_id, on_delete: :delete_all), null: false
      add :reason, :text, null: false
      add :status, :appeal_status, default: "pending", null: false
      add :reviewer_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :reviewer_notes, :text
      add :reviewed_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:appeals, [:user_id])
    create index(:appeals, [:review_action_id])
    create index(:appeals, [:status])
    create unique_index(:appeals, [:user_id, :review_action_id])
  end
end
