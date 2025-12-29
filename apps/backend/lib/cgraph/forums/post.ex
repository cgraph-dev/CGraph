defmodule Cgraph.Forums.Post do
  @moduledoc """
  Forum post schema.
  
  Supports multiple post types:
  - Text posts
  - Link posts (with preview)
  - Image posts (with gallery)
  - Poll posts
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :title, :content, :post_type, :url, :score, :upvotes, :downvotes,
    :comment_count, :is_pinned, :is_locked, :is_nsfw, :author_id, :forum_id,
    :inserted_at, :updated_at
  ]}

  @post_types ["text", "link", "image", "poll"]

  schema "posts" do
    field :title, :string
    field :content, :string  # Markdown content for text posts
    field :post_type, :string, default: "text"

    # Link posts
    field :url, :string
    field :link_preview, :map  # Open Graph metadata

    # Image posts
    field :images, {:array, :string}, default: []  # Array of image URLs
    field :thumbnail_url, :string

    # Voting
    field :score, :integer, default: 0
    field :upvotes, :integer, default: 0
    field :downvotes, :integer, default: 0
    field :hot_score, :float, default: 0.0  # For hot sorting

    # Engagement
    field :comment_count, :integer, default: 0
    field :view_count, :integer, default: 0

    # Status
    field :is_pinned, :boolean, default: false
    field :is_locked, :boolean, default: false  # No new comments
    field :is_nsfw, :boolean, default: false
    field :is_spoiler, :boolean, default: false
    field :is_approved, :boolean, default: true
    field :is_edited, :boolean, default: false

    # Removal
    field :removed_at, :utc_datetime
    field :removed_by_id, :binary_id
    field :removal_reason, :string
    field :deleted_at, :utc_datetime

    # Flair
    field :flair_text, :string
    field :flair_color, :string

    belongs_to :author, Cgraph.Accounts.User
    belongs_to :forum, Cgraph.Forums.Forum
    belongs_to :category, Cgraph.Forums.Category

    has_many :comments, Cgraph.Forums.Comment
    has_many :votes, Cgraph.Forums.Vote
    has_one :poll, Cgraph.Forums.Poll

    timestamps()
  end

  @doc """
  Create a new post.
  """
  def changeset(post, attrs) do
    post
    |> cast(attrs, [
      :title, :content, :post_type, :url, :images, :thumbnail_url,
      :is_nsfw, :is_spoiler, :flair_text, :flair_color,
      :author_id, :forum_id, :category_id
    ])
    |> validate_required([:title, :post_type, :author_id, :forum_id])
    |> validate_length(:title, min: 1, max: 300)
    |> validate_length(:content, max: 40_000)
    |> validate_inclusion(:post_type, @post_types)
    |> validate_post_type_content()
    |> calculate_hot_score()
    |> foreign_key_constraint(:author_id)
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:category_id)
  end

  @doc """
  Edit post content.
  """
  def edit_changeset(post, attrs) do
    post
    |> cast(attrs, [:content, :is_nsfw, :is_spoiler, :flair_text, :flair_color])
    |> validate_length(:content, max: 40_000)
    |> put_change(:is_edited, true)
  end

  @doc """
  Update vote counts and recalculate scores.
  """
  def vote_changeset(post, upvotes, downvotes) do
    score = upvotes - downvotes
    hot_score = calculate_hot_score_value(score, post.inserted_at)

    post
    |> change(upvotes: upvotes)
    |> change(downvotes: downvotes)
    |> change(score: score)
    |> change(hot_score: hot_score)
  end

  @doc """
  Pin/unpin a post.
  """
  def pin_changeset(post, is_pinned) do
    change(post, is_pinned: is_pinned)
  end

  @doc """
  Lock/unlock a post.
  """
  def lock_changeset(post, is_locked) do
    change(post, is_locked: is_locked)
  end

  @doc """
  Remove a post (moderation action).
  """
  def remove_changeset(post, attrs) do
    post
    |> cast(attrs, [:removed_by_id, :removal_reason])
    |> put_change(:removed_at, DateTime.utc_now())
  end

  # Validate content based on post type
  defp validate_post_type_content(changeset) do
    post_type = get_field(changeset, :post_type)

    case post_type do
      "text" ->
        # Text posts should have content
        changeset

      "link" ->
        changeset
        |> validate_required([:url])
        |> validate_url(:url)

      "image" ->
        changeset
        |> validate_required([:images])
        |> validate_length(:images, min: 1, max: 20)

      "poll" ->
        # Poll validation happens in Poll schema
        changeset

      _ ->
        changeset
    end
  end

  defp validate_url(changeset, field) do
    case get_field(changeset, field) do
      nil -> changeset
      url ->
        case URI.parse(url) do
          %URI{scheme: scheme} when scheme in ["http", "https"] -> changeset
          _ -> add_error(changeset, field, "must be a valid URL")
        end
    end
  end

  defp calculate_hot_score(changeset) do
    # Hot score will be calculated after insert
    put_change(changeset, :hot_score, 0.0)
  end

  # Reddit-style hot ranking algorithm
  defp calculate_hot_score_value(score, created_at) do
    epoch = ~U[2024-01-01 00:00:00Z]
    seconds = DateTime.diff(created_at, epoch)

    order = :math.log10(max(abs(score), 1))
    sign = if score > 0, do: 1, else: if(score < 0, do: -1, else: 0)

    sign * order + seconds / 45000
  end
end
