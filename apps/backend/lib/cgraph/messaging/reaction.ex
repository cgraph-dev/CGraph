defmodule Cgraph.Messaging.Reaction do
  @moduledoc """
  Message reactions (emoji).
  
  Users can react to messages with standard emoji.
  Each user can only have one of each emoji per message.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  # Common reaction emoji
  @allowed_emoji ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥", "👀", "💯"]

  schema "reactions" do
    field :emoji, :string

    belongs_to :message, Cgraph.Messaging.Message
    belongs_to :user, Cgraph.Accounts.User

    timestamps(updated_at: false)
  end

  @doc """
  Add a reaction.
  """
  def changeset(reaction, attrs) do
    reaction
    |> cast(attrs, [:emoji, :message_id, :user_id])
    |> validate_required([:emoji, :message_id, :user_id])
    |> validate_inclusion(:emoji, @allowed_emoji)
    |> unique_constraint([:message_id, :user_id, :emoji])
    |> foreign_key_constraint(:message_id)
    |> foreign_key_constraint(:user_id)
  end

  @doc """
  Returns the list of allowed emoji.
  """
  def allowed_emoji, do: @allowed_emoji
end
