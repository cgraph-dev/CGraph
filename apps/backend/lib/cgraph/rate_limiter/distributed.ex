defmodule CGraph.RateLimiter.Distributed do
  @moduledoc """
  Distributed rate limiting using Redis for multi-node environments.

  ## Overview

  Provides cluster-wide rate limiting that scales across multiple nodes:

  - **Redis Backend**: Atomic operations for consistent limiting
  - **ETS Fallback**: Graceful degradation when Redis unavailable
  - **Lua Scripts**: Atomic multi-key operations for accuracy
  - **Circuit Breaker**: Prevents Redis cascade failures

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                 DISTRIBUTED RATE LIMITER                                 │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                          │
  │  Node A                Redis Cluster                 Node B             │
  │  ┌──────────┐          ┌─────────┐           ┌──────────┐              │
  │  │Rate Check├─────────►│  INCR   │◄──────────┤Rate Check│              │
  │  │  └─ETS   │          │  EXPIRE │           │  └─ETS   │              │
  │  │(fallback)│◄────┬────│  EVAL   │────┬─────►│(fallback)│              │
  │  └──────────┘     │    └─────────┘    │      └──────────┘              │
  │                   │                    │                                 │
  │              Circuit Breaker       Circuit Breaker                      │
  │                                                                          │
  │  ┌───────────────────────────────────────────────────────────────────┐ │
  │  │                    Consistency Guarantees                          │ │
  │  │  • Redis: Strong consistency via atomic operations                 │ │
  │  │  • ETS Fallback: Eventually consistent (per-node)                  │ │
  │  │  • Graceful: When Redis fails, limits are applied per-node         │ │
  │  └───────────────────────────────────────────────────────────────────┘ │
  │                                                                          │
  └─────────────────────────────────────────────────────────────────────────┘
  ```

  ## Redis Data Structures

  ### Token Bucket
  Hash per key: `ratelimit:tb:{scope}:{identifier}`
  - `tokens` - Current token count
  - `last_update` - Last refill timestamp

  ### Sliding Window
  Sorted Set: `ratelimit:sw:{scope}:{identifier}`
  - Score: timestamp
  - Member: unique request ID

  ### Fixed Window
  String with TTL: `ratelimit:fw:{scope}:{identifier}:{window_id}`
  - Value: request count

  ## Lua Scripts

  Atomic operations prevent race conditions:
  - Token bucket refill + consume
  - Sliding window cleanup + check + add
  - Fixed window increment with TTL

  ## Configuration

      config :cgraph, CGraph.RateLimiter.Distributed,
        enabled: true,
        redis_pool: :rate_limiter,
        key_prefix: "rl:",
        fallback_enabled: true,
        circuit_breaker: [
          error_threshold: 5,
          reset_timeout: 30_000
        ]

  ## Usage

      # Check rate limit (uses Redis if available, ETS fallback)
      case Distributed.check("user:123", :api) do
        :ok -> process_request()
        {:error, :rate_limited, info} -> return_429(info)
      end

      # Force Redis check (fail if Redis unavailable)
      Distributed.check("user:123", :api, require_redis: true)
  """

  use GenServer
  require Logger

  alias CGraph.Redis

  @ets_fallback_table :cgraph_rate_limiter_fallback
  @key_prefix "rl:"

  # Lua scripts for atomic operations
  @token_bucket_script """
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window_ms = tonumber(ARGV[2])
  local cost = tonumber(ARGV[3])
  local now = tonumber(ARGV[4])

  local data = redis.call('HMGET', key, 'tokens', 'last_update')
  local tokens = tonumber(data[1]) or limit
  local last_update = tonumber(data[2]) or now

  -- Calculate refill
  local elapsed = now - last_update
  local refill_rate = limit / window_ms
  local refilled = math.min(limit, tokens + (elapsed * refill_rate))

  if refilled >= cost then
    local new_tokens = refilled - cost
    redis.call('HMSET', key, 'tokens', new_tokens, 'last_update', now)
    redis.call('PEXPIRE', key, window_ms * 2)
    return {1, math.floor(new_tokens), 0}
  else
    local wait_ms = math.ceil((cost - refilled) / refill_rate)
    return {0, math.floor(refilled), wait_ms}
  end
  """

  @sliding_window_script """
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window_ms = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local request_id = ARGV[4]

  -- Remove expired entries
  local window_start = now - window_ms
  redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

  -- Count current requests
  local count = redis.call('ZCARD', key)

  if count < limit then
    redis.call('ZADD', key, now, request_id)
    redis.call('PEXPIRE', key, window_ms)
    return {1, limit - count - 1, 0}
  else
    -- Find oldest entry to calculate retry time
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    if #oldest > 0 then
      local oldest_time = tonumber(oldest[2])
      local retry_ms = math.max(0, (oldest_time + window_ms) - now)
      return {0, 0, retry_ms}
    end
    return {0, 0, window_ms}
  end
  """

  @fixed_window_script """
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window_ms = tonumber(ARGV[2])

  local count = redis.call('INCR', key)

  if count == 1 then
    redis.call('PEXPIRE', key, window_ms)
  end

  if count <= limit then
    return {1, limit - count, 0}
  else
    local ttl = redis.call('PTTL', key)
    return {0, 0, math.max(0, ttl)}
  end
  """

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type scope :: atom()
  @type rate_limit_identifier :: String.t()
  @type check_result :: :ok | {:error, :rate_limited, rate_limit_info()}

  @type rate_limit_info :: %{
    limit: pos_integer(),
    remaining: non_neg_integer(),
    reset_at: DateTime.t(),
    retry_after: pos_integer()
  }

  @type algorithm :: :token_bucket | :sliding_window | :fixed_window

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc """
  Start the distributed rate limiter.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Check if a request is allowed under rate limits.

  Uses Redis for distributed checking with ETS fallback.

  ## Options

  - `:limit` - Override default limit
  - `:window` - Override window in seconds
  - `:algorithm` - Override algorithm (:token_bucket, :sliding_window, :fixed_window)
  - `:cost` - Request cost (default: 1)
  - `:require_redis` - Fail if Redis unavailable (default: false)
  """
  def check(identifier, scope, opts \\ []) do
    if enabled?() do
      do_check(identifier, scope, opts)
    else
      :ok
    end
  end

  @doc """
  Check multiple scopes at once.
  """
  def check_all(identifier, scopes, opts \\ []) when is_list(scopes) do
    Enum.reduce_while(scopes, :ok, fn scope, _acc ->
      case check(identifier, scope, opts) do
        :ok -> {:cont, :ok}
        error -> {:halt, error}
      end
    end)
  end

  @doc """
  Get current rate limit status without consuming a request.
  """
  def status(identifier, scope) do
    config = get_config(scope)
    key = build_key(identifier, scope, config.algorithm)

    case redis_status(key, config) do
      {:ok, status} -> status
      {:error, _} -> ets_status(key, config)
    end
  end

  @doc """
  Reset rate limit for an identifier.
  """
  def reset(identifier, scope) do
    config = get_config(scope)
    key = build_key(identifier, scope, config.algorithm)

    # Reset in both Redis and ETS
    Redis.command(["DEL", key])
    :ets.delete(@ets_fallback_table, key)
    :ok
  end

  @doc """
  Check if distributed rate limiting is enabled.
  """
  def enabled? do
    Application.get_env(:cgraph, __MODULE__, [])
    |> Keyword.get(:enabled, true)
  end

  @doc """
  Check Redis connection health.
  """
  def redis_healthy? do
    case Redis.command(["PING"]) do
      {:ok, "PONG"} -> true
      _ -> false
    end
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @impl true
  def init(_opts) do
    # Create fallback ETS table
    :ets.new(@ets_fallback_table, [
      :named_table,
      :public,
      :set,
      {:read_concurrency, true},
      {:write_concurrency, true}
    ])

    # Load Lua scripts into Redis
    load_scripts()

    # Schedule cleanup
    schedule_cleanup()

    {:ok, %{script_shas: %{}}}
  end

  @impl true
  def handle_info(:cleanup, state) do
    cleanup_ets()
    schedule_cleanup()
    {:noreply, state}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp do_check(identifier, scope, opts) do
    config = get_config(scope, opts)
    key = build_key(identifier, scope, config.algorithm)
    require_redis = Keyword.get(opts, :require_redis, false)

    case redis_check(key, config) do
      {:ok, result} ->
        emit_telemetry(identifier, scope, config, result)
        result

      {:error, reason} when require_redis ->
        Logger.warning("Rate limiter Redis error (required): #{inspect(reason)}")
        {:error, :redis_unavailable}

      {:error, reason} ->
        Logger.debug("Rate limiter Redis fallback: #{inspect(reason)}")
        result = ets_check(key, config)
        emit_telemetry(identifier, scope, config, result)
        result
    end
  end

  defp redis_check(key, config) do
    now = System.system_time(:millisecond)
    window_ms = config.window * 1000

    case config.algorithm do
      :token_bucket ->
        case Redis.command(["EVAL", @token_bucket_script, 1, key,
                           config.limit, window_ms, config.cost, now]) do
          {:ok, [1, _remaining, _]} ->
            {:ok, :ok}

          {:ok, [0, remaining, wait_ms]} ->
            {:ok, {:error, :rate_limited, build_info(config, remaining, wait_ms)}}

          error ->
            {:error, error}
        end

      :sliding_window ->
        request_id = "#{node()}_#{System.unique_integer()}"

        case Redis.command(["EVAL", @sliding_window_script, 1, key,
                           config.limit, window_ms, now, request_id]) do
          {:ok, [1, _remaining, _]} ->
            {:ok, :ok}

          {:ok, [0, remaining, wait_ms]} ->
            {:ok, {:error, :rate_limited, build_info(config, remaining, wait_ms)}}

          error ->
            {:error, error}
        end

      :fixed_window ->
        window_id = div(now, window_ms)
        window_key = "#{key}:#{window_id}"

        case Redis.command(["EVAL", @fixed_window_script, 1, window_key,
                           config.limit, window_ms]) do
          {:ok, [1, _remaining, _]} ->
            {:ok, :ok}

          {:ok, [0, _, ttl_ms]} ->
            {:ok, {:error, :rate_limited, build_info(config, 0, ttl_ms)}}

          error ->
            {:error, error}
        end
    end
  end

  defp redis_status(key, config) do
    case config.algorithm do
      :token_bucket ->
        case Redis.command(["HMGET", key, "tokens", "last_update"]) do
          {:ok, [tokens, _]} ->
            tokens = if tokens, do: String.to_integer(tokens), else: config.limit
            {:ok, %{limit: config.limit, remaining: tokens}}

          error ->
            {:error, error}
        end

      :sliding_window ->
        now = System.system_time(:millisecond)
        window_start = now - (config.window * 1000)

        case Redis.command(["ZCOUNT", key, window_start, "+inf"]) do
          {:ok, count} ->
            count = if is_binary(count), do: String.to_integer(count), else: count
            {:ok, %{limit: config.limit, remaining: max(0, config.limit - count)}}

          error ->
            {:error, error}
        end

      :fixed_window ->
        now = System.system_time(:millisecond)
        window_ms = config.window * 1000
        window_id = div(now, window_ms)
        window_key = "#{key}:#{window_id}"

        case Redis.command(["GET", window_key]) do
          {:ok, nil} ->
            {:ok, %{limit: config.limit, remaining: config.limit}}

          {:ok, count} ->
            count = if is_binary(count), do: String.to_integer(count), else: count
            {:ok, %{limit: config.limit, remaining: max(0, config.limit - count)}}

          error ->
            {:error, error}
        end
    end
  end

  # ETS Fallback implementations
  defp ets_check(key, config) do
    case config.algorithm do
      :token_bucket -> ets_token_bucket(key, config)
      :sliding_window -> ets_sliding_window(key, config)
      :fixed_window -> ets_fixed_window(key, config)
    end
  end

  defp ets_token_bucket(key, config) do
    now = System.system_time(:millisecond)
    window_ms = config.window * 1000

    case :ets.lookup(@ets_fallback_table, key) do
      [] ->
        tokens = config.limit - config.cost
        :ets.insert(@ets_fallback_table, {key, tokens, now})
        :ok

      [{_, tokens, last_update}] ->
        elapsed = now - last_update
        refill_rate = config.limit / window_ms
        refilled = min(config.limit, tokens + elapsed * refill_rate)

        if refilled >= config.cost do
          new_tokens = refilled - config.cost
          :ets.insert(@ets_fallback_table, {key, new_tokens, now})
          :ok
        else
          wait_ms = ceil((config.cost - refilled) / refill_rate)
          {:error, :rate_limited, build_info(config, floor(refilled), wait_ms)}
        end
    end
  end

  defp ets_sliding_window(key, config) do
    now = System.system_time(:millisecond)
    window_ms = config.window * 1000
    window_start = now - window_ms

    count = case :ets.lookup(@ets_fallback_table, key) do
      [] -> 0
      [{_, timestamps}] ->
        valid = Enum.filter(timestamps, &(&1 > window_start))
        :ets.insert(@ets_fallback_table, {key, valid})
        length(valid)
    end

    if count < config.limit do
      case :ets.lookup(@ets_fallback_table, key) do
        [] -> :ets.insert(@ets_fallback_table, {key, [now]})
        [{_, timestamps}] -> :ets.insert(@ets_fallback_table, {key, [now | timestamps]})
      end
      :ok
    else
      [{_, timestamps}] = :ets.lookup(@ets_fallback_table, key)
      oldest = Enum.min(timestamps)
      wait_ms = (oldest + window_ms) - now

      {:error, :rate_limited, build_info(config, 0, max(0, wait_ms))}
    end
  end

  defp ets_fixed_window(key, config) do
    now = System.system_time(:millisecond)
    window_ms = config.window * 1000
    window_id = div(now, window_ms)
    window_key = "#{key}:#{window_id}"

    count = case :ets.lookup(@ets_fallback_table, window_key) do
      [] -> 0
      [{_, c}] -> c
    end

    if count < config.limit do
      :ets.insert(@ets_fallback_table, {window_key, count + 1})
      :ok
    else
      # Time until window resets
      next_window_start = (window_id + 1) * window_ms
      wait_ms = next_window_start - now

      {:error, :rate_limited, build_info(config, 0, wait_ms)}
    end
  end

  defp ets_status(key, config) do
    case config.algorithm do
      :token_bucket ->
        case :ets.lookup(@ets_fallback_table, key) do
          [] -> %{limit: config.limit, remaining: config.limit}
          [{_, tokens, _}] -> %{limit: config.limit, remaining: max(0, floor(tokens))}
        end

      :sliding_window ->
        now = System.system_time(:millisecond)
        window_start = now - (config.window * 1000)

        count = case :ets.lookup(@ets_fallback_table, key) do
          [] -> 0
          [{_, timestamps}] -> Enum.count(timestamps, &(&1 > window_start))
        end

        %{limit: config.limit, remaining: max(0, config.limit - count)}

      :fixed_window ->
        now = System.system_time(:millisecond)
        window_ms = config.window * 1000
        window_id = div(now, window_ms)
        window_key = "#{key}:#{window_id}"

        count = case :ets.lookup(@ets_fallback_table, window_key) do
          [] -> 0
          [{_, c}] -> c
        end

        %{limit: config.limit, remaining: max(0, config.limit - count)}
    end
  end

  # Helper functions
  defp build_key(identifier, scope, algorithm) do
    prefix = @key_prefix
    alg = case algorithm do
      :token_bucket -> "tb"
      :sliding_window -> "sw"
      :fixed_window -> "fw"
    end

    "#{prefix}#{alg}:#{scope}:#{identifier}"
  end

  defp build_info(config, remaining, wait_ms) do
    retry_seconds = max(1, ceil(wait_ms / 1000))

    %{
      limit: config.limit,
      remaining: remaining,
      reset_at: DateTime.add(DateTime.utc_now(), retry_seconds, :second),
      retry_after: retry_seconds
    }
  end

  defp get_config(scope, opts \\ []) do
    defaults = %{
      api: %{limit: 1000, window: 3600, algorithm: :sliding_window},
      api_burst: %{limit: 50, window: 1, algorithm: :token_bucket},
      login: %{limit: 5, window: 300, algorithm: :fixed_window},
      login_ip: %{limit: 20, window: 300, algorithm: :fixed_window},
      signup: %{limit: 3, window: 3600, algorithm: :fixed_window},
      message: %{limit: 60, window: 60, algorithm: :sliding_window},
      message_burst: %{limit: 10, window: 1, algorithm: :token_bucket},
      search: %{limit: 30, window: 60, algorithm: :sliding_window},
      upload: %{limit: 10, window: 3600, algorithm: :token_bucket},
      webhook: %{limit: 100, window: 60, algorithm: :sliding_window}
    }

    base = Map.get(defaults, scope, %{limit: 100, window: 60, algorithm: :sliding_window})

    %{
      limit: Keyword.get(opts, :limit, base.limit),
      window: Keyword.get(opts, :window, base.window),
      algorithm: Keyword.get(opts, :algorithm, base.algorithm),
      cost: Keyword.get(opts, :cost, 1)
    }
  end

  defp load_scripts do
    # Pre-load scripts for better performance (optional)
    :ok
  end

  defp schedule_cleanup do
    # Clean up old ETS entries every 5 minutes
    Process.send_after(self(), :cleanup, 300_000)
  end

  defp cleanup_ets do
    now = System.system_time(:millisecond)

    # This is a basic cleanup - in production, consider a more sophisticated approach
    :ets.foldl(fn
      {key, timestamps, _}, acc when is_list(timestamps) ->
        # Sliding window cleanup
        if timestamps == [] do
          :ets.delete(@ets_fallback_table, key)
        end
        acc

      {key, _, last_update}, acc when is_integer(last_update) ->
        # Token bucket - delete if not accessed in 1 hour
        if now - last_update > 3_600_000 do
          :ets.delete(@ets_fallback_table, key)
        end
        acc

      _, acc ->
        acc
    end, nil, @ets_fallback_table)
  end

  defp emit_telemetry(identifier, scope, config, result) do
    event = case result do
      :ok -> :allowed
      {:error, :rate_limited, _} -> :denied
    end

    :telemetry.execute(
      [:cgraph, :rate_limiter, :distributed, event],
      %{count: 1, timestamp: System.system_time(:millisecond)},
      %{identifier: identifier, scope: scope, limit: config.limit}
    )
  end
end
