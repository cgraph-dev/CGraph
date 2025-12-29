defmodule Cgraph.Messaging.MessageEdit do
  @moduledoc """
  Edit history for messages.
  
  Stores previous versions of edited messages for transparency.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "message_edits" do
    field :previous_content, :string
    field :edit_number, :integer

    belongs_to :message, Cgraph.Messaging.Message
    belongs_to :edited_by, Cgraph.Accounts.User

    timestamps(updated_at: false)
  end

  @doc """
  Record an edit.
  """
  def changeset(edit, attrs) do
    edit
    |> cast(attrs, [:previous_content, :edit_number, :message_id, :edited_by_id])
    |> validate_required([:previous_content, :edit_number, :message_id, :edited_by_id])
    |> foreign_key_constraint(:message_id)
    |> foreign_key_constraint(:edited_by_id)
  end
end
