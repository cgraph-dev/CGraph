defmodule CGraph.Messaging.DeliveryReceipt do
  @moduledoc """
  Delivery receipts for messages.

  Tracks the full message lifecycle:
  - **sent**: Server accepted the message (single check ✓)
  - **delivered**: Message reached recipient's device (double check ✓✓)
  - **read**: Recipient opened the conversation (blue check ✓✓)

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────┐
  │              Message Delivery State Machine                  │
  ├─────────────────────────────────────────────────────────────┤
  │                                                              │
  │  [sent] ──────► [delivered] ──────► [read]                  │
  │    ✓                ✓✓               ✓✓ (blue)             │
  │    │                 │                 │                     │
  │  Server           Device            User                    │
  │  accepted         received          opened                  │
  │                                                              │
  │  Tracked by:      Tracked by:       Tracked by:             │
  │  insert_at        client ACK        ReadReceipt             │
  │                   via WebSocket     module                  │
  └─────────────────────────────────────────────────────────────┘
  ```

  Used in combination with ReadReceipt for the full triple-check system.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "delivery_receipts" do
    field :status, Ecto.Enum, values: [:sent, :delivered, :failed], default: :sent
    field :delivered_at, :utc_datetime_usec
    field :device_id, :string
    field :platform, :string  # "ios", "android", "web", "desktop"
    field :failure_reason, :string

    belongs_to :message, CGraph.Messaging.Message
    belongs_to :recipient, CGraph.Accounts.User

    timestamps(updated_at: false)
  end

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(receipt, attrs) do
    receipt
    |> cast(attrs, [:message_id, :recipient_id, :status, :delivered_at, :device_id, :platform, :failure_reason])
    |> validate_required([:message_id, :recipient_id, :status])
    |> validate_inclusion(:platform, ~w(ios android web desktop))
    |> unique_constraint([:message_id, :recipient_id, :device_id],
         name: :delivery_receipts_message_recipient_device_idx)
    |> foreign_key_constraint(:message_id)
    |> foreign_key_constraint(:recipient_id)
  end

  @spec mark_delivered_changeset(%__MODULE__{}) :: Ecto.Changeset.t()
  def mark_delivered_changeset(receipt) do
    receipt
    |> change(%{
      status: :delivered,
      delivered_at: DateTime.utc_now()
    })
  end
end
