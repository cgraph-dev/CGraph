defmodule CGraph.Messaging.Reaction do
  @moduledoc """
  Message reactions (emoji).

  Users can react to messages with standard emoji from the full
  Unicode 16.0 catalog. Validation is delegated to `CGraph.Messaging.Emoji`
  which supports skin tone variants and the complete emoji set.

  Each user can only have one of each emoji per message.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Messaging.Emoji

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "reactions" do
    field :emoji, :string

    belongs_to :message, CGraph.Messaging.Message
    belongs_to :user, CGraph.Accounts.User

    timestamps(updated_at: false)
  end

  @doc """
  Add a reaction.
  Validates emoji against the full Unicode 16.0 emoji catalog.
  """
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(reaction, attrs) do
    reaction
    |> cast(attrs, [:emoji, :message_id, :user_id])
    |> validate_required([:emoji, :message_id, :user_id])
    |> validate_length(:emoji, min: 1, max: 32)
    |> validate_emoji()
    |> unique_constraint([:message_id, :user_id, :emoji])
    |> foreign_key_constraint(:message_id)
    |> foreign_key_constraint(:user_id)
  end

  @doc """
  Returns whether the given emoji is valid per the Unicode catalog.
  Delegates to `CGraph.Messaging.Emoji.valid_emoji?/1`.
  """
  @spec valid_emoji?(String.t()) :: boolean()
  def valid_emoji?(emoji), do: Emoji.valid_emoji?(emoji)

  # Private: Changeset validator using the Emoji module
  defp validate_emoji(changeset) do
    validate_change(changeset, :emoji, fn :emoji, value ->
      if Emoji.valid_emoji?(value) do
        []
      else
        [emoji: "is not a valid Unicode emoji"]
      end
    end)
  end
end
