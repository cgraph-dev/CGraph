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
    :duration_seconds, :inserted_at
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

    belongs_to :creator, CGraph.Accounts.User
    belongs_to :group, CGraph.Groups.Group

    timestamps()
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(call, attrs) do
    call
    |> cast(attrs, [
      :room_id, :type, :creator_id, :group_id, :state,
      :participant_ids, :max_participants, :started_at, :ended_at,
      :duration_seconds
    ])
    |> validate_required([:room_id, :type, :state])
    |> validate_inclusion(:type, ~w(audio video screen_share))
    |> validate_inclusion(:state, ~w(waiting active ended))
  end
end
