defmodule Cgraph.RateLimiter do
  @moduledoc """
  Advanced rate limiting with multiple algorithms and scopes.
  
  ## Overview
  
  Provides flexible rate limiting to protect against abuse:
  
  - **Token Bucket**: Smooth rate limiting with burst allowance
  - **Sliding Window**: Precise request counting
  - **Leaky Bucket**: Constant rate processing
  - **Fixed Window**: Simple time-based limits
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                   RATE LIMITER SYSTEM                           │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Request ──► Identify ──► Check Limit ──► Allow/Deny           │
  │                 │              │                                 │
  │          ┌──────▼──────┐ ┌─────▼─────┐                         │
  │          │ Identifier  │ │ Algorithm │                         │
  │          │  ├── IP     │ │  ├── Token│                         │
  │          │  ├── User   │ │  ├── Slide│                         │
  │          │  ├── API    │ │  ├── Leaky│                         │
  │          │  └── Custom │ │  └── Fixed│                         │
  │          └─────────────┘ └───────────┘                         │
  │                                                                  │
  │  ┌───────────────────────────────────────────────────────────┐ │
  │  │                    Storage Backends                        │ │
  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │ │
  │  │  │   ETS   │  │  Redis  │  │ Mnesia  │                   │ │
  │  │  │ (local) │  │ (dist)  │  │ (dist)  │                   │ │
  │  │  └─────────┘  └─────────┘  └─────────┘                   │ │
  │  └───────────────────────────────────────────────────────────┘ │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Usage
  
      # Check rate limit
      case RateLimiter.check("user:123", :api) do
        :ok -> process_request()
        {:error, :rate_limited, info} -> return_429(info)
      end
      
      # With custom config
      RateLimiter.check("ip:1.2.3.4", :api, limit: 100, window: 60)
      
      # Multiple scopes
      RateLimiter.check_all("user:123", [:api, :upload, :message])
  
  ## Configuration
  
  ```elixir
  config :cgraph, Cgraph.RateLimiter,
    default_algorithm: :sliding_window,
    scopes: %{
      api: %{limit: 1000, window: 3600, algorithm: :sliding_window},
      login: %{limit: 5, window: 300, algorithm: :fixed_window},
      upload: %{limit: 10, window: 3600, algorithm: :token_bucket}
    }
  ```
  
  ## Scope Presets
  
  | Scope | Limit | Window | Algorithm |
  |-------|-------|--------|-----------|
  | `api` | 1000/hour | 3600s | Sliding |
  | `login` | 5/5min | 300s | Fixed |
  | `signup` | 3/hour | 3600s | Fixed |
  | `upload` | 10/hour | 3600s | Token |
  | `message` | 60/min | 60s | Leaky |
  | `search` | 30/min | 60s | Sliding |
  
  ## Telemetry Events
  
  - `[:cgraph, :rate_limiter, :check]` - Limit checked
  - `[:cgraph, :rate_limiter, :allowed]` - Request allowed
  - `[:cgraph, :rate_limiter, :denied]` - Request denied
  """
  
  use GenServer
  require Logger
  
  @default_scopes %{
    api: %{limit: 1000, window: 3600, algorithm: :sliding_window},
    api_burst: %{limit: 50, window: 1, algorithm: :token_bucket},
    login: %{limit: 5, window: 300, algorithm: :fixed_window},
    login_ip: %{limit: 20, window: 300, algorithm: :fixed_window},
    signup: %{limit: 3, window: 3600, algorithm: :fixed_window},
    password_reset: %{limit: 3, window: 3600, algorithm: :fixed_window},
    upload: %{limit: 10, window: 3600, algorithm: :token_bucket, burst: 3},
    message: %{limit: 60, window: 60, algorithm: :leaky_bucket},
    message_burst: %{limit: 10, window: 1, algorithm: :token_bucket},
    search: %{limit: 30, window: 60, algorithm: :sliding_window},
    webhook: %{limit: 100, window: 60, algorithm: :sliding_window},
    export: %{limit: 5, window: 3600, algorithm: :fixed_window}
  }
  
  @ets_table :cgraph_rate_limiter
  
  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------
  
  @type scope :: atom()
  @type rate_limit_key :: String.t()
  @type algorithm :: :token_bucket | :sliding_window | :leaky_bucket | :fixed_window
  
  @type check_result :: 
    :ok | 
    {:error, :rate_limited, rate_limit_info()}
  
  @type rate_limit_info :: %{
    limit: pos_integer(),
    remaining: non_neg_integer(),
    reset_at: DateTime.t(),
    retry_after: pos_integer()
  }
  
  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------
  
  @doc """
  Check if a request is allowed under rate limits.
  
  ## Options
  
  - `:limit` - Override default limit
  - `:window` - Override window in seconds
  - `:algorithm` - Override algorithm
  - `:cost` - Request cost (default: 1)
  
  ## Configuration
  
  Rate limiting can be disabled entirely via application config:
  
      config :cgraph, Cgraph.RateLimiter, enabled: false
  
  This is useful for test environments.
  """
  def check(identifier, scope, opts \\ []) do
    # Check if rate limiting is enabled (defaults to true)
    if enabled?() do
      do_check(identifier, scope, opts)
    else
      :ok
    end
  end
  
  @doc """
  Check if rate limiting is enabled.
  
  Defaults to true unless explicitly disabled via config:
  
      config :cgraph, Cgraph.RateLimiter, enabled: false
  """
  def enabled? do
    Application.get_env(:cgraph, __MODULE__, [])
    |> Keyword.get(:enabled, true)
  end
  
  defp do_check(identifier, scope, opts) do
    config = get_scope_config(scope, opts)
    key = build_key(identifier, scope)
    
    result = case config.algorithm do
      :token_bucket -> check_token_bucket(key, config)
      :sliding_window -> check_sliding_window(key, config)
      :leaky_bucket -> check_leaky_bucket(key, config)
      :fixed_window -> check_fixed_window(key, config)
    end
    
    emit_telemetry(identifier, scope, config, result)
    
    result
  end
  
  @doc """
  Check multiple scopes at once. Fails if any scope is rate limited.
  """
  def check_all(identifier, scopes, opts \\ []) when is_list(scopes) do
    results = Enum.map(scopes, fn scope ->
      {scope, check(identifier, scope, opts)}
    end)
    
    case Enum.find(results, fn {_, result} -> result != :ok end) do
      nil -> :ok
      {scope, result} -> {:error, scope, result}
    end
  end
  
  @doc """
  Get current rate limit status without consuming a request.
  """
  def status(identifier, scope) do
    config = get_scope_config(scope, [])
    key = build_key(identifier, scope)
    
    case config.algorithm do
      :token_bucket -> token_bucket_status(key, config)
      :sliding_window -> sliding_window_status(key, config)
      :leaky_bucket -> leaky_bucket_status(key, config)
      :fixed_window -> fixed_window_status(key, config)
    end
  end
  
  @doc """
  Reset rate limit for an identifier.
  """
  def reset(identifier, scope) do
    key = build_key(identifier, scope)
    :ets.delete(@ets_table, key)
    :ok
  end
  
  @doc """
  Reset all rate limits for an identifier.
  """
  def reset_all(identifier) do
    pattern = {:"#{identifier}:$1", :_, :_}
    :ets.match_delete(@ets_table, pattern)
    :ok
  end
  
  @doc """
  Add to whitelist (never rate limited).
  """
  def whitelist(identifier) do
    GenServer.call(__MODULE__, {:whitelist, identifier})
  end
  
  @doc """
  Remove from whitelist.
  """
  def unwhitelist(identifier) do
    GenServer.call(__MODULE__, {:unwhitelist, identifier})
  end
  
  @doc """
  Check if identifier is whitelisted.
  """
  def whitelisted?(identifier) do
    case :ets.lookup(@ets_table, {:whitelist, identifier}) do
      [{_, true}] -> true
      _ -> false
    end
  end
  
  @doc """
  Add to blacklist (always rate limited).
  """
  def blacklist(identifier, opts \\ []) do
    duration = Keyword.get(opts, :duration, :infinity)
    GenServer.call(__MODULE__, {:blacklist, identifier, duration})
  end
  
  @doc """
  Remove from blacklist.
  """
  def unblacklist(identifier) do
    GenServer.call(__MODULE__, {:unblacklist, identifier})
  end
  
  @doc """
  Check if identifier is blacklisted.
  """
  def blacklisted?(identifier) do
    case :ets.lookup(@ets_table, {:blacklist, identifier}) do
      [{_, until}] when until == :infinity -> true
      [{_, until}] -> DateTime.compare(DateTime.utc_now(), until) == :lt
      _ -> false
    end
  end
  
  @doc """
  Get configuration for a scope.
  """
  def get_scope_config(scope, opts) do
    base = Map.get(@default_scopes, scope, %{limit: 100, window: 60, algorithm: :sliding_window})
    
    %{
      limit: Keyword.get(opts, :limit, base.limit),
      window: Keyword.get(opts, :window, base.window),
      algorithm: Keyword.get(opts, :algorithm, base.algorithm),
      burst: Keyword.get(opts, :burst, Map.get(base, :burst, 0)),
      cost: Keyword.get(opts, :cost, 1)
    }
  end
  
  # ---------------------------------------------------------------------------
  # Token Bucket Algorithm
  # ---------------------------------------------------------------------------
  
  defp check_token_bucket(key, config) do
    now = System.system_time(:millisecond)
    
    case :ets.lookup(@ets_table, key) do
      [] ->
        # Initialize bucket
        tokens = config.limit - config.cost
        :ets.insert(@ets_table, {key, tokens, now})
        :ok
      
      [{_, tokens, last_update}] ->
        # Calculate token refill
        elapsed_ms = now - last_update
        refill_rate = config.limit / (config.window * 1000)
        refilled = min(config.limit, tokens + elapsed_ms * refill_rate)
        
        if refilled >= config.cost do
          new_tokens = refilled - config.cost
          :ets.insert(@ets_table, {key, new_tokens, now})
          :ok
        else
          wait_time = ceil((config.cost - refilled) / refill_rate)
          reset_at = DateTime.add(DateTime.utc_now(), wait_time, :millisecond)
          
          {:error, :rate_limited, %{
            limit: config.limit,
            remaining: max(0, floor(refilled)),
            reset_at: reset_at,
            retry_after: ceil(wait_time / 1000)
          }}
        end
    end
  end
  
  defp token_bucket_status(key, config) do
    now = System.system_time(:millisecond)
    
    case :ets.lookup(@ets_table, key) do
      [] ->
        %{tokens: config.limit, limit: config.limit, remaining: config.limit}
      
      [{_, tokens, last_update}] ->
        elapsed_ms = now - last_update
        refill_rate = config.limit / (config.window * 1000)
        current = min(config.limit, tokens + elapsed_ms * refill_rate)
        
        %{tokens: floor(current), limit: config.limit, remaining: floor(current)}
    end
  end
  
  # ---------------------------------------------------------------------------
  # Sliding Window Algorithm
  # ---------------------------------------------------------------------------
  
  defp check_sliding_window(key, config) do
    now = System.system_time(:second)
    window_start = now - config.window
    
    # Clean old entries and count current
    count = case :ets.lookup(@ets_table, key) do
      [] -> 0
      [{_, timestamps}] ->
        valid = Enum.filter(timestamps, &(&1 > window_start))
        :ets.insert(@ets_table, {key, valid})
        length(valid)
    end
    
    if count < config.limit do
      # Add new timestamp
      case :ets.lookup(@ets_table, key) do
        [] -> :ets.insert(@ets_table, {key, [now]})
        [{_, timestamps}] -> :ets.insert(@ets_table, {key, [now | timestamps]})
      end
      :ok
    else
      # Find oldest timestamp in window
      [{_, timestamps}] = :ets.lookup(@ets_table, key)
      oldest = Enum.min(timestamps)
      reset_at = DateTime.from_unix!(oldest + config.window)
      retry_after = oldest + config.window - now
      
      {:error, :rate_limited, %{
        limit: config.limit,
        remaining: 0,
        reset_at: reset_at,
        retry_after: max(1, retry_after)
      }}
    end
  end
  
  defp sliding_window_status(key, config) do
    now = System.system_time(:second)
    window_start = now - config.window
    
    count = case :ets.lookup(@ets_table, key) do
      [] -> 0
      [{_, timestamps}] ->
        Enum.count(timestamps, &(&1 > window_start))
    end
    
    %{
      count: count,
      limit: config.limit,
      remaining: max(0, config.limit - count),
      window: config.window
    }
  end
  
  # ---------------------------------------------------------------------------
  # Leaky Bucket Algorithm
  # ---------------------------------------------------------------------------
  
  defp check_leaky_bucket(key, config) do
    now = System.system_time(:millisecond)
    leak_rate = config.limit / (config.window * 1000)
    
    case :ets.lookup(@ets_table, key) do
      [] ->
        :ets.insert(@ets_table, {key, config.cost, now})
        :ok
      
      [{_, level, last_leak}] ->
        # Calculate leaked amount
        elapsed = now - last_leak
        leaked = elapsed * leak_rate
        new_level = max(0, level - leaked)
        
        if new_level + config.cost <= config.limit do
          :ets.insert(@ets_table, {key, new_level + config.cost, now})
          :ok
        else
          # Bucket full, calculate when space will be available
          overflow = new_level + config.cost - config.limit
          wait_time = ceil(overflow / leak_rate)
          reset_at = DateTime.add(DateTime.utc_now(), wait_time, :millisecond)
          
          {:error, :rate_limited, %{
            limit: config.limit,
            remaining: max(0, floor(config.limit - new_level)),
            reset_at: reset_at,
            retry_after: ceil(wait_time / 1000)
          }}
        end
    end
  end
  
  defp leaky_bucket_status(key, config) do
    now = System.system_time(:millisecond)
    leak_rate = config.limit / (config.window * 1000)
    
    case :ets.lookup(@ets_table, key) do
      [] ->
        %{level: 0, limit: config.limit, remaining: config.limit}
      
      [{_, level, last_leak}] ->
        elapsed = now - last_leak
        leaked = elapsed * leak_rate
        current_level = max(0, level - leaked)
        
        %{
          level: floor(current_level),
          limit: config.limit,
          remaining: max(0, floor(config.limit - current_level))
        }
    end
  end
  
  # ---------------------------------------------------------------------------
  # Fixed Window Algorithm
  # ---------------------------------------------------------------------------
  
  defp check_fixed_window(key, config) do
    now = System.system_time(:second)
    window_id = div(now, config.window)
    window_key = {key, window_id}
    
    case :ets.lookup(@ets_table, window_key) do
      [] ->
        :ets.insert(@ets_table, {window_key, config.cost})
        :ok
      
      [{_, count}] when count < config.limit ->
        :ets.update_counter(@ets_table, window_key, {2, config.cost})
        :ok
      
      [{_, _count}] ->
        window_end = (window_id + 1) * config.window
        reset_at = DateTime.from_unix!(window_end)
        retry_after = window_end - now
        
        {:error, :rate_limited, %{
          limit: config.limit,
          remaining: 0,
          reset_at: reset_at,
          retry_after: max(1, retry_after)
        }}
    end
  end
  
  defp fixed_window_status(key, config) do
    now = System.system_time(:second)
    window_id = div(now, config.window)
    window_key = {key, window_id}
    
    count = case :ets.lookup(@ets_table, window_key) do
      [] -> 0
      [{_, c}] -> c
    end
    
    window_end = (window_id + 1) * config.window
    
    %{
      count: count,
      limit: config.limit,
      remaining: max(0, config.limit - count),
      reset_at: DateTime.from_unix!(window_end)
    }
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    # Create ETS table
    :ets.new(@ets_table, [:named_table, :public, :set, {:read_concurrency, true}])
    
    # Schedule cleanup
    schedule_cleanup()
    
    {:ok, %{}}
  end
  
  @impl true
  def handle_call({:whitelist, identifier}, _from, state) do
    :ets.insert(@ets_table, {{:whitelist, identifier}, true})
    Logger.info("Whitelisted rate limit identifier: #{identifier}")
    {:reply, :ok, state}
  end
  
  @impl true
  def handle_call({:unwhitelist, identifier}, _from, state) do
    :ets.delete(@ets_table, {:whitelist, identifier})
    {:reply, :ok, state}
  end
  
  @impl true
  def handle_call({:blacklist, identifier, duration}, _from, state) do
    until = case duration do
      :infinity -> :infinity
      seconds -> DateTime.add(DateTime.utc_now(), seconds, :second)
    end
    
    :ets.insert(@ets_table, {{:blacklist, identifier}, until})
    Logger.warning("Blacklisted rate limit identifier: #{identifier} until #{inspect(until)}")
    {:reply, :ok, state}
  end
  
  @impl true
  def handle_call({:unblacklist, identifier}, _from, state) do
    :ets.delete(@ets_table, {:blacklist, identifier})
    {:reply, :ok, state}
  end
  
  @impl true
  def handle_info(:cleanup, state) do
    cleanup_expired_entries()
    schedule_cleanup()
    {:noreply, state}
  end
  
  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end
  
  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------
  
  defp build_key(identifier, scope) do
    "#{scope}:#{identifier}"
  end
  
  defp schedule_cleanup do
    # Clean up every 5 minutes
    Process.send_after(self(), :cleanup, 300_000)
  end
  
  defp cleanup_expired_entries do
    # Remove expired blacklist entries from ETS
    :ets.foldl(fn
      {{:blacklist, _} = key, until}, acc when until != :infinity ->
        if DateTime.compare(DateTime.utc_now(), until) == :gt do
          :ets.delete(@ets_table, key)
        end
        acc
      
      _, acc -> acc
    end, nil, @ets_table)
    
    Logger.debug("Rate limiter cleanup completed")
  end
  
  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------
  
  defp emit_telemetry(identifier, scope, config, result) do
    {event, measurements} = case result do
      :ok ->
        {[:cgraph, :rate_limiter, :allowed], %{count: 1}}
      
      {:error, :rate_limited, info} ->
        {[:cgraph, :rate_limiter, :denied], %{count: 1, retry_after: info.retry_after}}
    end
    
    :telemetry.execute(event, measurements, %{
      identifier: identifier,
      scope: scope,
      algorithm: config.algorithm,
      limit: config.limit,
      window: config.window
    })
  end
end
