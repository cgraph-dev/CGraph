defmodule CGraph.Nodes.ReputationReward do
  @moduledoc """
  Schema for reputation_rewards table.

  Records milestone-based node rewards granted to users for reaching
  reputation thresholds (helpful votes, post counts, friend counts, account age).
  Each milestone can only be granted once per user.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "reputation_rewards" do
    belongs_to :user, CGraph.Accounts.User

    field :milestone_key, :string
    field :nodes_granted, :integer
    field :granted_at, :utc_datetime
  end

  @doc false
  def changeset(reward, attrs) do
    reward
    |> cast(attrs, [:user_id, :milestone_key, :nodes_granted, :granted_at])
    |> validate_required([:user_id, :milestone_key, :nodes_granted, :granted_at])
    |> unique_constraint([:user_id, :milestone_key])
  end
end
