defmodule Cgraph.Events do
  @moduledoc """
  Domain event system for event-driven architecture.
  
  ## Overview
  
  Provides event sourcing and domain event dispatching:
  
  - **Event Publishing**: Emit events from domain operations
  - **Event Subscription**: React to events asynchronously
  - **Event Store**: Persist events for replay and audit
  - **Event Replay**: Rebuild state from event history
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     EVENT SYSTEM                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Domain ──► Event ──► Bus ──► Handlers                          │
  │  Action      │                    │                              │
  │              ▼                    ▼                              │
  │         ┌─────────┐        ┌──────────────┐                     │
  │         │ Event   │        │  Subscriber  │                     │
  │         │ Store   │        │  • Analytics │                     │
  │         │ (append)│        │  • Webhooks  │                     │
  │         └─────────┘        │  • Cache     │                     │
  │              │             │  • Search    │                     │
  │              ▼             └──────────────┘                     │
  │         ┌─────────┐                                              │
  │         │ Replay  │                                              │
  │         └─────────┘                                              │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Usage
  
      # Publish an event
      Events.publish(:message_sent, %{
        message_id: "msg_123",
        sender_id: "user_456",
        content: "Hello!"
      })
      
      # Subscribe to events
      Events.subscribe(:message_sent, fn event ->
        Analytics.track_message(event)
      end)
      
      # Subscribe with a module handler
      Events.subscribe(:user_registered, MyApp.Handlers.SendWelcomeEmail)
  
  ## Event Types
  
  | Category | Events |
  |----------|--------|
  | Users | `user_registered`, `user_updated`, `user_deleted` |
  | Messages | `message_sent`, `message_edited`, `message_deleted` |
  | Channels | `channel_created`, `channel_updated`, `member_joined` |
  | Auth | `login_success`, `login_failed`, `token_refreshed` |
  
  ## Event Structure
  
  ```elixir
  %Event{
    id: "evt_abc123",
    type: :message_sent,
    aggregate_type: :message,
    aggregate_id: "msg_123",
    payload: %{...},
    metadata: %{
      user_id: "user_456",
      correlation_id: "corr_789",
      causation_id: "evt_xyz"
    },
    occurred_at: ~U[2024-01-15 12:00:00Z]
  }
  ```
  
  ## Telemetry Events
  
  - `[:cgraph, :events, :published]` - Event published
  - `[:cgraph, :events, :handled]` - Event handler completed
  - `[:cgraph, :events, :handler_error]` - Handler raised error
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
  def publish(type, payload, opts \\ []) do
    event = build_event(type, payload, opts)
    
    GenServer.cast(__MODULE__, {:publish, event})
    
    {:ok, event.id}
  end
  
  @doc """
  Publish an event synchronously, waiting for all handlers.
  """
  def publish_sync(type, payload, opts \\ []) do
    timeout = Keyword.get(opts, :timeout, 5000)
    event = build_event(type, payload, opts)
    
    GenServer.call(__MODULE__, {:publish_sync, event}, timeout)
  end
  
  @doc """
  Publish multiple events as a batch.
  """
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
  def subscribe(event_type, handler) do
    GenServer.call(__MODULE__, {:subscribe, event_type, handler})
  end
  
  @doc """
  Subscribe to multiple event types.
  """
  def subscribe_all(event_types, handler) when is_list(event_types) do
    Enum.each(event_types, &subscribe(&1, handler))
  end
  
  @doc """
  Unsubscribe a handler from an event type.
  """
  def unsubscribe(event_type, handler) do
    GenServer.call(__MODULE__, {:unsubscribe, event_type, handler})
  end
  
  @doc """
  List all subscriptions.
  """
  def subscriptions do
    GenServer.call(__MODULE__, :subscriptions)
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Event Store
  # ---------------------------------------------------------------------------
  
  @doc """
  Get events for an aggregate.
  """
  def get_events(aggregate_type, aggregate_id, opts \\ []) do
    GenServer.call(__MODULE__, {:get_events, aggregate_type, aggregate_id, opts})
  end
  
  @doc """
  Get events by type.
  """
  def get_events_by_type(event_type, opts \\ []) do
    GenServer.call(__MODULE__, {:get_events_by_type, event_type, opts})
  end
  
  @doc """
  Replay events for an aggregate to rebuild state.
  """
  def replay(aggregate_type, aggregate_id, handler) do
    {:ok, events} = get_events(aggregate_type, aggregate_id)
    
    Enum.reduce(events, %{}, fn event, state ->
      handler.(state, event)
    end)
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    # Subscribe to Phoenix PubSub for distributed events
    Phoenix.PubSub.subscribe(Cgraph.PubSub, @event_bus_topic)
    
    state = %{
      subscriptions: %{},
      event_store: [],
      event_count: 0
    }
    
    {:ok, state}
  end
  
  @impl true
  def handle_cast({:publish, event}, state) do
    # Store event
    new_store = [event | state.event_store] |> Enum.take(10_000)
    
    # Dispatch to handlers
    dispatch_event(event, state.subscriptions)
    
    # Broadcast for distributed nodes
    Phoenix.PubSub.broadcast(Cgraph.PubSub, @event_bus_topic, {:event, event})
    
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
    Phoenix.PubSub.broadcast(Cgraph.PubSub, @event_bus_topic, {:events, events})
    
    {:noreply, %{state | 
      event_store: new_store, 
      event_count: state.event_count + length(events)
    }}
  end
  
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
      Logger.debug("Subscribed to #{event_type}: #{inspect(handler)}")
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
    
    Logger.error("Event handler error: #{inspect(handler)} for #{event.type}: #{Exception.message(error)}")
  end
end
