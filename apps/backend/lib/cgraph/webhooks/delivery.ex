defmodule CGraph.Webhooks.Delivery do
  @moduledoc """
  Ecto schema for webhook delivery attempts.

  Tracks each delivery attempt including status, response, retries,
  and latency for audit and debugging purposes.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :string, autogenerate: false}
  @timestamps_opts [type: :utc_datetime_usec]

  @statuses ~w(pending sending success failed)

  @derive {Jason.Encoder, only: [
    :id, :endpoint_id, :event_id, :event_type, :status,
    :attempts, :response_code, :error, :latency_ms,
    :last_attempt_at, :next_retry_at, :inserted_at
  ]}

  schema "webhook_deliveries" do
    field :event_id, :string
    field :event_type, :string
    field :payload, :map
    field :status, :string, default: "pending"
    field :attempts, :integer, default: 0
    field :max_attempts, :integer, default: 5
    field :last_attempt_at, :utc_datetime_usec
    field :next_retry_at, :utc_datetime_usec
    field :response_code, :integer
    field :response_body, :string
    field :error, :string
    field :latency_ms, :integer

    belongs_to :endpoint, CGraph.Webhooks.Endpoint, type: :string

    timestamps()
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(delivery, attrs) do
    delivery
    |> cast(attrs, [
      :id, :endpoint_id, :event_id, :event_type, :payload, :status,
      :attempts, :max_attempts, :last_attempt_at, :next_retry_at,
      :response_code, :response_body, :error, :latency_ms
    ])
    |> validate_required([:id, :endpoint_id, :event_id, :event_type, :payload])
    |> validate_inclusion(:status, @statuses)
    |> foreign_key_constraint(:endpoint_id)
  end
end
