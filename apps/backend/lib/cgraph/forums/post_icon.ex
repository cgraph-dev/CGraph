defmodule CGraph.Forums.PostIcon do
  @moduledoc """
  Post Icons schema for forums.

  Post Icons are a classic forum feature allowing users to select an icon
  when creating threads or posts to visually categorize their content.

  Icons can be:
  - Global (available to all forums when forum_id is nil)
  - Forum-specific (only available in that forum)
  - Board-restricted (only available in specific boards within a forum)

  ## Examples

      # Get all active icons for a forum
      PostIcon.available_for_forum(forum_id)

      # Get icons for a specific board
      PostIcon.available_for_board(forum_id, board_id)
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias CGraph.Forums.Forum
  alias CGraph.Repo

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @type t :: %__MODULE__{
    id: binary(),
    name: String.t(),
    icon_url: String.t(),
    emoji: String.t() | nil,
    display_order: integer(),
    is_active: boolean(),
    forum_id: binary() | nil,
    board_ids: [binary()],
    usage_count: integer(),
    inserted_at: DateTime.t(),
    updated_at: DateTime.t()
  }

  schema "post_icons" do
    field :name, :string
    field :icon_url, :string
    field :emoji, :string
    field :display_order, :integer, default: 0
    field :is_active, :boolean, default: true
    field :board_ids, {:array, :binary_id}, default: []
    field :usage_count, :integer, default: 0

    belongs_to :forum, Forum

    timestamps(type: :utc_datetime)
  end

  @doc """
  Changeset for creating or updating a post icon.
  """
  @spec changeset(t() | Ecto.Changeset.t(), map()) :: Ecto.Changeset.t()
  def changeset(post_icon, attrs) do
    post_icon
    |> cast(attrs, [:name, :icon_url, :emoji, :display_order, :is_active, :forum_id, :board_ids])
    |> validate_required([:name, :icon_url])
    |> validate_length(:name, min: 1, max: 50)
    |> validate_length(:emoji, max: 10)
    |> foreign_key_constraint(:forum_id)
  end

  @doc """
  Returns all active icons available for a forum.
  This includes global icons (forum_id = nil) and forum-specific icons.
  """
  @spec available_for_forum(Ecto.UUID.t()) :: [t()]
  def available_for_forum(forum_id) do
    from(pi in __MODULE__,
      where: pi.is_active == true,
      where: is_nil(pi.forum_id) or pi.forum_id == ^forum_id,
      order_by: [asc: pi.display_order, asc: pi.name]
    )
    |> Repo.all()
  end

  @doc """
  Returns all active icons available for a specific board within a forum.
  Filters to icons that either:
  - Have no board restrictions (empty board_ids)
  - Include this board in their board_ids
  """
  @spec available_for_board(Ecto.UUID.t(), Ecto.UUID.t()) :: [t()]
  def available_for_board(forum_id, board_id) do
    from(pi in __MODULE__,
      where: pi.is_active == true,
      where: is_nil(pi.forum_id) or pi.forum_id == ^forum_id,
      where: fragment("? = '{}' OR ? = ANY(?)", pi.board_ids, ^board_id, pi.board_ids),
      order_by: [asc: pi.display_order, asc: pi.name]
    )
    |> Repo.all()
  end

  @doc """
  Returns only global icons (not forum-specific).
  """
  @spec global_icons() :: [t()]
  def global_icons do
    from(pi in __MODULE__,
      where: pi.is_active == true and is_nil(pi.forum_id),
      order_by: [asc: pi.display_order, asc: pi.name]
    )
    |> Repo.all()
  end

  @doc """
  Returns icons for a specific forum only (excluding global).
  """
  @spec forum_specific_icons(Ecto.UUID.t()) :: [t()]
  def forum_specific_icons(forum_id) do
    from(pi in __MODULE__,
      where: pi.is_active == true and pi.forum_id == ^forum_id,
      order_by: [asc: pi.display_order, asc: pi.name]
    )
    |> Repo.all()
  end

  @doc """
  Increments the usage count for an icon.
  """
  @spec increment_usage(Ecto.UUID.t()) :: {non_neg_integer(), nil | [term()]}
  def increment_usage(icon_id) do
    from(pi in __MODULE__, where: pi.id == ^icon_id)
    |> Repo.update_all(inc: [usage_count: 1])
  end

  @doc """
  Gets an icon by ID.
  """
  @spec get(Ecto.UUID.t()) :: t() | nil
  def get(id) do
    Repo.get(__MODULE__, id)
  end

  @doc """
  Gets an icon by ID, returns {:ok, icon} or {:error, :not_found}.
  """
  @spec fetch(Ecto.UUID.t()) :: {:ok, t()} | {:error, :not_found}
  def fetch(id) do
    case Repo.get(__MODULE__, id) do
      nil -> {:error, :not_found}
      icon -> {:ok, icon}
    end
  end
end
