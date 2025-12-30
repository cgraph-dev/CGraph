defmodule Cgraph.Forums.ThreadPost do
  @moduledoc """
  ThreadPost schema representing a reply within a thread.
  
  Posts are the individual replies within a thread. The first post in a thread
  is typically the thread content itself, with subsequent posts being replies.
  
  ## Features
  - BBCode/Markdown content with HTML rendering
  - Edit tracking (count, reason, timestamp)
  - File attachments
  - Voting (upvote/downvote)
  - Quote replies (reply to specific post)
  - Moderation (hide, approve)
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :content, :content_html, :is_edited, :edit_count,
    :score, :upvotes, :downvotes, :position, :inserted_at, :updated_at
  ]}

  schema "thread_posts" do
    field :content, :string
    field :content_html, :string
    field :is_edited, :boolean, default: false
    field :edit_count, :integer, default: 0
    field :edit_reason, :string
    field :edited_at, :utc_datetime
    
    # Moderation
    field :is_hidden, :boolean, default: false
    field :is_approved, :boolean, default: true
    field :reported_count, :integer, default: 0
    
    # Attachments (JSON array)
    field :attachments, {:array, :map}, default: []
    
    # Voting
    field :score, :integer, default: 0
    field :upvotes, :integer, default: 0
    field :downvotes, :integer, default: 0
    
    # Position in thread
    field :position, :integer, default: 0
    
    # Soft delete
    field :deleted_at, :utc_datetime

    belongs_to :thread, Cgraph.Forums.Thread
    belongs_to :author, Cgraph.Accounts.User
    belongs_to :reply_to, __MODULE__
    belongs_to :edited_by, Cgraph.Accounts.User
    has_many :votes, Cgraph.Forums.PostVote, foreign_key: :post_id
    has_many :replies, __MODULE__, foreign_key: :reply_to_id

    timestamps()
  end

  @doc """
  Changeset for creating a new post.
  """
  def changeset(post, attrs) do
    post
    |> cast(attrs, [
      :content, :content_html, :attachments,
      :thread_id, :author_id, :reply_to_id, :position
    ])
    |> validate_required([:content, :thread_id, :author_id])
    |> validate_length(:content, min: 1, max: 50_000)
    |> maybe_render_html()
    |> foreign_key_constraint(:thread_id)
    |> foreign_key_constraint(:author_id)
    |> foreign_key_constraint(:reply_to_id)
  end

  @doc """
  Changeset for editing a post.
  """
  def edit_changeset(post, attrs) do
    post
    |> cast(attrs, [:content, :content_html, :edit_reason, :edited_by_id])
    |> validate_required([:content])
    |> validate_length(:content, min: 1, max: 50_000)
    |> put_change(:is_edited, true)
    |> put_change(:edited_at, DateTime.utc_now())
    |> update_change(:edit_count, &((&1 || 0) + 1))
    |> maybe_render_html()
  end

  @doc """
  Changeset for moderation actions.
  """
  def moderation_changeset(post, attrs) do
    post
    |> cast(attrs, [:is_hidden, :is_approved])
  end

  @doc """
  Changeset for updating vote scores.
  """
  def vote_changeset(post, attrs) do
    post
    |> cast(attrs, [:score, :upvotes, :downvotes])
  end

  defp maybe_render_html(changeset) do
    case get_change(changeset, :content) do
      nil -> changeset
      content ->
        html = content
          |> escape_html()
          |> String.replace("\n", "<br>")
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
