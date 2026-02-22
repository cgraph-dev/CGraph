defmodule CGraph.Webhooks do
  @moduledoc """
  Outbound webhook delivery system with retry logic and event subscriptions.

  All state is persisted to PostgreSQL via Ecto. Deliveries are processed
  asynchronously through Oban workers with automatic retry and exponential backoff.

  ## Overview

  - **Event Subscriptions**: Subscribe to specific event types
  - **Reliable Delivery**: Oban-backed retries with exponential backoff
  - **Signature Verification**: HMAC-SHA256 signed payloads
  - **Delivery Tracking**: Full audit trail via `webhook_deliveries` table

  ## Usage

      {:ok, endpoint} = Webhooks.create_endpoint(%{
        url: "https://example.com/webhooks",
        events: ["message.created", "user.joined"]
      })

      {:ok, event_id} = Webhooks.dispatch("message.created", %{
        message_id: "msg_123",
        content: "Hello!",
        sender_id: "user_456"
      })

      {:ok, deliveries} = Webhooks.list_deliveries(endpoint.id)

  ## Signature Verification

  Webhooks are signed with HMAC-SHA256. Recipients should verify:

      signature = HMAC-SHA256(secret, timestamp <> "." <> payload)
      header = "t=<timestamp>,v1=<signature>"

  ## Telemetry Events

  - `[:cgraph, :webhooks, :dispatch]` - Event dispatched
  - `[:cgraph, :webhooks, :delivery, :start]` - Delivery attempt started
  - `[:cgraph, :webhooks, :delivery, :success]` - Delivery succeeded
  - `[:cgraph, :webhooks, :delivery, :failure]` - Delivery failed

  ## Submodules

  - `CGraph.Webhooks.Endpoints` - Endpoint CRUD and validation
  - `CGraph.Webhooks.Deliveries` - Event dispatching and delivery tracking
  - `CGraph.Webhooks.Signature` - Signature generation and verification
  """

  alias CGraph.Webhooks.{Endpoints, Deliveries, Signature}

  # ---------------------------------------------------------------------------
  # Endpoint Management
  # ---------------------------------------------------------------------------

  defdelegate create_endpoint(params), to: Endpoints
  defdelegate update_endpoint(endpoint_id, params), to: Endpoints
  defdelegate delete_endpoint(endpoint_id), to: Endpoints
  defdelegate get_endpoint(endpoint_id), to: Endpoints
  defdelegate rotate_secret(endpoint_id), to: Endpoints
  defdelegate set_active(endpoint_id, active), to: Endpoints

  # list_endpoints/1 has a default argument — wrapper required
  def list_endpoints(opts \\ []), do: Endpoints.list_endpoints(opts)

  # ---------------------------------------------------------------------------
  # Event Dispatching
  # ---------------------------------------------------------------------------

  # dispatch/3 has a default argument — wrapper required
  def dispatch(event_type, payload, opts \\ []),
    do: Deliveries.dispatch(event_type, payload, opts)

  defdelegate retry_delivery(delivery_id), to: Deliveries

  # ---------------------------------------------------------------------------
  # Delivery Tracking
  # ---------------------------------------------------------------------------

  # list_deliveries/2 has a default argument — wrapper required
  def list_deliveries(endpoint_id, opts \\ []),
    do: Deliveries.list_deliveries(endpoint_id, opts)

  defdelegate get_delivery(delivery_id), to: Deliveries
  defdelegate get_stats(endpoint_id), to: Deliveries

  # ---------------------------------------------------------------------------
  # Signature Verification
  # ---------------------------------------------------------------------------

  defdelegate verify_signature(payload, signature_header, secret), to: Signature
  defdelegate send_test_event(endpoint_id), to: Signature
  defdelegate compute_signature(timestamp, payload, secret), to: Signature
end
