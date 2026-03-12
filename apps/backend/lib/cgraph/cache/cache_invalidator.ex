defmodule CGraph.Cache.CacheInvalidator do
  @moduledoc """
  PubSub-driven cache invalidation GenServer.

  Subscribes to `CGraph.PubSub` event topics and invalidates
  cache entries when write events occur. This ensures caches
  stay consistent across all nodes in the cluster.

  ## Subscribed topics

  | Topic               | Event pattern                 | Invalidation                  |
  |---------------------|-------------------------------|-------------------------------|
  | `"cache:invalidate"`| `{:invalidate, key}`          | Direct key invalidation       |
  | `"users:events"`    | `{:user_updated, user_id}`    | Invalidate `users:{id}:*`     |
  | `"messages:events"` | `{:message_sent, conv_id}`    | Invalidate `conversations:*`  |
  | `"forums:events"`   | `{:thread_updated, thread_id}`| Invalidate `threads:{id}:*`   |

  ## Usage

  The invalidator is started as part of the supervision tree. To
  manually invalidate from any process:

      Phoenix.PubSub.broadcast(CGraph.PubSub, "cache:invalidate", {:invalidate, "users:abc:1"})
  """

  use GenServer
  require Logger

  alias CGraph.Cache.MultiTierCache

  @topics [
    "cache:invalidate",
    "users:events",
    "messages:events",
    "forums:events"
  ]

  # ── Client API ────────────────────────────────────────────────────────────

  @doc "Starts the cache invalidator GenServer."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Broadcast an invalidation event so all nodes clear the key.
  """
  @spec broadcast_invalidate(String.t()) :: :ok
  def broadcast_invalidate(key) do
    Phoenix.PubSub.broadcast(CGraph.PubSub, "cache:invalidate", {:invalidate, key})
    :ok
  end

  @doc """
  Broadcast a pattern invalidation event.
  """
  @spec broadcast_invalidate_pattern(String.t()) :: :ok
  def broadcast_invalidate_pattern(pattern) do
    Phoenix.PubSub.broadcast(CGraph.PubSub, "cache:invalidate", {:invalidate_pattern, pattern})
    :ok
  end

  # ── GenServer callbacks ───────────────────────────────────────────────────

  @impl true
  def init(_opts) do
    # Subscribe to all relevant topics
    Enum.each(@topics, fn topic ->
      Phoenix.PubSub.subscribe(CGraph.PubSub, topic)
    end)

    Logger.info("[CacheInvalidator] Subscribed to #{length(@topics)} topics")

    {:ok, %{invalidation_count: 0}}
  end

  # ── Direct invalidation messages ──────────────────────────────────────────

  @impl true
  def handle_info({:invalidate, key}, state) when is_binary(key) do
    MultiTierCache.invalidate_key(key)
    Logger.debug("[CacheInvalidator] Invalidated key: #{key}")

    :telemetry.execute(
      [:cgraph, :cache, :invalidator, :invalidate],
      %{count: 1},
      %{key: key, source: :direct}
    )

    {:noreply, %{state | invalidation_count: state.invalidation_count + 1}}
  end

  @impl true
  def handle_info({:invalidate_pattern, pattern}, state) when is_binary(pattern) do
    MultiTierCache.invalidate_pattern(pattern)
    Logger.debug("[CacheInvalidator] Invalidated pattern: #{pattern}")

    :telemetry.execute(
      [:cgraph, :cache, :invalidator, :invalidate_pattern],
      %{count: 1},
      %{pattern: pattern, source: :direct}
    )

    {:noreply, %{state | invalidation_count: state.invalidation_count + 1}}
  end

  # ── User events ───────────────────────────────────────────────────────────

  @impl true
  def handle_info({:user_updated, user_id}, state) do
    MultiTierCache.invalidate_pattern("users:#{user_id}:*")
    log_invalidation("user_updated", user_id)
    {:noreply, bump(state)}
  end

  @impl true
  def handle_info({:user_deleted, user_id}, state) do
    MultiTierCache.invalidate_pattern("users:#{user_id}:*")
    log_invalidation("user_deleted", user_id)
    {:noreply, bump(state)}
  end

  # ── Message / conversation events ─────────────────────────────────────────

  @impl true
  def handle_info({:message_sent, %{conversation_id: conv_id}}, state) do
    MultiTierCache.invalidate_pattern("conversations:#{conv_id}:*")
    log_invalidation("message_sent", conv_id)
    {:noreply, bump(state)}
  end

  @impl true
  def handle_info({:message_deleted, %{conversation_id: conv_id}}, state) do
    MultiTierCache.invalidate_pattern("conversations:#{conv_id}:*")
    log_invalidation("message_deleted", conv_id)
    {:noreply, bump(state)}
  end

  # ── Forum events ──────────────────────────────────────────────────────────

  @impl true
  def handle_info({:thread_updated, thread_id}, state) do
    MultiTierCache.invalidate_pattern("threads:#{thread_id}:*")
    log_invalidation("thread_updated", thread_id)
    {:noreply, bump(state)}
  end

  @impl true
  def handle_info({:thread_deleted, thread_id}, state) do
    MultiTierCache.invalidate_pattern("threads:#{thread_id}:*")
    log_invalidation("thread_deleted", thread_id)
    {:noreply, bump(state)}
  end

  @impl true
  def handle_info({:post_created, %{thread_id: thread_id}}, state) do
    MultiTierCache.invalidate_pattern("threads:#{thread_id}:*")
    log_invalidation("post_created", thread_id)
    {:noreply, bump(state)}
  end

  # ── Catch-all (ignore unknown messages) ───────────────────────────────────

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # ── Stats ─────────────────────────────────────────────────────────────────

  @impl true
  def handle_call(:stats, _from, state) do
    {:reply, state, state}
  end

  # ── Helpers ───────────────────────────────────────────────────────────────

  defp bump(state), do: %{state | invalidation_count: state.invalidation_count + 1}

  defp log_invalidation(event, id) do
    Logger.debug("[CacheInvalidator] #{event} → invalidated cache for #{id}")

    :telemetry.execute(
      [:cgraph, :cache, :invalidator, :invalidate],
      %{count: 1},
      %{event: event, id: id, source: :pubsub}
    )
  end
end
