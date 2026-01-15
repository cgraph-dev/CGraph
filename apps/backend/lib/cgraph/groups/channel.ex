defmodule CGraph.Groups.Channel do
  @moduledoc """
  Channel within a group.

  Supports:
  - Text channels
  - Voice channels (WebRTC) [FUTURE: Real-time voice implementation pending]
  - Announcement channels (read-only for most users)
  - Stage channels [FUTURE: Stage/speaker events pending]

  ## Voice Channel Implementation Status

  Voice channel types ("voice", "stage") are defined but not yet fully implemented.
  Future implementation will include:
  - WebRTC signaling via Phoenix Channels
  - SFU/MCU integration for multi-party calls
  - Speaking indicators and voice activity detection
  - Screen sharing support
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :name, :topic, :channel_type, :position, :is_nsfw,
    :group_id, :category_id, :inserted_at
  ]}

  # Channel types:
  # - "text": Standard text chat channel (fully implemented)
  # - "voice": Voice/video channel [FUTURE: WebRTC integration pending]
  # - "announcement": Read-only channel for announcements (fully implemented)
  # - "stage": Speaker/audience events [FUTURE: Stage events pending]
  @channel_types ["text", "voice", "announcement", "stage"]

  schema "channels" do
    field :name, :string
    field :topic, :string
    field :channel_type, :string, default: "text"
    field :position, :integer, default: 0
    field :is_nsfw, :boolean, default: false

    # Rate limiting per channel
    field :slow_mode_seconds, :integer, default: 0
    field :rate_limit_per_user, :integer

    # Soft delete
    field :deleted_at, :utc_datetime

    # Associations
    belongs_to :group, CGraph.Groups.Group
    belongs_to :category, CGraph.Groups.ChannelCategory

    has_many :messages, CGraph.Messaging.Message
    has_many :permission_overwrites, CGraph.Groups.PermissionOverwrite
    has_many :pinned_messages, CGraph.Groups.PinnedMessage

    timestamps()
  end

  @doc """
  Create a new channel.
  """
  def changeset(channel, attrs) do
    channel
    |> cast(attrs, [
      :name, :topic, :channel_type, :position, :is_nsfw,
      :slow_mode_seconds, :rate_limit_per_user, :group_id, :category_id
    ])
    |> validate_required([:name, :group_id])
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:topic, max: 1024)
    |> validate_inclusion(:channel_type, @channel_types)
    |> validate_number(:slow_mode_seconds, greater_than_or_equal_to: 0, less_than_or_equal_to: 21_600)
    |> format_channel_name()
    |> foreign_key_constraint(:group_id)
    |> foreign_key_constraint(:category_id)
  end

  @doc """
  Update channel settings.
  """
  def update_changeset(channel, attrs) do
    channel
    |> cast(attrs, [:name, :topic, :position, :is_nsfw, :slow_mode_seconds, :category_id])
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:topic, max: 1024)
    |> format_channel_name()
  end

  # Discord-style channel names: lowercase, hyphens instead of spaces
  defp format_channel_name(changeset) do
    case get_change(changeset, :name) do
      nil -> changeset
      name ->
        formatted = name
        |> String.downcase()
        |> String.replace(~r/[^\w\s-]/, "")
        |> String.replace(~r/\s+/, "-")
        |> String.slice(0, 100)
        put_change(changeset, :name, formatted)
    end
  end
end
