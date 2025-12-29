defmodule Cgraph.Webhooks do
  @moduledoc """
  Outbound webhook delivery system with retry logic and event subscriptions.
  
  ## Overview
  
  Enables external systems to receive real-time event notifications:
  
  - **Event Subscriptions**: Subscribe to specific event types
  - **Reliable Delivery**: Automatic retries with exponential backoff
  - **Signature Verification**: HMAC-SHA256 signed payloads
  - **Delivery Tracking**: Full audit trail of webhook attempts
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     WEBHOOK SYSTEM                               │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Event Source ──► Event Router ──► Webhook Queue ──► HTTP POST │
  │       │                │                │              │        │
  │  ┌────▼────┐     ┌─────▼─────┐    ┌─────▼─────┐  ┌─────▼─────┐ │
  │  │ Message │     │ Matching  │    │  Oban     │  │ Finch     │ │
  │  │ Created │     │ Endpoints │    │  Worker   │  │ HTTP      │ │
  │  └─────────┘     └───────────┘    └───────────┘  └───────────┘ │
  │                                                                  │
  │  ┌───────────────────────────────────────────────────────────┐ │
  │  │                   Delivery Status                          │ │
  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
  │  │  │ Pending │─►│ Sending │─►│ Success │  │ Failed  │      │ │
  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │
  │  │                     │           ▲                          │ │
  │  │                     └── Retry ──┘                          │ │
  │  └───────────────────────────────────────────────────────────┘ │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Usage
  
      # Register a webhook endpoint
      {:ok, endpoint} = Webhooks.create_endpoint(%{
        url: "https://example.com/webhooks",
        events: ["message.created", "user.joined"],
        secret: "whsec_...",
        active: true
      })
      
      # Dispatch an event
      Webhooks.dispatch("message.created", %{
        message_id: "msg_123",
        content: "Hello!",
        sender_id: "user_456"
      })
      
      # Check delivery status
      {:ok, deliveries} = Webhooks.list_deliveries(endpoint.id)
  
  ## Event Types
  
  | Category | Events |
  |----------|--------|
  | Messages | `message.created`, `message.updated`, `message.deleted` |
  | Users | `user.joined`, `user.left`, `user.updated` |
  | Channels | `channel.created`, `channel.updated`, `channel.deleted` |
  | System | `system.health`, `system.maintenance` |
  
  ## Signature Verification
  
  Webhooks are signed with HMAC-SHA256. Recipients should verify:
  
  ```
  signature = HMAC-SHA256(secret, timestamp + "." + payload)
  header = "t=<timestamp>,v1=<signature>"
  ```
  
  ## Telemetry Events
  
  - `[:cgraph, :webhooks, :dispatch]` - Event dispatched
  - `[:cgraph, :webhooks, :delivery, :start]` - Delivery attempt started
  - `[:cgraph, :webhooks, :delivery, :success]` - Delivery succeeded
  - `[:cgraph, :webhooks, :delivery, :failure]` - Delivery failed
  """
  
  use GenServer
  require Logger
  
  @default_timeout 30_000
  @max_retries 5
  @retry_delays [1_000, 5_000, 30_000, 120_000, 600_000]
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
  # Types
  # ---------------------------------------------------------------------------
  
  @type endpoint :: %{
    id: String.t(),
    url: String.t(),
    events: [String.t()],
    secret: String.t(),
    active: boolean(),
    metadata: map(),
    created_at: DateTime.t(),
    updated_at: DateTime.t()
  }
  
  @type delivery :: %{
    id: String.t(),
    endpoint_id: String.t(),
    event_type: String.t(),
    payload: map(),
    status: :pending | :success | :failed,
    attempts: integer(),
    last_attempt_at: DateTime.t() | nil,
    next_retry_at: DateTime.t() | nil,
    response_code: integer() | nil,
    response_body: String.t() | nil,
    error: String.t() | nil
  }
  
  # ---------------------------------------------------------------------------
  # Client API - Endpoint Management
  # ---------------------------------------------------------------------------
  
  @doc """
  Create a new webhook endpoint.
  
  ## Options
  
  - `:url` - Webhook URL (required, must be HTTPS in production)
  - `:events` - List of event types to subscribe to (required)
  - `:secret` - Signing secret (auto-generated if not provided)
  - `:active` - Whether endpoint is active (default: true)
  - `:metadata` - Additional metadata
  """
  def create_endpoint(params) do
    GenServer.call(__MODULE__, {:create_endpoint, params})
  end
  
  @doc """
  Update an existing endpoint.
  """
  def update_endpoint(endpoint_id, params) do
    GenServer.call(__MODULE__, {:update_endpoint, endpoint_id, params})
  end
  
  @doc """
  Delete an endpoint.
  """
  def delete_endpoint(endpoint_id) do
    GenServer.call(__MODULE__, {:delete_endpoint, endpoint_id})
  end
  
  @doc """
  Get an endpoint by ID.
  """
  def get_endpoint(endpoint_id) do
    GenServer.call(__MODULE__, {:get_endpoint, endpoint_id})
  end
  
  @doc """
  List all endpoints, optionally filtered.
  """
  def list_endpoints(opts \\ []) do
    GenServer.call(__MODULE__, {:list_endpoints, opts})
  end
  
  @doc """
  Rotate the signing secret for an endpoint.
  """
  def rotate_secret(endpoint_id) do
    GenServer.call(__MODULE__, {:rotate_secret, endpoint_id})
  end
  
  @doc """
  Enable or disable an endpoint.
  """
  def set_active(endpoint_id, active) when is_boolean(active) do
    update_endpoint(endpoint_id, %{active: active})
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Event Dispatching
  # ---------------------------------------------------------------------------
  
  @doc """
  Dispatch an event to all subscribed endpoints.
  
  ## Examples
  
      Webhooks.dispatch("message.created", %{
        id: "msg_123",
        content: "Hello world",
        sender_id: "user_456"
      })
  """
  def dispatch(event_type, payload, opts \\ []) when event_type in @valid_events do
    metadata = Keyword.get(opts, :metadata, %{})
    idempotency_key = Keyword.get(opts, :idempotency_key, generate_idempotency_key())
    
    event = %{
      id: generate_event_id(),
      type: event_type,
      payload: payload,
      metadata: metadata,
      idempotency_key: idempotency_key,
      created_at: DateTime.utc_now()
    }
    
    GenServer.cast(__MODULE__, {:dispatch, event})
    
    emit_dispatch_telemetry(event)
    
    {:ok, event.id}
  end
  
  @doc """
  Dispatch event synchronously (waits for all deliveries).
  """
  def dispatch_sync(event_type, payload, opts \\ []) do
    timeout = Keyword.get(opts, :timeout, 30_000)
    GenServer.call(__MODULE__, {:dispatch_sync, event_type, payload, opts}, timeout)
  end
  
  @doc """
  Retry a failed delivery.
  """
  def retry_delivery(delivery_id) do
    GenServer.call(__MODULE__, {:retry_delivery, delivery_id})
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Delivery Tracking
  # ---------------------------------------------------------------------------
  
  @doc """
  List deliveries for an endpoint.
  """
  def list_deliveries(endpoint_id, opts \\ []) do
    GenServer.call(__MODULE__, {:list_deliveries, endpoint_id, opts})
  end
  
  @doc """
  Get delivery details.
  """
  def get_delivery(delivery_id) do
    GenServer.call(__MODULE__, {:get_delivery, delivery_id})
  end
  
  @doc """
  Get delivery statistics for an endpoint.
  """
  def get_stats(endpoint_id) do
    GenServer.call(__MODULE__, {:get_stats, endpoint_id})
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Verification
  # ---------------------------------------------------------------------------
  
  @doc """
  Verify a webhook signature.
  
  For use by webhook recipients to verify authenticity.
  """
  def verify_signature(payload, signature_header, secret) do
    case parse_signature_header(signature_header) do
      {:ok, timestamp, signatures} ->
        # Check timestamp tolerance
        if timestamp_valid?(timestamp) do
          expected = compute_signature(timestamp, payload, secret)
          if Enum.any?(signatures, &secure_compare(&1, expected)) do
            {:ok, :valid}
          else
            {:error, :invalid_signature}
          end
        else
          {:error, :timestamp_expired}
        end
      
      {:error, reason} ->
        {:error, reason}
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
    }, metadata: %{test: true, endpoint_id: endpoint_id})
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    state = %{
      endpoints: %{},
      deliveries: %{},
      pending_queue: :queue.new()
    }
    
    # Start delivery processor
    schedule_delivery_check()
    
    {:ok, state}
  end
  
  @impl true
  def handle_call({:create_endpoint, params}, _from, state) do
    with :ok <- validate_endpoint_params(params) do
      endpoint = %{
        id: generate_endpoint_id(),
        url: params.url,
        events: params.events || ["*"],
        secret: params[:secret] || generate_secret(),
        active: Map.get(params, :active, true),
        metadata: Map.get(params, :metadata, %{}),
        failure_count: 0,
        created_at: DateTime.utc_now(),
        updated_at: DateTime.utc_now()
      }
      
      new_endpoints = Map.put(state.endpoints, endpoint.id, endpoint)
      
      Logger.info("Created webhook endpoint: #{endpoint.id} for #{endpoint.url}")
      
      {:reply, {:ok, sanitize_endpoint(endpoint)}, %{state | endpoints: new_endpoints}}
    else
      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end
  
  @impl true
  def handle_call({:update_endpoint, endpoint_id, params}, _from, state) do
    case Map.get(state.endpoints, endpoint_id) do
      nil ->
        {:reply, {:error, :not_found}, state}
      
      endpoint ->
        updated = endpoint
        |> maybe_update(:url, params[:url])
        |> maybe_update(:events, params[:events])
        |> maybe_update(:active, params[:active])
        |> maybe_update(:metadata, params[:metadata])
        |> Map.put(:updated_at, DateTime.utc_now())
        
        new_endpoints = Map.put(state.endpoints, endpoint_id, updated)
        
        {:reply, {:ok, sanitize_endpoint(updated)}, %{state | endpoints: new_endpoints}}
    end
  end
  
  @impl true
  def handle_call({:delete_endpoint, endpoint_id}, _from, state) do
    case Map.get(state.endpoints, endpoint_id) do
      nil ->
        {:reply, {:error, :not_found}, state}
      
      _endpoint ->
        new_endpoints = Map.delete(state.endpoints, endpoint_id)
        Logger.info("Deleted webhook endpoint: #{endpoint_id}")
        
        {:reply, :ok, %{state | endpoints: new_endpoints}}
    end
  end
  
  @impl true
  def handle_call({:get_endpoint, endpoint_id}, _from, state) do
    case Map.get(state.endpoints, endpoint_id) do
      nil -> {:reply, {:error, :not_found}, state}
      endpoint -> {:reply, {:ok, sanitize_endpoint(endpoint)}, state}
    end
  end
  
  @impl true
  def handle_call({:list_endpoints, opts}, _from, state) do
    endpoints = state.endpoints
    |> Map.values()
    |> maybe_filter_active(opts[:active])
    |> maybe_filter_event(opts[:event])
    |> Enum.map(&sanitize_endpoint/1)
    
    {:reply, {:ok, endpoints}, state}
  end
  
  @impl true
  def handle_call({:rotate_secret, endpoint_id}, _from, state) do
    case Map.get(state.endpoints, endpoint_id) do
      nil ->
        {:reply, {:error, :not_found}, state}
      
      endpoint ->
        new_secret = generate_secret()
        updated = %{endpoint | secret: new_secret, updated_at: DateTime.utc_now()}
        new_endpoints = Map.put(state.endpoints, endpoint_id, updated)
        
        Logger.info("Rotated secret for webhook endpoint: #{endpoint_id}")
        
        {:reply, {:ok, %{secret: new_secret}}, %{state | endpoints: new_endpoints}}
    end
  end
  
  @impl true
  def handle_call({:dispatch_sync, event_type, payload, _opts}, _from, state) do
    event = %{
      id: generate_event_id(),
      type: event_type,
      payload: payload,
      created_at: DateTime.utc_now()
    }
    
    # Find matching endpoints
    endpoints = find_matching_endpoints(state.endpoints, event_type)
    
    # Deliver to each endpoint synchronously
    results = Enum.map(endpoints, fn endpoint ->
      result = deliver_webhook(endpoint, event)
      {endpoint.id, result}
    end)
    
    {:reply, {:ok, results}, state}
  end
  
  @impl true
  def handle_call({:list_deliveries, endpoint_id, opts}, _from, state) do
    deliveries = state.deliveries
    |> Map.values()
    |> Enum.filter(&(&1.endpoint_id == endpoint_id))
    |> maybe_filter_status(opts[:status])
    |> Enum.sort_by(& &1.created_at, {:desc, DateTime})
    |> Enum.take(opts[:limit] || 100)
    
    {:reply, {:ok, deliveries}, state}
  end
  
  @impl true
  def handle_call({:get_delivery, delivery_id}, _from, state) do
    case Map.get(state.deliveries, delivery_id) do
      nil -> {:reply, {:error, :not_found}, state}
      delivery -> {:reply, {:ok, delivery}, state}
    end
  end
  
  @impl true
  def handle_call({:get_stats, endpoint_id}, _from, state) do
    deliveries = state.deliveries
    |> Map.values()
    |> Enum.filter(&(&1.endpoint_id == endpoint_id))
    
    stats = %{
      total: length(deliveries),
      success: Enum.count(deliveries, &(&1.status == :success)),
      failed: Enum.count(deliveries, &(&1.status == :failed)),
      pending: Enum.count(deliveries, &(&1.status == :pending)),
      success_rate: calculate_success_rate(deliveries),
      avg_latency_ms: calculate_avg_latency(deliveries)
    }
    
    {:reply, {:ok, stats}, state}
  end
  
  @impl true
  def handle_call({:retry_delivery, delivery_id}, _from, state) do
    case Map.get(state.deliveries, delivery_id) do
      nil ->
        {:reply, {:error, :not_found}, state}
      
      delivery ->
        case Map.get(state.endpoints, delivery.endpoint_id) do
          nil ->
            {:reply, {:error, :endpoint_not_found}, state}
          
          endpoint ->
            # Re-queue for immediate delivery
            updated_delivery = %{delivery |
              status: :pending,
              next_retry_at: DateTime.utc_now()
            }
            
            new_deliveries = Map.put(state.deliveries, delivery_id, updated_delivery)
            new_queue = :queue.in({endpoint, updated_delivery}, state.pending_queue)
            
            {:reply, :ok, %{state | deliveries: new_deliveries, pending_queue: new_queue}}
        end
    end
  end
  
  @impl true
  def handle_cast({:dispatch, event}, state) do
    # Find matching endpoints
    endpoints = find_matching_endpoints(state.endpoints, event.type)
    
    # Create delivery records and queue
    {new_deliveries, new_queue} = Enum.reduce(endpoints, {state.deliveries, state.pending_queue}, 
      fn endpoint, {deliveries, queue} ->
        delivery = %{
          id: generate_delivery_id(),
          endpoint_id: endpoint.id,
          event_id: event.id,
          event_type: event.type,
          payload: event.payload,
          status: :pending,
          attempts: 0,
          created_at: DateTime.utc_now(),
          last_attempt_at: nil,
          next_retry_at: nil,
          response_code: nil,
          response_body: nil,
          error: nil,
          latency_ms: nil
        }
        
        {Map.put(deliveries, delivery.id, delivery), :queue.in({endpoint, delivery}, queue)}
      end)
    
    # Trigger immediate processing
    send(self(), :process_queue)
    
    {:noreply, %{state | deliveries: new_deliveries, pending_queue: new_queue}}
  end
  
  @impl true
  def handle_info(:process_queue, state) do
    {new_deliveries, new_queue} = process_pending_queue(state.pending_queue, state.deliveries, state.endpoints)
    
    schedule_delivery_check()
    
    {:noreply, %{state | deliveries: new_deliveries, pending_queue: new_queue}}
  end
  
  @impl true
  def handle_info(:check_retries, state) do
    now = DateTime.utc_now()
    
    # Find deliveries ready for retry
    ready_for_retry = state.deliveries
    |> Map.values()
    |> Enum.filter(fn d ->
      d.status == :pending && 
      d.next_retry_at != nil && 
      DateTime.compare(d.next_retry_at, now) != :gt
    end)
    
    # Queue them for processing
    new_queue = Enum.reduce(ready_for_retry, state.pending_queue, fn delivery, queue ->
      case Map.get(state.endpoints, delivery.endpoint_id) do
        nil -> queue
        endpoint -> :queue.in({endpoint, delivery}, queue)
      end
    end)
    
    if not :queue.is_empty(new_queue) do
      send(self(), :process_queue)
    end
    
    schedule_retry_check()
    
    {:noreply, %{state | pending_queue: new_queue}}
  end
  
  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end
  
  # ---------------------------------------------------------------------------
  # Delivery Logic
  # ---------------------------------------------------------------------------
  
  defp process_pending_queue(queue, deliveries, endpoints) do
    case :queue.out(queue) do
      {:empty, _} ->
        {deliveries, queue}
      
      {{:value, {endpoint, delivery}}, rest} ->
        # Check if endpoint still exists and is active
        case Map.get(endpoints, endpoint.id) do
          nil ->
            # Endpoint deleted, mark as failed
            updated = %{delivery | status: :failed, error: "Endpoint deleted"}
            process_pending_queue(rest, Map.put(deliveries, delivery.id, updated), endpoints)
          
          current_endpoint ->
            if current_endpoint.active do
              # Attempt delivery
              updated = attempt_delivery(current_endpoint, delivery)
              new_deliveries = Map.put(deliveries, delivery.id, updated)
              
              # If failed and retries remaining, re-queue with delay
              new_queue = if should_retry?(updated) do
                :queue.in({current_endpoint, updated}, rest)
              else
                rest
              end
              
              process_pending_queue(new_queue, new_deliveries, endpoints)
            else
              # Endpoint disabled
              updated = %{delivery | status: :failed, error: "Endpoint disabled"}
              process_pending_queue(rest, Map.put(deliveries, delivery.id, updated), endpoints)
            end
        end
    end
  end
  
  defp attempt_delivery(endpoint, delivery) do
    start_time = System.monotonic_time(:millisecond)
    
    emit_delivery_start_telemetry(endpoint, delivery)
    
    payload_json = Jason.encode!(%{
      id: delivery.event_id,
      type: delivery.event_type,
      data: delivery.payload,
      created_at: delivery.created_at
    })
    
    timestamp = System.system_time(:second)
    signature = compute_signature(timestamp, payload_json, endpoint.secret)
    signature_header = "t=#{timestamp},v1=#{signature}"
    
    headers = [
      {"Content-Type", "application/json"},
      {"X-Webhook-Signature", signature_header},
      {"X-Webhook-ID", delivery.id},
      {"X-Webhook-Timestamp", to_string(timestamp)},
      {"User-Agent", "Cgraph-Webhooks/1.0"}
    ]
    
    result = try do
      Finch.build(:post, endpoint.url, headers, payload_json)
      |> Finch.request(Cgraph.Finch, receive_timeout: @default_timeout)
    rescue
      e -> {:error, Exception.message(e)}
    end
    
    end_time = System.monotonic_time(:millisecond)
    latency = end_time - start_time
    
    case result do
      {:ok, %Finch.Response{status: status}} when status in 200..299 ->
        emit_delivery_success_telemetry(endpoint, delivery, status, latency)
        
        %{delivery |
          status: :success,
          attempts: delivery.attempts + 1,
          last_attempt_at: DateTime.utc_now(),
          response_code: status,
          latency_ms: latency
        }
      
      {:ok, %Finch.Response{status: status, body: body}} ->
        emit_delivery_failure_telemetry(endpoint, delivery, status, latency)
        
        schedule_retry(delivery, "HTTP #{status}")
        |> Map.merge(%{
          response_code: status,
          response_body: String.slice(body || "", 0, 1000),
          latency_ms: latency
        })
      
      {:error, reason} ->
        error_msg = if is_binary(reason), do: reason, else: inspect(reason)
        emit_delivery_failure_telemetry(endpoint, delivery, nil, latency)
        
        schedule_retry(delivery, error_msg)
    end
  end
  
  defp schedule_retry(delivery, error) do
    attempts = delivery.attempts + 1
    
    if attempts >= @max_retries do
      %{delivery |
        status: :failed,
        attempts: attempts,
        last_attempt_at: DateTime.utc_now(),
        error: "Max retries exceeded: #{error}"
      }
    else
      delay = Enum.at(@retry_delays, attempts - 1, List.last(@retry_delays))
      next_retry = DateTime.add(DateTime.utc_now(), delay, :millisecond)
      
      %{delivery |
        status: :pending,
        attempts: attempts,
        last_attempt_at: DateTime.utc_now(),
        next_retry_at: next_retry,
        error: error
      }
    end
  end
  
  defp should_retry?(delivery) do
    delivery.status == :pending && 
    delivery.attempts < @max_retries &&
    delivery.next_retry_at != nil
  end
  
  defp deliver_webhook(endpoint, event) do
    delivery = %{
      id: generate_delivery_id(),
      endpoint_id: endpoint.id,
      event_id: event.id,
      event_type: event.type,
      payload: event.payload,
      status: :pending,
      attempts: 0,
      created_at: DateTime.utc_now()
    }
    
    attempt_delivery(endpoint, delivery)
  end
  
  # ---------------------------------------------------------------------------
  # Signature Helpers
  # ---------------------------------------------------------------------------
  
  defp compute_signature(timestamp, payload, secret) do
    signed_payload = "#{timestamp}.#{payload}"
    :crypto.mac(:hmac, :sha256, secret, signed_payload)
    |> Base.encode16(case: :lower)
  end
  
  defp parse_signature_header(header) when is_binary(header) do
    parts = String.split(header, ",")
    
    timestamp = parts
    |> Enum.find_value(fn part ->
      case String.split(part, "=", parts: 2) do
        ["t", value] -> String.to_integer(value)
        _ -> nil
      end
    end)
    
    signatures = parts
    |> Enum.flat_map(fn part ->
      case String.split(part, "=", parts: 2) do
        ["v1", value] -> [value]
        _ -> []
      end
    end)
    
    if timestamp && length(signatures) > 0 do
      {:ok, timestamp, signatures}
    else
      {:error, :invalid_header_format}
    end
  end
  
  defp parse_signature_header(_), do: {:error, :invalid_header}
  
  defp timestamp_valid?(timestamp) do
    now = System.system_time(:second)
    abs(now - timestamp) <= @signature_tolerance_seconds
  end
  
  defp secure_compare(a, b) when byte_size(a) == byte_size(b) do
    :crypto.hash_equals(a, b)
  end
  defp secure_compare(_, _), do: false
  
  # ---------------------------------------------------------------------------
  # Validation
  # ---------------------------------------------------------------------------
  
  defp validate_endpoint_params(params) do
    cond do
      is_nil(params[:url]) ->
        {:error, :url_required}
      
      not valid_url?(params[:url]) ->
        {:error, :invalid_url}
      
      params[:events] != nil && not is_list(params[:events]) ->
        {:error, :events_must_be_list}
      
      params[:events] != nil && not Enum.all?(params[:events], &valid_event?/1) ->
        {:error, {:invalid_events, Enum.reject(params[:events], &valid_event?/1)}}
      
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
  
  defp find_matching_endpoints(endpoints, event_type) do
    endpoints
    |> Map.values()
    |> Enum.filter(fn endpoint ->
      endpoint.active && event_matches?(endpoint.events, event_type)
    end)
  end
  
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
  
  defp maybe_filter_active(endpoints, nil), do: endpoints
  defp maybe_filter_active(endpoints, active), do: Enum.filter(endpoints, &(&1.active == active))
  
  defp maybe_filter_event(endpoints, nil), do: endpoints
  defp maybe_filter_event(endpoints, event) do
    Enum.filter(endpoints, &event_matches?(&1.events, event))
  end
  
  defp maybe_filter_status(deliveries, nil), do: deliveries
  defp maybe_filter_status(deliveries, status), do: Enum.filter(deliveries, &(&1.status == status))
  
  # ---------------------------------------------------------------------------
  # Stats Helpers
  # ---------------------------------------------------------------------------
  
  defp calculate_success_rate([]), do: 0.0
  defp calculate_success_rate(deliveries) do
    completed = Enum.filter(deliveries, &(&1.status in [:success, :failed]))
    if length(completed) > 0 do
      success_count = Enum.count(completed, &(&1.status == :success))
      Float.round(success_count / length(completed) * 100, 2)
    else
      0.0
    end
  end
  
  defp calculate_avg_latency(deliveries) do
    latencies = deliveries
    |> Enum.map(& &1.latency_ms)
    |> Enum.reject(&is_nil/1)
    
    if length(latencies) > 0 do
      Float.round(Enum.sum(latencies) / length(latencies), 2)
    else
      nil
    end
  end
  
  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------
  
  defp maybe_update(map, _key, nil), do: map
  defp maybe_update(map, key, value), do: Map.put(map, key, value)
  
  defp sanitize_endpoint(endpoint) do
    Map.drop(endpoint, [:secret])
    |> Map.put(:secret_last_4, String.slice(endpoint.secret, -4, 4))
  end
  
  defp generate_endpoint_id, do: "whep_" <> random_id()
  defp generate_delivery_id, do: "whd_" <> random_id()
  defp generate_event_id, do: "evt_" <> random_id()
  defp generate_idempotency_key, do: "idk_" <> random_id()
  defp generate_secret, do: "whsec_" <> :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
  
  defp random_id do
    :crypto.strong_rand_bytes(16)
    |> Base.url_encode64(padding: false)
  end
  
  defp schedule_delivery_check do
    Process.send_after(self(), :process_queue, 100)
  end
  
  defp schedule_retry_check do
    Process.send_after(self(), :check_retries, 10_000)
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
  
  defp emit_delivery_start_telemetry(endpoint, delivery) do
    :telemetry.execute(
      [:cgraph, :webhooks, :delivery, :start],
      %{count: 1},
      %{
        endpoint_id: endpoint.id,
        delivery_id: delivery.id,
        event_type: delivery.event_type,
        attempt: delivery.attempts + 1
      }
    )
  end
  
  defp emit_delivery_success_telemetry(endpoint, delivery, status, latency) do
    :telemetry.execute(
      [:cgraph, :webhooks, :delivery, :success],
      %{count: 1, latency_ms: latency, status_code: status},
      %{
        endpoint_id: endpoint.id,
        delivery_id: delivery.id,
        event_type: delivery.event_type,
        attempt: delivery.attempts + 1
      }
    )
    
    Logger.debug("Webhook delivered: #{delivery.id} to #{endpoint.url} in #{latency}ms")
  end
  
  defp emit_delivery_failure_telemetry(endpoint, delivery, status, latency) do
    :telemetry.execute(
      [:cgraph, :webhooks, :delivery, :failure],
      %{count: 1, latency_ms: latency, status_code: status},
      %{
        endpoint_id: endpoint.id,
        delivery_id: delivery.id,
        event_type: delivery.event_type,
        attempt: delivery.attempts + 1
      }
    )
    
    Logger.warning("Webhook failed: #{delivery.id} to #{endpoint.url} (attempt #{delivery.attempts + 1})")
  end
end
