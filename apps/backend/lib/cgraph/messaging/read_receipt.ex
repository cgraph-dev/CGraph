defmodule Cgraph.Messaging.ReadReceipt do
  @moduledoc """
  Read receipts for messages.
  
  Tracks when users read messages for delivery confirmation.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "read_receipts" do
    field :read_at, :utc_datetime

    belongs_to :message, Cgraph.Messaging.Message
    belongs_to :user, Cgraph.Accounts.User

    timestamps(updated_at: false)
  end

  @doc """
  Create a read receipt.
  """
  def changeset(read_receipt, attrs) do
    read_receipt
    |> cast(attrs, [:message_id, :user_id])
    |> validate_required([:message_id, :user_id])
    |> put_change(:read_at, DateTime.utc_now())
    |> unique_constraint([:message_id, :user_id])
    |> foreign_key_constraint(:message_id)
    |> foreign_key_constraint(:user_id)
  end
end
