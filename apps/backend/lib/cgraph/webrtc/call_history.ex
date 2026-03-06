defmodule CGraph.WebRTC.CallHistory do
  @moduledoc """
  Ecto schema for persisted call history records.

  Records details of completed voice/video calls for user call history,
  analytics, and moderation purposes.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :room_id, :type, :creator_id, :group_id, :state,
    :participant_ids, :max_participants, :started_at, :ended_at,
    :duration_seconds, :quality_summary, :end_reason, :missed_seen,
    :conversation_id, :inserted_at
  ]}

  schema "call_history" do
    field :room_id, :string
    field :type, :string, default: "audio"
    field :state, :string, default: "ended"
    field :participant_ids, {:array, :binary_id}, default: []
    field :max_participants, :integer, default: 0
    field :started_at, :utc_datetime_usec
    field :ended_at, :utc_datetime_usec
    field :duration_seconds, :integer
    field :quality_summary, :map, default: %{}
    field :end_reason, :string
    field :missed_seen, :boolean, default: false

    belongs_to :creator, CGraph.Accounts.User
    belongs_to :group, CGraph.Groups.Group
    belongs_to :conversation, CGraph.Messaging.Conversation

    timestamps()
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(call, attrs) do
    call
    |> cast(attrs, [
      :room_id, :type, :creator_id, :group_id, :state,
      :participant_ids, :max_participants, :started_at, :ended_at,
      :duration_seconds, :quality_summary, :end_reason, :missed_seen,
      :conversation_id
    ])
    |> validate_required([:room_id, :type, :state])
    |> validate_inclusion(:type, ~w(audio video screen_share))
    |> validate_inclusion(:state, ~w(waiting active ended ringing))
    |> validate_inclusion(:end_reason, ~w(completed rejected missed timeout failed busy), message: "invalid end reason")
  end
end
