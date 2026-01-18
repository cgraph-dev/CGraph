defmodule CGraph.Repo.Migrations.AddUserThemePreferences do
  @moduledoc """
  Add theme preferences to users table for the global theme system.

  Theme preferences allow users to customize:
  - Color presets (12 options)
  - Avatar borders (10 types including animated)
  - Chat bubble styles (8 options)
  - Visual effects (6 types)
  - Animation settings

  Uses JSONB for flexible schema evolution and GIN indexing for efficient queries.
  """
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def up do
    # Add theme_preferences column to users table
    alter table(:users) do
      add_if_not_exists :theme_preferences, :jsonb, default: fragment("'{}'::jsonb")
    end

    # Create GIN index for efficient JSONB queries (CONCURRENTLY for zero downtime)
    create_if_not_exists index(:users, [:theme_preferences], 
      using: :gin, 
      concurrently: true,
      name: :users_theme_preferences_gin_idx
    )

    # Add theme snapshot to messages for preserving sender's theme at send time
    alter table(:messages) do
      add_if_not_exists :sender_theme_snapshot, :jsonb, default: fragment("'{}'::jsonb")
    end

    # Add theme snapshot to posts
    alter table(:posts) do
      add_if_not_exists :author_theme_snapshot, :jsonb, default: fragment("'{}'::jsonb")
    end

    # Add theme snapshot to comments
    alter table(:comments) do
      add_if_not_exists :author_theme_snapshot, :jsonb, default: fragment("'{}'::jsonb")
    end

    # Create index for theme color preset queries (for analytics/discovery)
    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS users_theme_color_preset_idx 
    ON users ((theme_preferences->>'colorPreset'))
    WHERE theme_preferences->>'colorPreset' IS NOT NULL;
    """

    # Create index for premium theme features
    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS users_theme_premium_idx 
    ON users ((theme_preferences->>'isPremium'))
    WHERE (theme_preferences->>'isPremium')::boolean = true;
    """
  end

  def down do
    # Remove indexes first
    execute "DROP INDEX CONCURRENTLY IF EXISTS users_theme_premium_idx;"
    execute "DROP INDEX CONCURRENTLY IF EXISTS users_theme_color_preset_idx;"
    execute "DROP INDEX CONCURRENTLY IF EXISTS users_theme_preferences_gin_idx;"

    # Remove columns
    alter table(:comments) do
      remove_if_exists :author_theme_snapshot, :jsonb
    end

    alter table(:posts) do
      remove_if_exists :author_theme_snapshot, :jsonb
    end

    alter table(:messages) do
      remove_if_exists :sender_theme_snapshot, :jsonb
    end

    alter table(:users) do
      remove_if_exists :theme_preferences, :jsonb
    end
  end
end
