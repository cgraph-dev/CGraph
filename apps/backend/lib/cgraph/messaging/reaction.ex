defmodule CGraph.Messaging.Reaction do
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

  # Extended emoji set - allow common reaction emojis
  # Quick reactions + additional popular emojis
  @allowed_emoji [
    # Quick reactions
    "❤️", "👍", "😂", "😮", "😢", "🔥",
    # Smileys
    "😀", "😃", "😄", "😁", "😅", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘",
    "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
    "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥",
    # Gestures
    "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞", "🤟", "🤘", "👌", "🤌", "🤏",
    "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🦾", "🖕", "✍️",
    # Hearts
    "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗",
    "💖", "💘", "💝", "💟", "♥️",
    # Symbols
    "✨", "⭐", "🌟", "💫", "💯", "💢", "💥", "💦", "💨", "🕳️", "💣", "💬", "👁️‍🗨️", "🗨️",
    "🗯️", "💭", "💤", "🎵", "🎶",
    # Additional common reactions
    "😡", "🎉", "👀", "🥲", "🥺", "😭", "🤯", "🥳", "😎", "🤩", "😱", "🤮", "🤢", "💀",
    "☠️", "🤡", "👽", "👻", "💩", "🙈", "🙉", "🙊"
  ]

  schema "reactions" do
    field :emoji, :string

    belongs_to :message, CGraph.Messaging.Message
    belongs_to :user, CGraph.Accounts.User

    timestamps(updated_at: false)
  end

  @doc """
  Add a reaction.
  """
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(reaction, attrs) do
    reaction
    |> cast(attrs, [:emoji, :message_id, :user_id])
    |> validate_required([:emoji, :message_id, :user_id])
    |> validate_length(:emoji, min: 1, max: 32)
    |> unique_constraint([:message_id, :user_id, :emoji])
    |> foreign_key_constraint(:message_id)
    |> foreign_key_constraint(:user_id)
  end

  @doc """
  Returns the list of allowed emoji.
  """
  @spec allowed_emoji() :: [String.t()]
  def allowed_emoji, do: @allowed_emoji
end
