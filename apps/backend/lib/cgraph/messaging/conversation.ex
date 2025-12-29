defmodule Cgraph.Messaging.Conversation do
  @moduledoc """
  Direct message conversation between two users.
  
  Conversations are unique per user pair and persist across sessions.
  Supports E2E encryption with client-managed keys.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "conversations" do
    field :last_message_at, :utc_datetime
    field :is_encrypted, :boolean, default: true

    belongs_to :user_one, Cgraph.Accounts.User
    belongs_to :user_two, Cgraph.Accounts.User

    has_many :messages, Cgraph.Messaging.Message
    has_many :participants, Cgraph.Messaging.ConversationParticipant

    timestamps()
  end

  @doc """
  Create a new conversation between two users.
  """
  def changeset(conversation, attrs) do
    conversation
    |> cast(attrs, [:user_one_id, :user_two_id, :is_encrypted])
    |> validate_required([:user_one_id, :user_two_id])
    |> validate_different_users()
    |> order_user_ids()
    |> unique_constraint([:user_one_id, :user_two_id])
    |> foreign_key_constraint(:user_one_id)
    |> foreign_key_constraint(:user_two_id)
  end

  @doc """
  Update last message timestamp.
  """
  def touch_changeset(conversation) do
    change(conversation, last_message_at: DateTime.utc_now())
  end

  # Ensure user_one_id < user_two_id for consistent uniqueness
  defp order_user_ids(changeset) do
    case {get_field(changeset, :user_one_id), get_field(changeset, :user_two_id)} do
      {id1, id2} when is_binary(id1) and is_binary(id2) and id1 > id2 ->
        changeset
        |> put_change(:user_one_id, id2)
        |> put_change(:user_two_id, id1)
      _ ->
        changeset
    end
  end

  defp validate_different_users(changeset) do
    user_one = get_field(changeset, :user_one_id)
    user_two = get_field(changeset, :user_two_id)

    if user_one == user_two do
      add_error(changeset, :user_two_id, "cannot message yourself")
    else
      changeset
    end
  end
end
