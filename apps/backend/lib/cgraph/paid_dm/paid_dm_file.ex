defmodule CGraph.PaidDm.PaidDmFile do
  @moduledoc """
  Schema for paid DM file attachments.

  Tracks files sent between users that require node payment to unlock.
  Files expire after 72 hours if not paid for.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @statuses ~w(pending paid expired refunded)

  schema "paid_dm_files" do
    belongs_to :sender, CGraph.Accounts.User, foreign_key: :sender_id
    belongs_to :receiver, CGraph.Accounts.User, foreign_key: :receiver_id

    field :file_url, :string
    field :file_type, :string
    field :nodes_required, :integer
    field :status, :string, default: "pending"
    field :expires_at, :utc_datetime

    timestamps()
  end

  @required_fields ~w(sender_id receiver_id file_url file_type nodes_required)a
  @optional_fields ~w(status expires_at)a

  @doc false
  def changeset(paid_dm_file, attrs) do
    paid_dm_file
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, @statuses)
    |> validate_number(:nodes_required, greater_than: 0)
    |> foreign_key_constraint(:sender_id)
    |> foreign_key_constraint(:receiver_id)
  end
end
