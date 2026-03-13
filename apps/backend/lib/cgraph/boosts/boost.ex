defmodule CGraph.Boosts.Boost do
  @moduledoc """
  Schema for content boosts.

  A boost promotes a target (thread, post, or forum) with a chosen
  boost type (visibility, pinned, highlighted) for a set duration,
  paid in nodes.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @target_types ~w(thread post forum profile)
  @boost_types ~w(visibility pinned highlighted)
  @statuses ~w(active expired cancelled)

  schema "boosts" do
    belongs_to :user, CGraph.Accounts.User
    field :target_type, :string
    field :target_id, :binary_id
    field :boost_type, :string
    field :duration_hours, :integer
    field :nodes_spent, :integer
    field :started_at, :utc_datetime
    field :expires_at, :utc_datetime
    field :status, :string, default: "active"

    has_many :effects, CGraph.Boosts.BoostEffect

    timestamps()
  end

  @required ~w(user_id target_type target_id boost_type duration_hours nodes_spent started_at expires_at)a
  @optional ~w(status)a

  @doc false
  def changeset(boost, attrs) do
    boost
    |> cast(attrs, @required ++ @optional)
    |> validate_required(@required)
    |> validate_inclusion(:target_type, @target_types)
    |> validate_inclusion(:boost_type, @boost_types)
    |> validate_inclusion(:status, @statuses)
    |> validate_number(:duration_hours, greater_than: 0)
    |> validate_number(:nodes_spent, greater_than: 0)
    |> foreign_key_constraint(:user_id)
  end
end
