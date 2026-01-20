defmodule CGraph.Repo.Migrations.CreateCustomEmojisSystem do
  @moduledoc """
  Creates the custom emoji system tables.

  Supports:
  - Global custom emojis (site-wide)
  - Forum-scoped emojis (per-forum custom emojis)
  - Emoji categories for organization
  - Usage tracking and moderation
  """
  use Ecto.Migration

  def change do
    # ========================================
    # Custom Emoji Categories
    # ========================================
    create table(:emoji_categories, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :description, :string
      add :display_order, :integer, default: 0
      add :icon, :string  # Category icon (emoji or URL)
      
      # Scope: nil = global, forum_id = forum-specific
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all)
      
      add :is_active, :boolean, default: true
      add :is_system, :boolean, default: false  # System categories can't be deleted

      timestamps()
    end

    create index(:emoji_categories, [:forum_id])
    create index(:emoji_categories, [:display_order])
    create unique_index(:emoji_categories, [:name, :forum_id], 
      name: :emoji_categories_name_forum_unique,
      where: "forum_id IS NOT NULL")
    create unique_index(:emoji_categories, [:name], 
      name: :emoji_categories_name_global_unique,
      where: "forum_id IS NULL")

    # ========================================
    # Custom Emojis
    # ========================================
    create table(:custom_emojis, primary_key: false) do
      add :id, :binary_id, primary_key: true
      
      # Shortcode (e.g., :pepe:, :custom_smile:)
      add :shortcode, :string, null: false
      add :name, :string, null: false
      add :description, :string
      
      # Image URL or file path
      add :image_url, :string, null: false
      add :image_type, :string, default: "png"  # png, gif, webp
      add :file_size, :integer  # Bytes
      add :width, :integer
      add :height, :integer
      add :is_animated, :boolean, default: false
      
      # Categorization
      add :category_id, references(:emoji_categories, type: :binary_id, on_delete: :nilify_all)
      
      # Scope: nil = global, forum_id = forum-specific
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all)
      
      # Creator/uploader
      add :created_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      
      # Status
      add :is_active, :boolean, default: true
      add :is_system, :boolean, default: false  # System emojis can't be deleted
      add :is_nsfw, :boolean, default: false
      
      # Moderation
      add :approved_at, :utc_datetime
      add :approved_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :rejected_at, :utc_datetime
      add :rejection_reason, :string
      
      # Usage tracking
      add :usage_count, :integer, default: 0
      add :last_used_at, :utc_datetime
      
      # Aliases (alternative shortcodes)
      add :aliases, {:array, :string}, default: []
      
      # Ordering
      add :display_order, :integer, default: 0

      timestamps()
    end

    create index(:custom_emojis, [:forum_id])
    create index(:custom_emojis, [:category_id])
    create index(:custom_emojis, [:created_by_id])
    create index(:custom_emojis, [:is_active])
    create index(:custom_emojis, [:usage_count])
    create index(:custom_emojis, [:display_order])
    
    # Shortcode must be unique within scope (global or per-forum)
    create unique_index(:custom_emojis, [:shortcode, :forum_id], 
      name: :custom_emojis_shortcode_forum_unique,
      where: "forum_id IS NOT NULL")
    create unique_index(:custom_emojis, [:shortcode], 
      name: :custom_emojis_shortcode_global_unique,
      where: "forum_id IS NULL")

    # ========================================
    # Emoji Packs (collections)
    # ========================================
    create table(:emoji_packs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :description, :text
      add :author, :string
      add :version, :string, default: "1.0.0"
      add :icon_url, :string
      add :source_url, :string  # Where the pack came from
      
      # Scope
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all)
      add :created_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      
      add :is_active, :boolean, default: true
      add :is_premium, :boolean, default: false  # Requires subscription
      add :emoji_count, :integer, default: 0

      timestamps()
    end

    create index(:emoji_packs, [:forum_id])
    create index(:emoji_packs, [:created_by_id])

    # Link emojis to packs
    alter table(:custom_emojis) do
      add :pack_id, references(:emoji_packs, type: :binary_id, on_delete: :delete_all)
    end

    create index(:custom_emojis, [:pack_id])

    # ========================================
    # User Emoji Favorites
    # ========================================
    create table(:user_emoji_favorites, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :emoji_id, references(:custom_emojis, type: :binary_id, on_delete: :delete_all), null: false
      add :order, :integer, default: 0

      timestamps(updated_at: false)
    end

    create unique_index(:user_emoji_favorites, [:user_id, :emoji_id])
    create index(:user_emoji_favorites, [:user_id, :order])

    # ========================================
    # Emoji Usage History (for recently used)
    # ========================================
    create table(:emoji_usage_history, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :emoji_id, references(:custom_emojis, type: :binary_id, on_delete: :delete_all), null: false
      add :context, :string  # "message", "post", "reaction"
      add :context_id, :binary_id  # ID of the message/post

      timestamps(updated_at: false)
    end

    create index(:emoji_usage_history, [:user_id, :inserted_at])
    create index(:emoji_usage_history, [:emoji_id])

    # ========================================
    # Seed Default Categories
    # ========================================
    execute """
    INSERT INTO emoji_categories (id, name, description, display_order, icon, is_system, is_active, inserted_at, updated_at)
    VALUES
      (gen_random_uuid(), 'Smileys', 'Smileys and emotion emojis', 1, '😊', true, true, NOW(), NOW()),
      (gen_random_uuid(), 'People', 'People and gestures', 2, '👋', true, true, NOW(), NOW()),
      (gen_random_uuid(), 'Animals', 'Animals and nature', 3, '🐱', true, true, NOW(), NOW()),
      (gen_random_uuid(), 'Food', 'Food and drinks', 4, '🍕', true, true, NOW(), NOW()),
      (gen_random_uuid(), 'Activities', 'Activities and sports', 5, '⚽', true, true, NOW(), NOW()),
      (gen_random_uuid(), 'Travel', 'Travel and places', 6, '✈️', true, true, NOW(), NOW()),
      (gen_random_uuid(), 'Objects', 'Objects and symbols', 7, '💡', true, true, NOW(), NOW()),
      (gen_random_uuid(), 'Custom', 'User-created custom emojis', 10, '✨', true, true, NOW(), NOW()),
      (gen_random_uuid(), 'Memes', 'Popular meme emojis', 11, '🐸', true, true, NOW(), NOW()),
      (gen_random_uuid(), 'Reactions', 'Quick reaction emojis', 12, '👍', true, true, NOW(), NOW())
    """, ""
  end
end
