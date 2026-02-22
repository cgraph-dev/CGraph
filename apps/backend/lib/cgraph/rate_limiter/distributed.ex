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
  alias __MODULE__.{RedisBackend, EtsFallback}

  @ets_fallback_table :cgraph_rate_limiter_fallback
  @key_prefix "rl:"

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
  @spec start_link(keyword()) :: GenServer.on_start()
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
  @spec check(rate_limit_identifier(), scope(), keyword()) :: check_result()
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
  @spec check_all(rate_limit_identifier(), [scope()], keyword()) :: check_result()
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
  @spec status(rate_limit_identifier(), scope()) :: rate_limit_info()
  def status(identifier, scope) do
    config = get_config(scope)
    key = build_key(identifier, scope, config.algorithm)

    case RedisBackend.status(key, config) do
      {:ok, status} -> status
      {:error, _} -> EtsFallback.status(key, config)
    end
  end

  @doc """
  Reset rate limit for an identifier.
  """
  @spec reset(rate_limit_identifier(), scope()) :: :ok
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
  @spec enabled?() :: boolean()
  def enabled? do
    Application.get_env(:cgraph, __MODULE__, [])
    |> Keyword.get(:enabled, true)
  end

  @doc """
  Check Redis connection health.
  """
  @spec redis_healthy?() :: boolean()
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
    RedisBackend.load_scripts()

    # Schedule cleanup
    schedule_cleanup()

    {:ok, %{script_shas: %{}}}
  end

  @impl true
  def handle_info(:cleanup, state) do
    EtsFallback.cleanup()
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

    case RedisBackend.check(key, config) do
      {:ok, result} ->
        emit_telemetry(identifier, scope, config, result)
        result

      {:error, reason} when require_redis ->
        Logger.warning("rate_limiter_redis_error_required", reason: inspect(reason))
        {:error, :redis_unavailable}

      {:error, reason} ->
        Logger.debug("rate_limiter_redis_fallback", reason: inspect(reason))
        result = EtsFallback.check(key, config)
        emit_telemetry(identifier, scope, config, result)
        result
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

  defp schedule_cleanup do
    # Clean up old ETS entries every 5 minutes
    Process.send_after(self(), :cleanup, 300_000)
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
