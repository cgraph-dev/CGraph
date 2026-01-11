defmodule Cgraph.Gamification.Title do
  @moduledoc """
  Schema for unlockable titles that users can display.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @rarities ~w(common uncommon rare epic legendary mythic)
  @unlock_types ~w(achievement level purchase event)

  schema "titles" do
    field :slug, :string
    field :name, :string
    field :description, :string
    field :color, :string, default: "#ffffff"
    field :rarity, :string
    field :unlock_type, :string
    field :unlock_requirement, :string
    field :is_purchasable, :boolean, default: false
    field :coin_cost, :integer, default: 0
    field :sort_order, :integer, default: 0

    has_many :user_titles, Cgraph.Gamification.UserTitle

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(title, attrs) do
    title
    |> cast(attrs, [
      :slug, :name, :description, :color, :rarity, :unlock_type,
      :unlock_requirement, :is_purchasable, :coin_cost, :sort_order
    ])
    |> validate_required([:slug, :name, :rarity, :unlock_type])
    |> validate_inclusion(:rarity, @rarities)
    |> validate_inclusion(:unlock_type, @unlock_types)
    |> validate_number(:coin_cost, greater_than_or_equal_to: 0)
    |> unique_constraint(:slug)
  end

  def rarities, do: @rarities
  def unlock_types, do: @unlock_types
end
