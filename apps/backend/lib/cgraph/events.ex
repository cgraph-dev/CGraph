defmodule CGraph.Events do
  @moduledoc """
  Domain event system for event-driven architecture.

  Provides event sourcing and domain event dispatching:
  publish/subscribe, persistent event store, and replay.

  ## Usage

      Events.publish(:message_sent, %{message_id: "msg_123", sender_id: "user_456"})
      Events.subscribe(:message_sent, fn event -> Analytics.track_message(event) end)

  ## Event Categories

  Users (`user_registered`, `user_updated`, `user_deleted`),
  Messages (`message_sent`, `message_edited`, `message_deleted`),
  Channels (`channel_created`, `channel_updated`, `member_joined`),
  Auth (`login_success`, `login_failed`, `token_refreshed`).

  See `CGraph.Events.TypedEvents` for typed event structs.
  """

  use GenServer
  require Logger

  @event_bus_topic "cgraph:events"

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type event_type :: atom()

  @type event :: %{
    id: String.t(),
    type: event_type(),
    aggregate_type: atom() | nil,
    aggregate_id: String.t() | nil,
    payload: map(),
    metadata: map(),
    occurred_at: DateTime.t(),
    version: pos_integer()
  }

  @type handler :: (event() -> :ok | {:error, term()}) | module()

  # ---------------------------------------------------------------------------
  # Client API - Publishing
  # ---------------------------------------------------------------------------

  @doc """
  Publish a domain event.

  ## Options

  - `:aggregate_type` - Type of aggregate (e.g., :message, :user)
  - `:aggregate_id` - ID of the aggregate
  - `:user_id` - User who triggered the event
  - `:correlation_id` - For request tracing
  - `:causation_id` - ID of event that caused this one
  """
  @spec publish(event_type(), map(), keyword()) :: {:ok, String.t()}
  def publish(type, payload, opts \\ []) do
    event = build_event(type, payload, opts)

    GenServer.cast(__MODULE__, {:publish, event})

    {:ok, event.id}
  end

  @doc """
  Publish an event synchronously, waiting for all handlers.
  """
  @spec publish_sync(event_type(), map(), keyword()) :: {:ok, list()}
  def publish_sync(type, payload, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    timeout = Keyword.get(opts, :timeout, 5000)
    event = build_event(type, payload, opts)

    GenServer.call(__MODULE__, {:publish_sync, event}, timeout)
  end

  @doc """
  Publish multiple events as a batch.
  """
  @spec publish_batch([{event_type(), map(), keyword()}]) :: {:ok, [String.t()]}
  def publish_batch(events) when is_list(events) do
    built_events = Enum.map(events, fn {type, payload, opts} ->
      build_event(type, payload, opts)
    end)

    GenServer.cast(__MODULE__, {:publish_batch, built_events})

    {:ok, Enum.map(built_events, & &1.id)}
  end

  # ---------------------------------------------------------------------------
  # Client API - Subscription
  # ---------------------------------------------------------------------------

  @doc """
  Subscribe to an event type.

  Handler can be a function or a module implementing `handle_event/1`.
  """
  @spec subscribe(event_type(), handler()) :: :ok | {:ok, :already_subscribed}
  def subscribe(event_type, handler) do
    GenServer.call(__MODULE__, {:subscribe, event_type, handler})
  end

  @doc """
  Subscribe to multiple event types.
  """
  @spec subscribe_all([event_type()], handler()) :: :ok
  def subscribe_all(event_types, handler) when is_list(event_types) do
    Enum.each(event_types, &subscribe(&1, handler))
  end

  @doc """
  Unsubscribe a handler from an event type.
  """
  @spec unsubscribe(event_type(), handler()) :: :ok
  def unsubscribe(event_type, handler) do
    GenServer.call(__MODULE__, {:unsubscribe, event_type, handler})
  end

  @doc """
  List all subscriptions.
  """
  @spec subscriptions() :: map()
  def subscriptions do
    GenServer.call(__MODULE__, :subscriptions)
  end

  # ---------------------------------------------------------------------------
  # Client API - Event Store
  # ---------------------------------------------------------------------------

  @doc """
  Get events for an aggregate.
  """
  @spec get_events(atom(), String.t(), keyword()) :: {:ok, [event()]}
  def get_events(aggregate_type, aggregate_id, opts \\ []) do
    GenServer.call(__MODULE__, {:get_events, aggregate_type, aggregate_id, opts})
  end

  @doc """
  Get events by type.
  """
  @spec get_events_by_type(event_type(), keyword()) :: {:ok, [event()]}
  def get_events_by_type(event_type, opts \\ []) do
    GenServer.call(__MODULE__, {:get_events_by_type, event_type, opts})
  end

  @doc """
  Replay events for an aggregate to rebuild state.
  """
  @spec replay(atom(), String.t(), (map(), event() -> map())) :: map()
  def replay(aggregate_type, aggregate_id, handler) do
    {:ok, events} = get_events(aggregate_type, aggregate_id)

    Enum.reduce(events, %{}, fn event, state ->
      handler.(state, event)
    end)
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @doc "Starts the events GenServer."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Initializes the events GenServer state."
  @spec init(keyword()) :: {:ok, map()}
  @impl true
  def init(_opts) do
    # Subscribe to Phoenix PubSub for distributed events
    Phoenix.PubSub.subscribe(CGraph.PubSub, @event_bus_topic)

    state = %{
      subscriptions: %{},
      event_store: [],
      event_count: 0
    }

    {:ok, state}
  end

  @doc "Handles asynchronous event publishing and batch dispatching."
  @spec handle_cast(term(), map()) :: {:noreply, map()}
  @impl true
  def handle_cast({:publish, event}, state) do
    # Store event
    new_store = [event | state.event_store] |> Enum.take(10_000)

    # Dispatch to handlers
    dispatch_event(event, state.subscriptions)

    # Broadcast for distributed nodes
    Phoenix.PubSub.broadcast(CGraph.PubSub, @event_bus_topic, {:event, event})

    emit_published_telemetry(event)

    {:noreply, %{state | event_store: new_store, event_count: state.event_count + 1}}
  end

  @impl true
  def handle_cast({:publish_batch, events}, state) do
    # Store events
    new_store = (events ++ state.event_store) |> Enum.take(10_000)

    # Dispatch each event
    Enum.each(events, fn event ->
      dispatch_event(event, state.subscriptions)
      emit_published_telemetry(event)
    end)

    # Broadcast batch
    Phoenix.PubSub.broadcast(CGraph.PubSub, @event_bus_topic, {:events, events})

    {:noreply, %{state |
      event_store: new_store,
      event_count: state.event_count + length(events)
    }}
  end

  @doc "Handles synchronous event publishing, subscriptions, and queries."
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  @impl true
  def handle_call({:publish_sync, event}, _from, state) do
    # Store event
    new_store = [event | state.event_store] |> Enum.take(10_000)

    # Dispatch and collect results
    results = dispatch_event_sync(event, state.subscriptions)

    emit_published_telemetry(event)

    {:reply, {:ok, results}, %{state | event_store: new_store, event_count: state.event_count + 1}}
  end

  @impl true
  def handle_call({:subscribe, event_type, handler}, _from, state) do
    current = Map.get(state.subscriptions, event_type, [])

    if handler in current do
      {:reply, {:ok, :already_subscribed}, state}
    else
      new_subs = Map.put(state.subscriptions, event_type, [handler | current])
      Logger.debug("subscribed_to", event_type: event_type, handler: inspect(handler))
      {:reply, :ok, %{state | subscriptions: new_subs}}
    end
  end

  @impl true
  def handle_call({:unsubscribe, event_type, handler}, _from, state) do
    current = Map.get(state.subscriptions, event_type, [])
    new_handlers = List.delete(current, handler)
    new_subs = Map.put(state.subscriptions, event_type, new_handlers)

    {:reply, :ok, %{state | subscriptions: new_subs}}
  end

  @impl true
  def handle_call(:subscriptions, _from, state) do
    {:reply, state.subscriptions, state}
  end

  @impl true
  def handle_call({:get_events, aggregate_type, aggregate_id, opts}, _from, state) do
    opts = if is_list(opts), do: opts, else: []
    limit = Keyword.get(opts, :limit, 100)

    events = state.event_store
    |> Enum.filter(fn e ->
      e.aggregate_type == aggregate_type && e.aggregate_id == aggregate_id
    end)
    |> Enum.take(limit)

    {:reply, {:ok, events}, state}
  end

  @impl true
  def handle_call({:get_events_by_type, event_type, opts}, _from, state) do
    opts = if is_list(opts), do: opts, else: []
    limit = Keyword.get(opts, :limit, 100)
    since = Keyword.get(opts, :since)

    events = state.event_store
    |> Enum.filter(fn e ->
      e.type == event_type &&
      (is_nil(since) || DateTime.compare(e.occurred_at, since) == :gt)
    end)
    |> Enum.take(limit)

    {:reply, {:ok, events}, state}
  end

  @doc "Handles distributed event messages from other nodes."
  @spec handle_info(term(), map()) :: {:noreply, map()}
  @impl true
  def handle_info({:event, event}, state) do
    # Handle event from another node
    dispatch_event(event, state.subscriptions)
    {:noreply, state}
  end

  @impl true
  def handle_info({:events, events}, state) do
    Enum.each(events, fn event ->
      dispatch_event(event, state.subscriptions)
    end)
    {:noreply, state}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Event Building
  # ---------------------------------------------------------------------------

  defp build_event(type, payload, opts) do
    %{
      id: generate_event_id(),
      type: type,
      aggregate_type: Keyword.get(opts, :aggregate_type),
      aggregate_id: Keyword.get(opts, :aggregate_id),
      payload: payload,
      metadata: %{
        user_id: Keyword.get(opts, :user_id),
        correlation_id: Keyword.get(opts, :correlation_id, generate_correlation_id()),
        causation_id: Keyword.get(opts, :causation_id),
        source: Keyword.get(opts, :source, node())
      },
      occurred_at: DateTime.utc_now(),
      version: 1
    }
  end

  # ---------------------------------------------------------------------------
  # Event Dispatch
  # ---------------------------------------------------------------------------

  defp dispatch_event(event, subscriptions) do
    handlers = Map.get(subscriptions, event.type, []) ++
               Map.get(subscriptions, :*, [])

    Enum.each(handlers, fn handler ->
      Task.start(fn ->
        execute_handler(handler, event)
      end)
    end)
  end

  defp dispatch_event_sync(event, subscriptions) do
    handlers = Map.get(subscriptions, event.type, []) ++
               Map.get(subscriptions, :*, [])

    Enum.map(handlers, fn handler ->
      {handler, execute_handler(handler, event)}
    end)
  end

  defp execute_handler(handler, event) when is_function(handler, 1) do
    start_time = System.monotonic_time(:millisecond)

    try do
      result = handler.(event)
      emit_handled_telemetry(event, handler, start_time)
      result
    rescue
      e ->
        emit_handler_error_telemetry(event, handler, e)
        {:error, Exception.message(e)}
    end
  end

  defp execute_handler(handler, event) when is_atom(handler) do
    start_time = System.monotonic_time(:millisecond)

    try do
      result = handler.handle_event(event)
      emit_handled_telemetry(event, handler, start_time)
      result
    rescue
      e ->
        emit_handler_error_telemetry(event, handler, e)
        {:error, Exception.message(e)}
    end
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp generate_event_id do
    "evt_" <> (:crypto.strong_rand_bytes(16) |> Base.url_encode64(padding: false))
  end

  defp generate_correlation_id do
    "corr_" <> (:crypto.strong_rand_bytes(12) |> Base.url_encode64(padding: false))
  end

  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------

  defp emit_published_telemetry(event) do
    :telemetry.execute(
      [:cgraph, :events, :published],
      %{count: 1},
      %{
        event_type: event.type,
        aggregate_type: event.aggregate_type,
        event_id: event.id
      }
    )
  end

  defp emit_handled_telemetry(event, handler, start_time) do
    duration = System.monotonic_time(:millisecond) - start_time

    :telemetry.execute(
      [:cgraph, :events, :handled],
      %{duration_ms: duration},
      %{
        event_type: event.type,
        handler: inspect(handler),
        event_id: event.id
      }
    )
  end

  defp emit_handler_error_telemetry(event, handler, error) do
    :telemetry.execute(
      [:cgraph, :events, :handler_error],
      %{count: 1},
      %{
        event_type: event.type,
        handler: inspect(handler),
        event_id: event.id,
        error: Exception.message(error)
      }
    )

    Logger.error("event_handler_error_for", handler: inspect(handler), event_type: event.type, error: inspect(Exception.message(error)))
  end
end
