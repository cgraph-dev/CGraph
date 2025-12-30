defmodule Cgraph.Forums.Board do
  @moduledoc """
  Board schema representing a section/category within a forum.
  
  Boards are the organizational structure inside a forum (like MyBB's "Forums").
  They can be nested to create sub-boards for better organization.
  
  ## Features
  - Hierarchical structure (parent/child boards)
  - Custom permissions per board
  - Thread and post counts (denormalized for performance)
  - Minimum requirements to post (posts, reputation)
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :name, :slug, :description, :icon, :position, :is_locked,
    :thread_count, :post_count, :last_post_at, :inserted_at
  ]}

  schema "boards" do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :icon, :string
    field :position, :integer, default: 0
    
    # Permissions
    field :is_locked, :boolean, default: false
    field :is_hidden, :boolean, default: false
    field :min_posts_to_post, :integer, default: 0
    field :min_reputation_to_post, :integer, default: 0
    
    # Stats (denormalized)
    field :thread_count, :integer, default: 0
    field :post_count, :integer, default: 0
    field :last_post_at, :utc_datetime
    field :last_post_id, :binary_id
    field :last_thread_id, :binary_id
    
    # Soft delete
    field :deleted_at, :utc_datetime

    belongs_to :forum, Cgraph.Forums.Forum
    belongs_to :parent_board, __MODULE__
    has_many :sub_boards, __MODULE__, foreign_key: :parent_board_id
    has_many :threads, Cgraph.Forums.Thread

    timestamps()
  end

  @doc """
  Changeset for creating a new board.
  """
  def changeset(board, attrs) do
    board
    |> cast(attrs, [
      :name, :slug, :description, :icon, :position,
      :is_locked, :is_hidden, :min_posts_to_post, :min_reputation_to_post,
      :forum_id, :parent_board_id
    ])
    |> validate_required([:name, :forum_id])
    |> validate_length(:name, min: 1, max: 100)
    |> maybe_generate_slug()
    |> unique_constraint([:forum_id, :slug])
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:parent_board_id)
  end

  @doc """
  Changeset for updating board stats.
  """
  def stats_changeset(board, attrs) do
    board
    |> cast(attrs, [:thread_count, :post_count, :last_post_at, :last_post_id, :last_thread_id])
  end

  defp maybe_generate_slug(changeset) do
    case get_change(changeset, :slug) do
      nil ->
        case get_change(changeset, :name) do
          nil -> changeset
          name -> put_change(changeset, :slug, Slug.slugify(name))
        end
      _ -> changeset
    end
  end
end
