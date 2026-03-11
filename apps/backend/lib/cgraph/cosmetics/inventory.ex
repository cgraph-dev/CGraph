defmodule CGraph.Cosmetics.Inventory do
  @moduledoc """
  Unified polymorphic inventory for all cosmetic items.

  Tracks which cosmetic items a user owns, how they were obtained,
  and whether they are currently equipped. Supplements the legacy
  per-type join tables (user_avatar_borders, user_titles, etc.)
  during the dual-read migration period.

  ## Fields

    * `item_type` — the cosmetic category (validated string)
    * `item_id` — UUID reference to the specific cosmetic item
    * `equipped_at` — when the item was equipped (nil if not equipped)
    * `obtained_at` — when the user acquired the item
    * `obtained_via` — acquisition channel (purchase, unlock, reward, etc.)
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @valid_item_types ~w(border title badge nameplate profile_effect profile_frame chat_effect profile_theme name_style)
  @valid_obtained_via ~w(purchase unlock reward gift default achievement event level)

  schema "user_inventory" do
    field :item_type, :string
    field :item_id, :binary_id
    field :equipped_at, :utc_datetime_usec
    field :obtained_at, :utc_datetime_usec
    field :obtained_via, :string

    belongs_to :user, CGraph.Accounts.User

    timestamps()
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(inventory, attrs) do
    inventory
    |> cast(attrs, [:user_id, :item_type, :item_id, :equipped_at, :obtained_at, :obtained_via])
    |> validate_required([:user_id, :item_type, :item_id, :obtained_at, :obtained_via])
    |> validate_inclusion(:item_type, @valid_item_types)
    |> validate_inclusion(:obtained_via, @valid_obtained_via)
    |> foreign_key_constraint(:user_id)
    |> unique_constraint([:user_id, :item_type, :item_id])
  end

  @doc "Returns the list of valid item types."
  @spec valid_item_types() :: [String.t()]
  def valid_item_types, do: @valid_item_types

  @doc "Returns the list of valid obtained_via values."
  @spec valid_obtained_via() :: [String.t()]
  def valid_obtained_via, do: @valid_obtained_via

  @doc "Builds a changeset for equipping/unequipping an item."
  @spec equip_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def equip_changeset(inventory, attrs) do
    inventory
    |> cast(attrs, [:equipped_at])
  end
end
