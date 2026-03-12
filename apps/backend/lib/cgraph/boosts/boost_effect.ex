defmodule CGraph.Boosts.BoostEffect do
  @moduledoc """
  Schema for boost effects.

  Tracks individual effects applied by a boost, including the type
  of effect, its magnitude, and when it was applied.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  schema "boost_effects" do
    belongs_to :boost, CGraph.Boosts.Boost
    field :effect_type, :string
    field :magnitude, :decimal
    field :applied_at, :utc_datetime

    timestamps()
  end

  @required ~w(boost_id effect_type magnitude applied_at)a

  @doc false
  def changeset(effect, attrs) do
    effect
    |> cast(attrs, @required)
    |> validate_required(@required)
    |> foreign_key_constraint(:boost_id)
  end
end
