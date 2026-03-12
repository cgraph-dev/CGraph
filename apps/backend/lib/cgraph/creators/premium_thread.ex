defmodule CGraph.Creators.PremiumThread do
  @moduledoc """
  Schema for threads marked as premium content by a creator.

  Premium threads require Node tokens to access or are restricted
  to subscribers of the creator's subscription tiers.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  schema "premium_threads" do
    belongs_to :thread, CGraph.Forums.Thread
    belongs_to :creator, CGraph.Accounts.User

    field :price_nodes, :integer
    field :subscriber_only, :boolean, default: false
    field :preview_length, :integer, default: 200

    timestamps()
  end

  @required_fields ~w(thread_id creator_id price_nodes)a
  @optional_fields ~w(subscriber_only preview_length)a

  def changeset(premium_thread, attrs) do
    premium_thread
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_number(:price_nodes, greater_than: 0)
    |> validate_number(:preview_length, greater_than_or_equal_to: 0)
    |> unique_constraint(:thread_id)
    |> foreign_key_constraint(:thread_id)
    |> foreign_key_constraint(:creator_id)
  end
end
