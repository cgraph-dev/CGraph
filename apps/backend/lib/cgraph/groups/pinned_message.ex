defmodule CGraph.Groups.PinnedMessage do
  @moduledoc """
  Schema for pinned messages in channels.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "channel_pinned_messages" do
    belongs_to :channel, CGraph.Groups.Channel
    belongs_to :message, CGraph.Messaging.Message
    belongs_to :pinned_by, CGraph.Accounts.User

    field :position, :integer

    timestamps()
  end

  def changeset(pinned_message, attrs) do
    pinned_message
    |> cast(attrs, [:channel_id, :message_id, :pinned_by_id, :position])
    |> validate_required([:channel_id, :message_id, :pinned_by_id])
    |> unique_constraint([:channel_id, :message_id])
    |> foreign_key_constraint(:channel_id)
    |> foreign_key_constraint(:message_id)
    |> foreign_key_constraint(:pinned_by_id)
  end
end
