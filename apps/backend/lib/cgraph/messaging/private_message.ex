defmodule Cgraph.Messaging.PrivateMessage do
  @moduledoc """
  Schema for Private Messages (MyBB-style PM system).
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias Cgraph.Accounts.User
  alias Cgraph.Messaging.PMFolder

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "private_messages" do
    field :subject, :string
    field :content, :string
    field :is_read, :boolean, default: false
    field :read_at, :utc_datetime
    field :is_starred, :boolean, default: false
    field :is_important, :boolean, default: false
    field :reply_to_id, :binary_id

    belongs_to :sender, User
    belongs_to :recipient, User
    belongs_to :folder, PMFolder

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(sender_id recipient_id content)a
  @optional_fields ~w(subject is_read read_at is_starred is_important folder_id reply_to_id)a

  def changeset(message, attrs) do
    message
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:subject, max: 255)
    |> validate_length(:content, min: 1, max: 50_000)
    |> foreign_key_constraint(:sender_id)
    |> foreign_key_constraint(:recipient_id)
    |> foreign_key_constraint(:folder_id)
  end
end
