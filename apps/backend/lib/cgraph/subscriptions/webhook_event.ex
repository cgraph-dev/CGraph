defmodule CGraph.Subscriptions.WebhookEvent do
  @moduledoc """
  Schema for tracking processed Stripe webhook events.

  Provides idempotency by storing the `stripe_event_id` with a unique index.
  Duplicate events are detected via the unique constraint on `stripe_event_id`.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @timestamps_opts [type: :utc_datetime_usec]

  schema "webhook_events" do
    field :stripe_event_id, :string
    field :event_type, :string
    field :processed_at, :utc_datetime
    field :payload, :map
    field :status, :string, default: "processed"
    field :error_message, :string

    timestamps()
  end

  @required_fields ~w(stripe_event_id event_type processed_at)a
  @optional_fields ~w(payload status error_message)a

  @doc "Changeset for creating or updating a webhook event record."
  def changeset(webhook_event, attrs) do
    webhook_event
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> unique_constraint(:stripe_event_id)
    |> validate_inclusion(:status, ~w(processed failed))
  end
end
