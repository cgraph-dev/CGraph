defmodule CGraph.Performance.RequestCoalescing do
  @moduledoc """
  Singleflight-style request coalescing.

  Deduplicates concurrent identical requests so only one call executes
  the actual work, and all concurrent callers receive the same result.

  Useful for:
  - Expensive database queries triggered by multiple concurrent users
  - External API calls (e.g., avatar lookups, link previews)
  - Cache stampede prevention (many requests for same expired key)

  ## Usage

      # All concurrent calls with the same key share one execution
      {:ok, result} = RequestCoalescing.execute("user:\#{user_id}", fn ->
        Repo.get(User, user_id)
      end)

      # With TTL — result is cached and reused for subsequent calls
      {:ok, result} = RequestCoalescing.execute("forum:trending", fn ->
        CGraph.Forums.list_trending_forums(limit: 10)
      end, ttl: :timer.seconds(5))

  ## How it works

  1. Caller requests execution with a key
  2. If no in-flight request exists for that key, the function executes
  3. If an in-flight request exists, the caller waits for its result
  4. Once complete, all waiters receive the same result
  5. With TTL, the result is briefly cached to coalesce subsequent bursts
  """

  use GenServer
  require Logger

  @type key :: term()
  @type result :: {:ok, term()} | {:error, term()}

  # ── Client API ──────────────────────────────────────────────

  @doc "Starts the process and links it to the current process."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, opts, name: name)
  end

  @doc """
  Execute a function with request coalescing.

  If another call with the same `key` is already in flight, this call
  waits for its result instead of executing `fun` again.

  ## Options

    * `:ttl` — milliseconds to cache the result after completion (default: 0, no caching)
    * `:timeout` — max milliseconds to wait for result (default: 15_000)
    * `:server` — target GenServer name (default: `#{__MODULE__}`)
  """
  @spec execute(key(), (-> term()), keyword()) :: result()
  def execute(key, fun, opts \\ []) when is_function(fun, 0) do
    server = Keyword.get(opts, :server, __MODULE__)
    timeout = Keyword.get(opts, :timeout, 15_000)
    ttl = Keyword.get(opts, :ttl, 0)

    start_time = System.monotonic_time()

    case GenServer.call(server, {:execute, key, fun, ttl}, timeout) do
      {:ok, _value} = ok ->
        emit_telemetry(:hit, key, start_time)
        ok

      {:error, _reason} = err ->
        emit_telemetry(:error, key, start_time)
        err

      {:coalesced, ref} ->
        # Wait for the in-flight request to complete
        receive do
          {^ref, {:ok, _value} = ok} ->
            emit_telemetry(:coalesced, key, start_time)
            ok

          {^ref, {:error, _reason} = err} ->
            emit_telemetry(:coalesced_error, key, start_time)
            err
        after
          timeout ->
            emit_telemetry(:timeout, key, start_time)
            {:error, :timeout}
        end
    end
  end

  @doc "Return stats about in-flight and cached entries."
  @spec stats(GenServer.server()) :: map()
  def stats(server \\ __MODULE__) do
    GenServer.call(server, :stats)
  end

  @doc "Clear all cached results (does not cancel in-flight requests)."
  @spec clear_cache(GenServer.server()) :: :ok
  def clear_cache(server \\ __MODULE__) do
    GenServer.cast(server, :clear_cache)
  end

  # ── Server Implementation ──────────────────────────────────

  @impl true
  @spec init(term()) :: {:ok, map()}
  def init(_opts) do
    state = %{
      # key => %{task: Task.t(), waiters: [ref], ttl: integer()}
      in_flight: %{},
      # key => %{value: term(), expires_at: integer()}
      cache: %{},
      # stats
      total_calls: 0,
      coalesced_calls: 0,
      cache_hits: 0
    }

    {:ok, state}
  end

  @impl true
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  def handle_call({:execute, key, fun, ttl}, {caller_pid, _tag}, state) do
    now = System.monotonic_time(:millisecond)

    cond do
      # Check TTL cache first
      (cached = state.cache[key]) != nil && cached.expires_at > now ->
        {:reply, {:ok, cached.value},
         %{state | total_calls: state.total_calls + 1, cache_hits: state.cache_hits + 1}}

      # Check in-flight request
      flight = state.in_flight[key] ->
        ref = make_ref()
        waiter = {caller_pid, ref}
        updated_flight = %{flight | waiters: [waiter | flight.waiters]}

        {:reply, {:coalesced, ref},
         %{state |
           in_flight: Map.put(state.in_flight, key, updated_flight),
           total_calls: state.total_calls + 1,
           coalesced_calls: state.coalesced_calls + 1
         }}

      # No cache, no in-flight — start execution
      true ->
        parent = self()
        task = Task.Supervisor.async_nolink(CGraph.TaskSupervisor, fn ->
          try do
            result = fun.()
            send(parent, {:flight_complete, key, {:ok, result}, ttl})
          rescue
            e ->
              send(parent, {:flight_complete, key, {:error, Exception.message(e)}, 0})
          end
        end)

        flight = %{task: task, waiters: [], ttl: ttl}
        ref = make_ref()
        waiter = {caller_pid, ref}
        flight = %{flight | waiters: [waiter]}

        {:reply, {:coalesced, ref},
         %{state |
           in_flight: Map.put(state.in_flight, key, flight),
           total_calls: state.total_calls + 1
         }}
    end
  end

  @impl true
  def handle_call(:stats, _from, state) do
    now = System.monotonic_time(:millisecond)
    active_cache = Enum.count(state.cache, fn {_k, v} -> v.expires_at > now end)

    stats = %{
      in_flight: map_size(state.in_flight),
      cached: active_cache,
      total_calls: state.total_calls,
      coalesced_calls: state.coalesced_calls,
      cache_hits: state.cache_hits,
      coalesce_ratio: safe_ratio(state.coalesced_calls + state.cache_hits, state.total_calls)
    }

    {:reply, stats, state}
  end

  @impl true
  @spec handle_info(term(), map()) :: {:noreply, map()}
  def handle_info({:flight_complete, key, result, ttl}, state) do
    case Map.pop(state.in_flight, key) do
      {nil, _} ->
        {:noreply, state}

      {flight, remaining_flights} ->
        # Notify all waiters
        for {pid, ref} <- flight.waiters do
          send(pid, {ref, result})
        end

        # Cache the result if TTL > 0 and successful
        cache =
          case {result, ttl} do
            {{:ok, value}, ttl} when ttl > 0 ->
              expires_at = System.monotonic_time(:millisecond) + ttl
              Map.put(state.cache, key, %{value: value, expires_at: expires_at})

            _ ->
              state.cache
          end

        # Schedule cache cleanup
        if ttl > 0, do: Process.send_after(self(), {:expire_cache, key}, ttl + 100)

        {:noreply, %{state | in_flight: remaining_flights, cache: cache}}
    end
  end

  @impl true
  def handle_info({:expire_cache, key}, state) do
    now = System.monotonic_time(:millisecond)

    cache =
      case state.cache[key] do
        %{expires_at: exp} when exp <= now -> Map.delete(state.cache, key)
        _ -> state.cache
      end

    {:noreply, %{state | cache: cache}}
  end

  # Task completion messages
  @impl true
  def handle_info({ref, _result}, state) when is_reference(ref) do
    Process.demonitor(ref, [:flush])
    {:noreply, state}
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, _pid, _reason}, state) do
    {:noreply, state}
  end

  @impl true
  @spec handle_cast(term(), map()) :: {:noreply, map()}
  def handle_cast(:clear_cache, state) do
    {:noreply, %{state | cache: %{}}}
  end

  # ── Private ────────────────────────────────────────────────

  defp safe_ratio(_numerator, 0), do: 0.0
  defp safe_ratio(numerator, denominator), do: Float.round(numerator / denominator * 100, 1)

  defp emit_telemetry(event, key, start_time) do
    duration = System.monotonic_time() - start_time

    :telemetry.execute(
      [:cgraph, :request_coalescing, event],
      %{duration: duration},
      %{key: key}
    )
  end
end
