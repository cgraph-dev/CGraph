defmodule Cgraph.Repo.Migrations.CreateForums do
  use Ecto.Migration

  def up do
    # Forums
    create table(:forums, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :slug, :string, null: false
      add :title, :string
      add :description, :text
      add :icon_url, :string
      add :banner_url, :string

      # Customization
      add :custom_css, :text
      add :primary_color, :string, default: "#1a73e8"
      add :sidebar_html, :text

      # Settings
      add :is_public, :boolean, default: true
      add :is_nsfw, :boolean, default: false
      add :allow_posts, :boolean, default: true
      add :allow_comments, :boolean, default: true
      add :require_post_approval, :boolean, default: false
      add :restricted_posting, :boolean, default: false

      add :allowed_post_types, {:array, :string}, default: ["text", "link", "image", "poll"]
      add :default_sort, :string, default: "hot"

      # Stats
      add :member_count, :integer, default: 1
      add :post_count, :integer, default: 0

      add :owner_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :deleted_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:forums, [:slug])
    create unique_index(:forums, [:name])
    create index(:forums, [:owner_id])
    execute "CREATE INDEX forums_name_trgm_idx ON forums USING gin (name gin_trgm_ops)"

    # Forum categories (flair)
    create table(:forum_categories, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :color, :string, default: "#878A8C"
      add :background_color, :string, default: "#EDEFF1"
      add :description, :string
      add :is_required, :boolean, default: false
      add :position, :integer, default: 0

      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:forum_categories, [:forum_id, :name])
    create index(:forum_categories, [:forum_id, :position])

    # Posts
    create table(:posts, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :title, :string, null: false
      add :content, :text
      add :post_type, :string, default: "text"

      # Link posts
      add :url, :string
      add :link_preview, :map

      # Image posts
      add :images, {:array, :string}, default: []
      add :thumbnail_url, :string

      # Voting
      add :score, :integer, default: 0
      add :upvotes, :integer, default: 0
      add :downvotes, :integer, default: 0
      add :hot_score, :float, default: 0.0

      # Engagement
      add :comment_count, :integer, default: 0
      add :view_count, :integer, default: 0

      # Status
      add :is_pinned, :boolean, default: false
      add :is_locked, :boolean, default: false
      add :is_nsfw, :boolean, default: false
      add :is_spoiler, :boolean, default: false
      add :is_approved, :boolean, default: true
      add :is_edited, :boolean, default: false

      # Removal
      add :removed_at, :utc_datetime
      add :removed_by_id, :binary_id
      add :removal_reason, :string
      add :deleted_at, :utc_datetime

      # Flair
      add :flair_text, :string
      add :flair_color, :string

      add :author_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :category_id, references(:forum_categories, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:posts, [:forum_id, :hot_score])
    create index(:posts, [:forum_id, :inserted_at])
    create index(:posts, [:forum_id, :score])
    create index(:posts, [:author_id])
    create index(:posts, [:category_id])
    create index(:posts, [:deleted_at])
    execute "CREATE INDEX posts_title_trgm_idx ON posts USING gin (title gin_trgm_ops)"

    # Comments
    create table(:comments, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :content, :text, null: false
      add :score, :integer, default: 0
      add :upvotes, :integer, default: 0
      add :downvotes, :integer, default: 0
      add :depth, :integer, default: 0

      add :is_edited, :boolean, default: false
      add :is_collapsed, :boolean, default: false

      add :removed_at, :utc_datetime
      add :removed_by_id, :binary_id
      add :removal_reason, :string
      add :deleted_at, :utc_datetime

      add :author_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :post_id, references(:posts, type: :binary_id, on_delete: :delete_all), null: false
      add :parent_id, references(:comments, type: :binary_id, on_delete: :delete_all)

      timestamps(type: :utc_datetime)
    end

    create index(:comments, [:post_id, :inserted_at])
    create index(:comments, [:post_id, :score])
    create index(:comments, [:parent_id])
    create index(:comments, [:author_id])

    # Votes
    create table(:votes, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :value, :integer, null: false

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :post_id, references(:posts, type: :binary_id, on_delete: :delete_all)
      add :comment_id, references(:comments, type: :binary_id, on_delete: :delete_all)

      timestamps(type: :utc_datetime)
    end

    create unique_index(:votes, [:user_id, :post_id], where: "post_id IS NOT NULL", name: :votes_user_post_unique)
    create unique_index(:votes, [:user_id, :comment_id], where: "comment_id IS NOT NULL", name: :votes_user_comment_unique)
    create index(:votes, [:post_id])
    create index(:votes, [:comment_id])

    # Forum moderators
    create table(:forum_moderators, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :permissions, :bigint, default: 0
      add :is_full_mod, :boolean, default: false

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:forum_moderators, [:user_id, :forum_id])

    # Forum bans
    create table(:forum_bans, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :reason, :string
      add :expires_at, :utc_datetime
      add :is_permanent, :boolean, default: false

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :banned_by_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:forum_bans, [:user_id, :forum_id])

    # Forum rules
    create table(:forum_rules, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :title, :string, null: false
      add :description, :text
      add :position, :integer, default: 0

      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:forum_rules, [:forum_id, :position])

    # Saved posts
    create table(:saved_posts, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :post_id, references(:posts, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create unique_index(:saved_posts, [:user_id, :post_id])

    # Polls
    create table(:polls, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :ends_at, :utc_datetime
      add :allow_multiple, :boolean, default: false
      add :show_results_before_end, :boolean, default: true
      add :total_votes, :integer, default: 0

      add :post_id, references(:posts, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:polls, [:post_id])

    # Poll options
    create table(:poll_options, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :text, :string, null: false
      add :vote_count, :integer, default: 0
      add :position, :integer, default: 0

      add :poll_id, references(:polls, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:poll_options, [:poll_id, :position])

    # Poll votes
    create table(:poll_votes, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :poll_id, references(:polls, type: :binary_id, on_delete: :delete_all), null: false
      add :option_id, references(:poll_options, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create unique_index(:poll_votes, [:user_id, :poll_id, :option_id])
    create index(:poll_votes, [:poll_id])
  end

  def down do
    drop table(:poll_votes)
    drop table(:poll_options)
    drop table(:polls)
    drop table(:saved_posts)
    drop table(:forum_rules)
    drop table(:forum_bans)
    drop table(:forum_moderators)
    drop table(:votes)
    drop table(:comments)
    drop table(:posts)
    drop table(:forum_categories)
    drop table(:forums)
  end
end
