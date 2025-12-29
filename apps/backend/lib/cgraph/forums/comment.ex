defmodule Cgraph.Forums.Comment do
  @moduledoc """
  Comment schema for forum posts.
  
  Supports nested threading with parent references.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :content, :score, :upvotes, :downvotes, :depth,
    :is_edited, :author_id, :post_id, :parent_id, :inserted_at, :updated_at
  ]}

  schema "comments" do
    field :content, :string
    field :score, :integer, default: 0
    field :upvotes, :integer, default: 0
    field :downvotes, :integer, default: 0
    field :depth, :integer, default: 0  # Nesting level (max 10)

    field :is_edited, :boolean, default: false
    field :is_collapsed, :boolean, default: false  # Auto-collapse low-score

    # Moderation
    field :removed_at, :utc_datetime
    field :removed_by_id, :binary_id
    field :removal_reason, :string
    field :deleted_at, :utc_datetime

    belongs_to :author, Cgraph.Accounts.User
    belongs_to :post, Cgraph.Forums.Post
    belongs_to :parent, __MODULE__

    has_many :replies, __MODULE__, foreign_key: :parent_id
    has_many :votes, Cgraph.Forums.Vote

    timestamps()
  end

  @max_depth 10

  @doc """
  Create a new comment.
  """
  def changeset(comment, attrs) do
    comment
    |> cast(attrs, [:content, :author_id, :post_id, :parent_id])
    |> validate_required([:content, :author_id, :post_id])
    |> validate_length(:content, min: 1, max: 10_000)
    |> calculate_depth()
    |> foreign_key_constraint(:author_id)
    |> foreign_key_constraint(:post_id)
    |> foreign_key_constraint(:parent_id)
  end

  @doc """
  Edit comment content.
  """
  def edit_changeset(comment, attrs) do
    comment
    |> cast(attrs, [:content])
    |> validate_required([:content])
    |> validate_length(:content, min: 1, max: 10_000)
    |> put_change(:is_edited, true)
  end

  @doc """
  Update vote counts.
  """
  def vote_changeset(comment, upvotes, downvotes) do
    score = upvotes - downvotes

    comment
    |> change(upvotes: upvotes)
    |> change(downvotes: downvotes)
    |> change(score: score)
    |> maybe_collapse()
  end

  @doc """
  Remove a comment (moderation action).
  """
  def remove_changeset(comment, attrs) do
    comment
    |> cast(attrs, [:removed_by_id, :removal_reason])
    |> put_change(:removed_at, DateTime.utc_now())
  end

  @doc """
  Soft delete by author.
  """
  def delete_changeset(comment) do
    comment
    |> change(deleted_at: DateTime.utc_now())
    |> change(content: "[deleted]")
  end

  # Calculate depth based on parent
  defp calculate_depth(changeset) do
    case get_field(changeset, :parent_id) do
      nil -> put_change(changeset, :depth, 0)
      _parent_id ->
        # In practice, you'd look up parent depth
        # For now, this will be handled in the context
        changeset
    end
  end

  # Auto-collapse comments with very low scores
  defp maybe_collapse(changeset) do
    score = get_field(changeset, :score)
    if score < -5 do
      put_change(changeset, :is_collapsed, true)
    else
      changeset
    end
  end

  @doc """
  Maximum nesting depth.
  """
  def max_depth, do: @max_depth
end
