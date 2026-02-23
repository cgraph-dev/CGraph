defmodule CGraph.Gamification.PrestigeReward do
  @moduledoc "Schema for prestige level rewards."
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "prestige_rewards" do
    field :prestige_level, :integer
    field :reward_type, :string
    field :reward_id, :binary_id
    field :reward_amount, :integer, default: 0
    field :name, :string
    field :description, :string
    field :preview_url, :string
    field :is_exclusive, :boolean, default: false
    field :sort_order, :integer, default: 0

    timestamps(type: :utc_datetime)
  end

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(reward, attrs) do
    reward
    |> cast(attrs, [:prestige_level, :reward_type, :reward_id, :reward_amount, :name, :description, :preview_url, :is_exclusive, :sort_order])
    |> validate_required([:prestige_level, :reward_type])
  end
end
