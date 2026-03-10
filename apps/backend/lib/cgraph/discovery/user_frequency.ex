defmodule CGraph.Discovery.UserFrequency do
  @moduledoc "Schema for user topic frequency weights."
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  @foreign_key_type :binary_id

  schema "user_frequencies" do
    belongs_to :user, CGraph.Accounts.User, primary_key: true
    belongs_to :topic, CGraph.Discovery.Topic, primary_key: true
    field :weight, :integer, default: 50

    timestamps(type: :utc_datetime)
  end

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(frequency, attrs) do
    frequency
    |> cast(attrs, [:user_id, :topic_id, :weight])
    |> validate_required([:user_id, :topic_id])
    |> validate_number(:weight, greater_than_or_equal_to: 0, less_than_or_equal_to: 100)
    |> unique_constraint([:user_id, :topic_id])
  end
end
