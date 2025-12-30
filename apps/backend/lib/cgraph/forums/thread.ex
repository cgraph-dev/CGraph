defmodule Cgraph.Forums.Thread do
  @moduledoc """
  Thread schema representing a discussion topic within a board.
  
  Threads are the main content units in a forum. Each thread belongs to a board
  and contains posts (replies). Threads can be:
  - Normal: Regular discussion
  - Sticky/Pinned: Always shown at top
  - Announcement: Important notice
  - Poll: Contains a poll
  
  ## Features
  - Multiple thread types (normal, sticky, announcement, poll)
  - Thread prefixes (tags like [SOLVED], [HELP])
  - View and reply counters
  - Voting (optional Reddit-style)
  - Locking and pinning
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :title, :slug, :thread_type, :is_locked, :is_pinned,
    :prefix, :view_count, :reply_count, :score, :inserted_at, :last_post_at
  ]}

  @thread_types ["normal", "sticky", "announcement", "poll"]

  schema "threads" do
    field :title, :string
    field :slug, :string
    field :content, :string
    field :content_html, :string
    
    # Thread type
    field :thread_type, :string, default: "normal"
    
    # Status
    field :is_locked, :boolean, default: false
    field :is_pinned, :boolean, default: false
    field :is_hidden, :boolean, default: false
    field :is_approved, :boolean, default: true
    
    # Prefix/Tags
    field :prefix, :string
    field :prefix_color, :string
    
    # Stats
    field :view_count, :integer, default: 0
    field :reply_count, :integer, default: 0
    field :last_post_at, :utc_datetime
    field :last_post_id, :binary_id
    
    # Voting
    field :score, :integer, default: 0
    field :upvotes, :integer, default: 0
    field :downvotes, :integer, default: 0
    field :hot_score, :float, default: 0.0
    
    # Soft delete
    field :deleted_at, :utc_datetime

    belongs_to :board, Cgraph.Forums.Board
    belongs_to :author, Cgraph.Accounts.User
    belongs_to :last_poster, Cgraph.Accounts.User
    has_many :posts, Cgraph.Forums.ThreadPost
    has_many :votes, Cgraph.Forums.ThreadVote
    has_one :poll, Cgraph.Forums.ThreadPoll

    timestamps()
  end

  @doc """
  Changeset for creating a new thread.
  """
  def changeset(thread, attrs) do
    thread
    |> cast(attrs, [
      :title, :slug, :content, :content_html, :thread_type,
      :is_locked, :is_pinned, :is_hidden, :is_approved,
      :prefix, :prefix_color, :board_id, :author_id
    ])
    |> validate_required([:title, :content, :board_id, :author_id])
    |> validate_length(:title, min: 3, max: 200)
    |> validate_inclusion(:thread_type, @thread_types)
    |> maybe_generate_slug()
    |> maybe_render_html()
    |> unique_constraint([:board_id, :slug])
    |> foreign_key_constraint(:board_id)
    |> foreign_key_constraint(:author_id)
  end

  @doc """
  Changeset for updating thread stats.
  """
  def stats_changeset(thread, attrs) do
    thread
    |> cast(attrs, [
      :view_count, :reply_count, :last_post_at, :last_post_id, :last_poster_id,
      :score, :upvotes, :downvotes, :hot_score
    ])
  end

  @doc """
  Changeset for moderator actions.
  """
  def moderation_changeset(thread, attrs) do
    thread
    |> cast(attrs, [:is_locked, :is_pinned, :is_hidden, :is_approved, :thread_type])
  end

  defp maybe_generate_slug(changeset) do
    case get_change(changeset, :slug) do
      nil ->
        case get_change(changeset, :title) do
          nil -> changeset
          title -> 
            slug = Slug.slugify(title) <> "-" <> random_suffix()
            put_change(changeset, :slug, slug)
        end
      _ -> changeset
    end
  end

  defp random_suffix do
    :crypto.strong_rand_bytes(4) |> Base.url_encode64(padding: false) |> String.downcase()
  end

  defp maybe_render_html(changeset) do
    case get_change(changeset, :content) do
      nil -> changeset
      content ->
        # Simple markdown/bbcode to HTML conversion
        # In production, use a proper sanitizer like HtmlSanitizeEx
        html = content
          |> String.replace("\n", "<br>")
          |> escape_html()
        put_change(changeset, :content_html, html)
    end
  end

  defp escape_html(text) do
    text
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
  end
end
