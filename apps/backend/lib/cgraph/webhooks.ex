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
  """

  require Logger
  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.Webhooks.{Endpoint, Delivery}
  alias CGraph.Workers.WebhookDeliveryWorker

  @signature_tolerance_seconds 300

  @valid_events ~w(
    message.created message.updated message.deleted
    user.joined user.left user.updated
    channel.created channel.updated channel.deleted
    reaction.added reaction.removed
    file.uploaded file.deleted
    system.health system.maintenance
  )

  # ---------------------------------------------------------------------------
  # Endpoint Management
  # ---------------------------------------------------------------------------

  @doc """
  Create a new webhook endpoint.

  ## Options

  - `:url` - Webhook URL (required, must be HTTP(S))
  - `:events` - List of event types to subscribe to (default: `["*"]`)
  - `:secret` - Signing secret (auto-generated if not provided)
  - `:active` - Whether endpoint is active (default: true)
  - `:metadata` - Additional metadata map
  - `:description` - Human-readable description
  """
  def create_endpoint(params) do
    case validate_endpoint_params(params) do
      :ok ->
        attrs = %{
          id: generate_endpoint_id(),
          url: params[:url] || params["url"],
          events: params[:events] || params["events"] || ["*"],
          secret: params[:secret] || params["secret"] || generate_secret(),
          active: get_param(params, :active, true),
          metadata: get_param(params, :metadata, %{}),
          description: params[:description] || params["description"],
          failure_count: 0
        }

        changeset = Endpoint.changeset(%Endpoint{}, attrs)

        case Repo.insert(changeset) do
          {:ok, endpoint} ->
            Logger.info("Webhook endpoint created", endpoint_id: endpoint.id, url: endpoint.url)
            {:ok, Endpoint.sanitize(endpoint)}

          {:error, changeset} ->
            {:error, changeset}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Update an existing endpoint.
  """
  def update_endpoint(endpoint_id, params) do
    case Repo.get(Endpoint, endpoint_id) do
      nil ->
        {:error, :not_found}

      endpoint ->
        update_attrs =
          %{}
          |> maybe_put(:url, params[:url] || params["url"])
          |> maybe_put(:events, params[:events] || params["events"])
          |> maybe_put(:active, params[:active])
          |> maybe_put(:metadata, params[:metadata] || params["metadata"])
          |> maybe_put(:description, params[:description] || params["description"])

        case Repo.update(Endpoint.changeset(endpoint, update_attrs)) do
          {:ok, updated} -> {:ok, Endpoint.sanitize(updated)}
          {:error, changeset} -> {:error, changeset}
        end
    end
  end

  @doc """
  Delete an endpoint and all its deliveries.
  """
  def delete_endpoint(endpoint_id) do
    case Repo.get(Endpoint, endpoint_id) do
      nil ->
        {:error, :not_found}

      endpoint ->
        # Delete deliveries first, then endpoint
        from(d in Delivery, where: d.endpoint_id == ^endpoint_id)
        |> Repo.delete_all()

        Repo.delete(endpoint)
        Logger.info("Webhook endpoint deleted", endpoint_id: endpoint_id)
        :ok
    end
  end

  @doc """
  Get an endpoint by ID.
  """
  def get_endpoint(endpoint_id) do
    case Repo.get(Endpoint, endpoint_id) do
      nil -> {:error, :not_found}
      endpoint -> {:ok, Endpoint.sanitize(endpoint)}
    end
  end

  @doc """
  List all endpoints, optionally filtered by `:active` or `:event`.
  """
  def list_endpoints(opts \\ []) do
    query =
      from(e in Endpoint, order_by: [desc: e.inserted_at])
      |> maybe_where_active(opts[:active])

    endpoints =
      Repo.all(query)
      |> maybe_filter_event(opts[:event])
      |> Enum.map(&Endpoint.sanitize/1)

    {:ok, endpoints}
  end

  @doc """
  Rotate the signing secret for an endpoint.
  """
  def rotate_secret(endpoint_id) do
    case Repo.get(Endpoint, endpoint_id) do
      nil ->
        {:error, :not_found}

      endpoint ->
        new_secret = generate_secret()

        case Repo.update(Ecto.Changeset.change(endpoint, %{secret: new_secret})) do
          {:ok, _updated} ->
            Logger.info("Webhook secret rotated", endpoint_id: endpoint_id)
            {:ok, %{secret: new_secret}}

          {:error, changeset} ->
            {:error, changeset}
        end
    end
  end

  @doc """
  Enable or disable an endpoint.
  """
  def set_active(endpoint_id, active) when is_boolean(active) do
    update_endpoint(endpoint_id, %{active: active})
  end

  # ---------------------------------------------------------------------------
  # Event Dispatching
  # ---------------------------------------------------------------------------

  @doc """
  Dispatch an event to all subscribed endpoints asynchronously via Oban.

  Creates a delivery record per matching endpoint and enqueues an Oban job
  for each. Returns `{:ok, event_id}`.
  """
  def dispatch(event_type, payload, _opts \\ []) when event_type in @valid_events do
    event_id = generate_event_id()

    # Find matching active endpoints from DB
    endpoints =
      from(e in Endpoint, where: e.active == true)
      |> Repo.all()
      |> Enum.filter(fn ep -> event_matches?(ep.events, event_type) end)

    # Create delivery records and enqueue Oban jobs
    Enum.each(endpoints, fn endpoint ->
      delivery_id = generate_delivery_id()

      attrs = %{
        id: delivery_id,
        endpoint_id: endpoint.id,
        event_id: event_id,
        event_type: event_type,
        payload: payload,
        status: "pending",
        attempts: 0,
        max_attempts: 5
      }

      case Repo.insert(Delivery.changeset(%Delivery{}, attrs)) do
        {:ok, _delivery} ->
          %{delivery_id: delivery_id}
          |> WebhookDeliveryWorker.new()
          |> Oban.insert!()

        {:error, reason} ->
          Logger.error("Failed to create webhook delivery",
            endpoint_id: endpoint.id,
            event_type: event_type,
            error: inspect(reason)
          )
      end
    end)

    emit_dispatch_telemetry(%{id: event_id, type: event_type})

    {:ok, event_id}
  end

  @doc """
  Retry a failed or pending delivery by re-enqueuing its Oban job.
  """
  def retry_delivery(delivery_id) do
    case Repo.get(Delivery, delivery_id) do
      nil ->
        {:error, :not_found}

      delivery ->
        Repo.update!(Ecto.Changeset.change(delivery, %{
          status: "pending",
          next_retry_at: DateTime.utc_now()
        }))

        %{delivery_id: delivery_id}
        |> WebhookDeliveryWorker.new()
        |> Oban.insert!()

        :ok
    end
  end

  # ---------------------------------------------------------------------------
  # Delivery Tracking
  # ---------------------------------------------------------------------------

  @doc """
  List deliveries for an endpoint with optional `:status` and `:limit` filters.
  """
  def list_deliveries(endpoint_id, opts \\ []) do
    limit = opts[:limit] || 100

    query =
      from(d in Delivery,
        where: d.endpoint_id == ^endpoint_id,
        order_by: [desc: d.inserted_at],
        limit: ^limit
      )
      |> maybe_where_status(opts[:status])

    {:ok, Repo.all(query)}
  end

  @doc """
  Get delivery details.
  """
  def get_delivery(delivery_id) do
    case Repo.get(Delivery, delivery_id) do
      nil -> {:error, :not_found}
      delivery -> {:ok, delivery}
    end
  end

  @doc """
  Get delivery statistics for an endpoint.
  """
  def get_stats(endpoint_id) do
    total =
      from(d in Delivery, where: d.endpoint_id == ^endpoint_id, select: count())
      |> Repo.one()

    success =
      from(d in Delivery, where: d.endpoint_id == ^endpoint_id and d.status == "success", select: count())
      |> Repo.one()

    failed =
      from(d in Delivery, where: d.endpoint_id == ^endpoint_id and d.status == "failed", select: count())
      |> Repo.one()

    pending =
      from(d in Delivery, where: d.endpoint_id == ^endpoint_id and d.status == "pending", select: count())
      |> Repo.one()

    avg_latency =
      from(d in Delivery,
        where: d.endpoint_id == ^endpoint_id and not is_nil(d.latency_ms),
        select: avg(d.latency_ms)
      )
      |> Repo.one()

    completed = success + failed
    success_rate = if completed > 0, do: Float.round(success / completed * 100, 2), else: 0.0

    {:ok, %{
      total: total,
      success: success,
      failed: failed,
      pending: pending,
      success_rate: success_rate,
      avg_latency_ms: avg_latency
    }}
  end

  # ---------------------------------------------------------------------------
  # Signature Verification (public, for webhook recipients)
  # ---------------------------------------------------------------------------

  @doc """
  Verify a webhook signature.

  For use by webhook recipients to verify authenticity.
  """
  def verify_signature(payload, signature_header, secret) do
    with {:ok, timestamp, signatures} <- parse_signature_header(signature_header),
         :ok <- check_timestamp(timestamp) do
      expected = compute_signature(timestamp, payload, secret)

      if Enum.any?(signatures, &secure_compare(&1, expected)) do
        {:ok, :valid}
      else
        {:error, :invalid_signature}
      end
    end
  end

  @doc """
  Generate a test event for endpoint verification.
  """
  def send_test_event(endpoint_id) do
    dispatch("system.health", %{
      test: true,
      message: "Test webhook from Cgraph",
      timestamp: DateTime.utc_now()
    })
    |> case do
      {:ok, event_id} -> {:ok, %{event_id: event_id, endpoint_id: endpoint_id}}
      error -> error
    end
  end

  @doc """
  Compute a webhook signature (exposed for the delivery worker).
  """
  def compute_signature(timestamp, payload, secret) do
    signed_payload = "#{timestamp}.#{payload}"

    :crypto.mac(:hmac, :sha256, secret, signed_payload)
    |> Base.encode16(case: :lower)
  end

  # ---------------------------------------------------------------------------
  # Signature Parsing
  # ---------------------------------------------------------------------------

  defp parse_signature_header(header) when is_binary(header) do
    parts = String.split(header, ",")

    timestamp =
      Enum.find_value(parts, fn part ->
        case String.split(part, "=", parts: 2) do
          ["t", value] -> String.to_integer(value)
          _ -> nil
        end
      end)

    signatures =
      Enum.flat_map(parts, fn part ->
        case String.split(part, "=", parts: 2) do
          ["v1", value] -> [value]
          _ -> []
        end
      end)

    case {timestamp, signatures} do
      {ts, [_ | _]} when not is_nil(ts) ->
        {:ok, ts, signatures}

      _ ->
        {:error, :invalid_header_format}
    end
  end

  defp parse_signature_header(_), do: {:error, :invalid_header}

  defp check_timestamp(timestamp) do
    now = System.system_time(:second)
    if abs(now - timestamp) <= @signature_tolerance_seconds, do: :ok, else: {:error, :timestamp_expired}
  end

  defp secure_compare(a, b) when byte_size(a) == byte_size(b) do
    :crypto.hash_equals(a, b)
  end

  defp secure_compare(_, _), do: false

  # ---------------------------------------------------------------------------
  # Validation
  # ---------------------------------------------------------------------------

  defp validate_endpoint_params(params) do
    url = params[:url] || params["url"]
    events = params[:events] || params["events"]

    cond do
      is_nil(url) ->
        {:error, :url_required}

      not valid_url?(url) ->
        {:error, :invalid_url}

      events != nil && not is_list(events) ->
        {:error, :events_must_be_list}

      events != nil && not Enum.all?(events, &valid_event?/1) ->
        {:error, {:invalid_events, Enum.reject(events, &valid_event?/1)}}

      true ->
        :ok
    end
  end

  defp valid_url?(url) when is_binary(url) do
    case URI.parse(url) do
      %URI{scheme: scheme, host: host} when scheme in ["http", "https"] and not is_nil(host) ->
        true

      _ ->
        false
    end
  end

  defp valid_url?(_), do: false

  defp valid_event?("*"), do: true
  defp valid_event?(event), do: event in @valid_events

  # ---------------------------------------------------------------------------
  # Query Helpers
  # ---------------------------------------------------------------------------

  defp event_matches?(subscribed_events, event_type) do
    Enum.any?(subscribed_events, fn subscribed ->
      subscribed == "*" ||
        subscribed == event_type ||
        wildcard_match?(subscribed, event_type)
    end)
  end

  defp wildcard_match?(pattern, event) do
    if String.ends_with?(pattern, ".*") do
      prefix = String.trim_trailing(pattern, ".*")
      String.starts_with?(event, prefix <> ".")
    else
      false
    end
  end

  defp maybe_where_active(query, nil), do: query

  defp maybe_where_active(query, active) do
    from(e in query, where: e.active == ^active)
  end

  defp maybe_filter_event(endpoints, nil), do: endpoints

  defp maybe_filter_event(endpoints, event) do
    Enum.filter(endpoints, &event_matches?(&1.events, event))
  end

  defp maybe_where_status(query, nil), do: query

  defp maybe_where_status(query, status) do
    status_str = to_string(status)
    from(d in query, where: d.status == ^status_str)
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp get_param(params, key, default) do
    case {Map.get(params, key), Map.get(params, to_string(key))} do
      {nil, nil} -> default
      {nil, val} -> val
      {val, _} -> val
    end
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp generate_endpoint_id, do: "whep_" <> random_id()
  defp generate_delivery_id, do: "whd_" <> random_id()
  defp generate_event_id, do: "evt_" <> random_id()

  defp generate_secret do
    "whsec_" <> (:crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false))
  end

  defp random_id do
    :crypto.strong_rand_bytes(16)
    |> Base.url_encode64(padding: false)
  end

  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------

  defp emit_dispatch_telemetry(event) do
    :telemetry.execute(
      [:cgraph, :webhooks, :dispatch],
      %{count: 1},
      %{event_type: event.type, event_id: event.id}
    )
  end
end
