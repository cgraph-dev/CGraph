defmodule CGraph.Messaging.SecretConversation do
  @moduledoc """
  Schema for secret (Telegram-style) conversations.

  Secret chats are device-bound, never synced across devices, and support
  mandatory E2EE with self-destruct timers. Only one active secret chat
  can exist per user pair at a time.

  ## Statuses

  - `active` — chat is live and messages can be exchanged
  - `terminated` — one participant destroyed the chat (all messages hard-deleted)
  - `expired` — system-terminated (e.g., inactivity cleanup)
  """
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @statuses ~w(active terminated expired)
  @valid_timers [nil, 5, 30, 60, 300, 3600, 86400, 604_800]

  schema "secret_conversations" do
    field :status, :string, default: "active"
    field :self_destruct_seconds, :integer
    field :initiator_device_id, :string
    field :recipient_device_id, :string
    field :initiator_fingerprint, :string
    field :recipient_fingerprint, :string
    field :terminated_at, :utc_datetime_usec
    field :expires_at, :utc_datetime_usec
    field :ghost_initiator, :boolean, default: false
    field :ghost_recipient, :boolean, default: false
    field :alias_initiator, :string
    field :alias_recipient, :string
    field :secret_theme_id, :string
    field :panic_wipe_initiator, :boolean, default: false
    field :panic_wipe_recipient, :boolean, default: false
    belongs_to :terminated_by_user, CGraph.Accounts.User, foreign_key: :terminated_by

    belongs_to :initiator, CGraph.Accounts.User
    belongs_to :recipient, CGraph.Accounts.User

    has_many :secret_messages, CGraph.Messaging.SecretMessage

    timestamps()
  end

  @required_fields ~w(initiator_id recipient_id)a
  @optional_fields ~w(status self_destruct_seconds initiator_device_id recipient_device_id
                       initiator_fingerprint recipient_fingerprint terminated_at terminated_by
                       expires_at ghost_initiator ghost_recipient alias_initiator alias_recipient
                       secret_theme_id panic_wipe_initiator panic_wipe_recipient)a

  @doc "Changeset for creating a secret conversation."
  def changeset(conversation, attrs) do
    conversation
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, @statuses)
    |> validate_length(:alias_initiator, max: 50)
    |> validate_length(:alias_recipient, max: 50)
    |> validate_length(:secret_theme_id, max: 50)
    |> validate_different_users()
    |> foreign_key_constraint(:initiator_id)
    |> foreign_key_constraint(:recipient_id)
    |> unique_constraint([:initiator_id, :recipient_id],
      name: :secret_conversations_active_pair_index,
      message: "an active secret chat already exists with this user"
    )
  end

  @doc "Changeset for updating self-destruct timer."
  def timer_changeset(conversation, seconds) do
    conversation
    |> change(%{self_destruct_seconds: seconds})
    |> validate_inclusion(:self_destruct_seconds, @valid_timers,
      message: "must be one of: nil, 5, 30, 60, 300, 3600, 86400, 604800"
    )
  end

  @doc "Changeset for terminating a secret conversation."
  def terminate_changeset(conversation, terminated_by_id) do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    conversation
    |> change(%{
      status: "terminated",
      terminated_at: now,
      terminated_by: terminated_by_id
    })
  end

  @doc "Returns valid self-destruct timer values."
  def valid_timers, do: @valid_timers

  @doc "Returns valid statuses."
  def statuses, do: @statuses

  @doc "Checks if a user is a participant in this conversation."
  def participant?(%__MODULE__{initiator_id: uid}, uid), do: true
  def participant?(%__MODULE__{recipient_id: uid}, uid), do: true
  def participant?(_, _), do: false

  defp validate_different_users(changeset) do
    initiator = get_field(changeset, :initiator_id)
    recipient = get_field(changeset, :recipient_id)

    if initiator && recipient && initiator == recipient do
      add_error(changeset, :recipient_id, "cannot create a secret chat with yourself")
    else
      changeset
    end
  end
end
