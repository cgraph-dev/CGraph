defmodule CGraph.Animations.Lottie do
  @moduledoc """
  Lottie animation asset schema and context functions.

  Stores metadata for Lottie-based emoji animations sourced from the
  Noto Emoji Animation CDN (Google Fonts). Each record maps a Unicode
  codepoint to its CDN URLs for Lottie JSON, WebP, and GIF formats.

  ## Asset Types

    * `"emoji"` — Standard animated emoji (Noto Emoji set)
    * `"border"` — Animated avatar borders (future)
    * `"effect"` — Chat message effects (future)
    * `"sticker"` — Animated sticker packs (future)

  ## Sources

    * `"noto"` — Google Noto Emoji Animation (open source)
    * `"custom"` — User/org uploaded animations
    * `"premium"` — Premium tier animations
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias CGraph.Repo

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @required_fields ~w(codepoint name asset_type source)a
  @optional_fields ~w(emoji category subcategory keywords lottie_url webp_url gif_url
                      file_size duration_ms is_active)a

  schema "lottie_assets" do
    field :codepoint, :string
    field :emoji, :string
    field :name, :string
    field :category, :string
    field :subcategory, :string
    field :keywords, {:array, :string}, default: []
    field :lottie_url, :string
    field :webp_url, :string
    field :gif_url, :string
    field :file_size, :integer
    field :duration_ms, :integer
    field :asset_type, :string, default: "emoji"
    field :source, :string, default: "noto"
    field :is_active, :boolean, default: true

    timestamps(type: :utc_datetime)
  end

  # ============================================================================
  # Changesets
  # ============================================================================

  @doc "Default changeset for updating a Lottie asset."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(lottie, attrs) do
    lottie
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:asset_type, ~w(emoji border effect sticker))
    |> validate_inclusion(:source, ~w(noto custom premium))
    |> validate_number(:file_size, greater_than_or_equal_to: 0)
    |> validate_number(:duration_ms, greater_than_or_equal_to: 0)
    |> unique_constraint([:codepoint, :asset_type])
  end

  @doc "Changeset for creating a new Lottie asset."
  @spec create_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def create_changeset(lottie \\ %__MODULE__{}, attrs) do
    lottie
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:asset_type, ~w(emoji border effect sticker))
    |> validate_inclusion(:source, ~w(noto custom premium))
    |> validate_number(:file_size, greater_than_or_equal_to: 0)
    |> validate_number(:duration_ms, greater_than_or_equal_to: 0)
    |> unique_constraint([:codepoint, :asset_type])
  end

  # ============================================================================
  # Query Helpers
  # ============================================================================

  @doc "Query: filter by codepoint."
  @spec by_codepoint(String.t()) :: Ecto.Query.t()
  def by_codepoint(codepoint) do
    from(l in __MODULE__, where: l.codepoint == ^codepoint)
  end

  @doc "Query: filter by category."
  @spec by_category(String.t()) :: Ecto.Query.t()
  def by_category(category) do
    from(l in __MODULE__, where: l.category == ^category)
  end

  @doc "Query: only active assets."
  @spec active() :: Ecto.Query.t()
  def active do
    from(l in __MODULE__, where: l.is_active == true)
  end

  @doc "Query: search by name or keywords."
  @spec search(String.t()) :: Ecto.Query.t()
  def search(query) do
    pattern = "%#{query}%"

    from(l in __MODULE__,
      where:
        ilike(l.name, ^pattern) or
          fragment("EXISTS (SELECT 1 FROM unnest(?) kw WHERE kw ILIKE ?)", l.keywords, ^pattern)
    )
  end

  # ============================================================================
  # Context Functions
  # ============================================================================

  @doc "Get a single animation by ID."
  @spec get_animation(Ecto.UUID.t()) :: {:ok, %__MODULE__{}} | {:error, :not_found}
  def get_animation(id) do
    case Repo.get(__MODULE__, id) do
      nil -> {:error, :not_found}
      lottie -> {:ok, lottie}
    end
  end

  @doc "Get an animation by its Unicode codepoint."
  @spec get_by_codepoint(String.t()) :: {:ok, %__MODULE__{}} | {:error, :not_found}
  def get_by_codepoint(codepoint) do
    case codepoint |> by_codepoint() |> Repo.one() do
      nil -> {:error, :not_found}
      lottie -> {:ok, lottie}
    end
  end

  @doc "List all animations in a given category."
  @spec list_by_category(String.t(), keyword()) :: [%__MODULE__{}]
  def list_by_category(category, opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)

    category
    |> by_category()
    |> where([l], l.is_active == true)
    |> limit(^limit)
    |> order_by([l], asc: l.name)
    |> Repo.all()
  end

  @doc "Search animations by name or keyword."
  @spec search(String.t(), keyword()) :: [%__MODULE__{}]
  def search(query, opts) do
    limit = Keyword.get(opts, :limit, 50)

    query
    |> search()
    |> where([l], l.is_active == true)
    |> limit(^limit)
    |> order_by([l], asc: l.name)
    |> Repo.all()
  end

  @doc "Create a new Lottie asset."
  @spec create(map()) :: {:ok, %__MODULE__{}} | {:error, Ecto.Changeset.t()}
  def create(attrs) do
    %__MODULE__{}
    |> create_changeset(attrs)
    |> Repo.insert()
  end

  @doc "Update an existing Lottie asset."
  @spec update(%__MODULE__{}, map()) :: {:ok, %__MODULE__{}} | {:error, Ecto.Changeset.t()}
  def update(%__MODULE__{} = lottie, attrs) do
    lottie
    |> changeset(attrs)
    |> Repo.update()
  end
end
