defmodule CGraph.Forums.ForumRank do
  @moduledoc """
  Schema for forum rank tiers — maps score ranges to rank names, images, and colors.

  Each forum has a configurable set of ranks.  A user's score determines
  which rank badge is displayed next to their name.

  Default seed tiers: Newcomer → Regular → Veteran → Expert → Legend.
  """

  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query, warn: false

  alias CGraph.Forums.Forum
  alias CGraph.Repo

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "forum_ranks" do
    belongs_to :forum, Forum

    field :name, :string
    field :min_score, :integer
    field :max_score, :integer
    field :image_url, :string
    field :color, :string
    field :position, :integer
    field :is_default, :boolean, default: false

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(forum_id name min_score color position)a
  @optional_fields ~w(max_score image_url is_default)a

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(rank, attrs) do
    rank
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_number(:min_score, greater_than_or_equal_to: 0)
    |> validate_number(:position, greater_than_or_equal_to: 0)
    |> validate_length(:name, min: 1, max: 50)
    |> validate_format(:color, ~r/^#[0-9A-Fa-f]{6}$/, message: "must be a hex color (#RRGGBB)")
    |> foreign_key_constraint(:forum_id)
    |> unique_constraint([:forum_id, :position])
  end

  # ── Context functions ──────────────────────────────────────────────────

  @doc "Create a new rank for a forum."
  @spec create_rank(String.t(), map()) :: {:ok, %__MODULE__{}} | {:error, Ecto.Changeset.t()}
  def create_rank(forum_id, attrs) do
    %__MODULE__{}
    |> changeset(Map.put(attrs, :forum_id, forum_id))
    |> Repo.insert()
  end

  @doc "Update an existing rank."
  @spec update_rank(%__MODULE__{}, map()) :: {:ok, %__MODULE__{}} | {:error, Ecto.Changeset.t()}
  def update_rank(rank, attrs) do
    rank
    |> changeset(attrs)
    |> Repo.update()
  end

  @doc "Delete a rank."
  @spec delete_rank(%__MODULE__{}) :: {:ok, %__MODULE__{}} | {:error, Ecto.Changeset.t()}
  def delete_rank(rank) do
    Repo.delete(rank)
  end

  @doc "List all ranks for a forum, ordered by position."
  @spec list_ranks(String.t()) :: [%__MODULE__{}]
  def list_ranks(forum_id) do
    from(r in __MODULE__,
      where: r.forum_id == ^forum_id,
      order_by: [asc: r.position]
    )
    |> Repo.all()
  end

  @doc "Get the rank that matches a given score for a forum."
  @spec get_rank_for_score(String.t(), integer()) :: %__MODULE__{} | nil
  def get_rank_for_score(forum_id, score) do
    from(r in __MODULE__,
      where: r.forum_id == ^forum_id,
      where: r.min_score <= ^score,
      where: is_nil(r.max_score) or r.max_score >= ^score,
      order_by: [desc: r.min_score],
      limit: 1
    )
    |> Repo.one()
  end

  @doc "Seed default ranks for a forum (idempotent)."
  @spec seed_default_ranks(String.t()) :: {:ok, non_neg_integer()}
  def seed_default_ranks(forum_id) do
    existing = list_ranks(forum_id)
    if existing != [] do
      {:ok, 0}
    else
      defaults = [
        %{name: "Newcomer", min_score: 0, max_score: 49,  color: "#9CA3AF", position: 0, is_default: true},
        %{name: "Regular",  min_score: 50, max_score: 199, color: "#60A5FA", position: 1, is_default: false},
        %{name: "Veteran",  min_score: 200, max_score: 499, color: "#34D399", position: 2, is_default: false},
        %{name: "Expert",   min_score: 500, max_score: 999, color: "#A78BFA", position: 3, is_default: false},
        %{name: "Legend",    min_score: 1000, max_score: nil, color: "#FBBF24", position: 4, is_default: false}
      ]

      Enum.each(defaults, fn rank_attrs ->
        create_rank(forum_id, rank_attrs)
      end)

      {:ok, length(defaults)}
    end
  end
end
