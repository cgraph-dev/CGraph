defmodule CGraph.Pulse.PulseTransaction do
  @moduledoc "Schema for Pulse reputation transactions (votes, decay)."
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "pulse_transactions" do
    field :content_id, :binary_id
    field :content_type, :string
    field :raw_amount, :integer
    field :weighted_amount, :float
    field :transaction_type, :string
    belongs_to :to_user, CGraph.Accounts.User, foreign_key: :to_user_id
    belongs_to :from_user, CGraph.Accounts.User, foreign_key: :from_user_id
    belongs_to :forum, CGraph.Forums.Forum
    timestamps(type: :utc_datetime)
  end

  @valid_types ~w(resonate fade not_for_me decay)

  def changeset(tx, attrs) do
    tx
    |> cast(attrs, [:to_user_id, :from_user_id, :forum_id, :content_id, :content_type, :raw_amount, :weighted_amount, :transaction_type])
    |> validate_required([:to_user_id, :forum_id, :raw_amount, :weighted_amount, :transaction_type])
    |> validate_inclusion(:transaction_type, @valid_types)
  end
end
