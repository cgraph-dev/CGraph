defmodule CGraph.Pulse.PulseScore do
  @moduledoc "Schema for per-forum Pulse reputation scores."
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "pulse_scores" do
    field :score, :integer, default: 0
    field :tier, :string, default: "newcomer"
    belongs_to :user, CGraph.Accounts.User
    belongs_to :forum, CGraph.Forums.Forum
    timestamps(type: :utc_datetime)
  end

  def changeset(score, attrs) do
    score
    |> cast(attrs, [:score, :tier, :user_id, :forum_id])
    |> validate_required([:user_id, :forum_id])
    |> validate_number(:score, greater_than_or_equal_to: 0)
    |> unique_constraint([:user_id, :forum_id])
  end
end
