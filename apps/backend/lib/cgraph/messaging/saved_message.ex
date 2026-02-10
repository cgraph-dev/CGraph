defmodule CGraph.Messaging.SavedMessage do
  @moduledoc """
  Schema for user-saved (bookmarked) messages.

  Allows users to save/bookmark messages from any conversation or channel
  for quick reference later. Each user can save a message at most once
  (enforced by unique constraint on user_id + message_id).
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "saved_messages" do
    belongs_to :user, CGraph.Accounts.User
    belongs_to :message, CGraph.Messaging.Message

    field :note, :string
    field :saved_at, :utc_datetime_usec

    timestamps()
  end

  @doc "Changeset for creating a saved message."
  def changeset(saved_message, attrs) do
    saved_message
    |> cast(attrs, [:user_id, :message_id, :note])
    |> validate_required([:user_id, :message_id])
    |> put_saved_at()
    |> unique_constraint([:user_id, :message_id],
      name: :saved_messages_user_id_message_id_index,
      message: "message already saved"
    )
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:message_id)
  end

  defp put_saved_at(changeset) do
    if get_field(changeset, :saved_at) do
      changeset
    else
      put_change(changeset, :saved_at, DateTime.utc_now() |> DateTime.truncate(:microsecond))
    end
  end
end
