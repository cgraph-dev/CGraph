defmodule CGraph.Webhooks.Endpoint do
  @moduledoc """
  Ecto schema for webhook endpoints.

  Represents a registered URL that receives event notifications via HTTP POST.
  Endpoints subscribe to specific event types and receive signed payloads.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :string, autogenerate: false}
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :url, :events, :active, :metadata, :failure_count,
    :description, :inserted_at, :updated_at
  ]}

  schema "webhook_endpoints" do
    field :url, :string
    field :secret, :string, redact: true
    field :events, {:array, :string}, default: ["*"]
    field :active, :boolean, default: true
    field :metadata, :map, default: %{}
    field :failure_count, :integer, default: 0
    field :description, :string

    has_many :deliveries, CGraph.Webhooks.Delivery, foreign_key: :endpoint_id

    timestamps()
  end

  @doc false
  def changeset(endpoint, attrs) do
    endpoint
    |> cast(attrs, [:id, :url, :secret, :events, :active, :metadata, :failure_count, :description])
    |> validate_required([:id, :url, :secret, :events])
    |> validate_format(:url, ~r/^https?:\/\//, message: "must be a valid HTTP(S) URL")
    |> validate_length(:events, min: 1, message: "must subscribe to at least one event")
    |> unique_constraint(:id, name: :webhook_endpoints_pkey)
  end

  @doc "Returns the endpoint with secret masked (last 4 chars visible)."
  def sanitize(%__MODULE__{} = endpoint) do
    %{
      id: endpoint.id,
      url: endpoint.url,
      secret_last_4: String.slice(endpoint.secret || "", -4, 4),
      events: endpoint.events,
      active: endpoint.active,
      metadata: endpoint.metadata,
      failure_count: endpoint.failure_count,
      description: endpoint.description,
      inserted_at: endpoint.inserted_at,
      updated_at: endpoint.updated_at
    }
  end
end
