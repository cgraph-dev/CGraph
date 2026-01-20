defmodule CGraph.Repo.Migrations.AddPostIconsAndForumOrdering do
  @moduledoc """
  Adds post icons system and forum/board ordering capabilities.
  
  Post Icons:
  - Allows users to select an icon when creating threads or posts
  - Icons are forum-specific (admin can define available icons per forum)
  - Classic forum feature for visual thread categorization
  
  Forum Ordering:
  - Adds display_order to forums for admin ordering
  - Adds display_order to categories for nested ordering
  """
  use Ecto.Migration

  def up do
    # =========================================================================
    # Post Icons Table - Forum-specific icons users can use
    # =========================================================================
    create table(:post_icons, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :icon_url, :string, null: false
      add :emoji, :string  # Alternative emoji representation
      add :display_order, :integer, default: 0
      add :is_active, :boolean, default: true
      
      # Scope - can be global or forum-specific
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all)
      
      # Optional: restrict to certain boards within forum
      add :board_ids, {:array, :binary_id}, default: []
      
      # Usage tracking
      add :usage_count, :integer, default: 0
      
      timestamps(type: :utc_datetime)
    end

    create index(:post_icons, [:forum_id])
    create index(:post_icons, [:forum_id, :is_active])
    create index(:post_icons, [:display_order])

    # =========================================================================
    # Add icon_id to threads
    # =========================================================================
    alter table(:threads) do
      add_if_not_exists :icon_id, references(:post_icons, type: :binary_id, on_delete: :nilify_all)
    end

    create_if_not_exists index(:threads, [:icon_id])

    # =========================================================================
    # Add icon_id to thread_posts  
    # =========================================================================
    alter table(:thread_posts) do
      add_if_not_exists :icon_id, references(:post_icons, type: :binary_id, on_delete: :nilify_all)
    end

    create_if_not_exists index(:thread_posts, [:icon_id])

    # =========================================================================
    # Forum Ordering - Add display_order to forums and categories
    # =========================================================================
    alter table(:forums) do
      add_if_not_exists :display_order, :integer, default: 0
    end

    create_if_not_exists index(:forums, [:display_order])

    alter table(:categories) do
      add_if_not_exists :display_order, :integer, default: 0
    end

    create_if_not_exists index(:categories, [:display_order])

    # =========================================================================
    # Seed some default global post icons
    # =========================================================================
    execute """
    INSERT INTO post_icons (id, name, icon_url, emoji, display_order, is_active, inserted_at, updated_at)
    VALUES
      (uuid_generate_v4(), 'Default', '/icons/default.svg', '💬', 0, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Question', '/icons/question.svg', '❓', 1, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Exclamation', '/icons/exclamation.svg', '❗', 2, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Arrow', '/icons/arrow.svg', '➡️', 3, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Lightbulb', '/icons/lightbulb.svg', '💡', 4, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Star', '/icons/star.svg', '⭐', 5, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Heart', '/icons/heart.svg', '❤️', 6, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Check', '/icons/check.svg', '✅', 7, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Warning', '/icons/warning.svg', '⚠️', 8, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Info', '/icons/info.svg', 'ℹ️', 9, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Thumbs Up', '/icons/thumbsup.svg', '👍', 10, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Thumbs Down', '/icons/thumbsdown.svg', '👎', 11, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Fire', '/icons/fire.svg', '🔥', 12, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Cool', '/icons/cool.svg', '😎', 13, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Sad', '/icons/sad.svg', '😢', 14, true, NOW(), NOW()),
      (uuid_generate_v4(), 'Angry', '/icons/angry.svg', '😠', 15, true, NOW(), NOW())
    ON CONFLICT DO NOTHING
    """
  end

  def down do
    # Remove icon_id from thread_posts
    alter table(:thread_posts) do
      remove_if_exists :icon_id, :binary_id
    end

    # Remove icon_id from threads
    alter table(:threads) do
      remove_if_exists :icon_id, :binary_id
    end

    # Remove display_order from categories
    alter table(:categories) do
      remove_if_exists :display_order, :integer
    end

    # Remove display_order from forums
    alter table(:forums) do
      remove_if_exists :display_order, :integer
    end

    # Drop post_icons table
    drop_if_exists table(:post_icons)
  end
end
