defmodule CGraph.Gamification.XpTransaction do
  @moduledoc """
  Schema for tracking XP gains and level-ups.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @sources ~w(message post comment achievement quest daily_login streak forum_join vote received_vote profile_complete friend_added admin)

  schema "xp_transactions" do
    belongs_to :user, CGraph.Accounts.User

    field :amount, :integer
    field :total_after, :integer
    field :level_after, :integer
    field :source, :string
    field :description, :string
    field :multiplier, :decimal, default: Decimal.new("1.0")
    field :reference_type, :string
    field :reference_id, :binary_id

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(transaction, attrs) do
    transaction
    |> cast(attrs, [
      :user_id, :amount, :total_after, :level_after, :source, :description,
      :multiplier, :reference_type, :reference_id
    ])
    |> validate_required([:user_id, :amount, :total_after, :level_after, :source])
    |> validate_inclusion(:source, @sources)
    |> validate_number(:amount, greater_than: 0)
    |> foreign_key_constraint(:user_id)
  end

  def sources, do: @sources
end
