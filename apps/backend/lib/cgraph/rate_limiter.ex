defmodule CGraph.RateLimiter do
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
  config :cgraph, CGraph.RateLimiter,
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

  alias __MODULE__.{Algorithms, AccessControl}

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

      config :cgraph, CGraph.RateLimiter, enabled: false

  This is useful for test environments.
  """
  @spec check(rate_limit_key(), scope(), keyword() | map()) :: check_result()
  def check(identifier, scope, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
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

      config :cgraph, CGraph.RateLimiter, enabled: false
  """
  @spec enabled?() :: boolean()
  def enabled? do
    Application.get_env(:cgraph, __MODULE__, [])
    |> Keyword.get(:enabled, true)
  end

  defp do_check(identifier, scope, opts) do
    config = get_scope_config(scope, opts)
    key = build_key(identifier, scope)

    result = Algorithms.check(key, config)

    emit_telemetry(identifier, scope, config, result)

    result
  end

  @doc """
  Check multiple scopes at once. Fails if any scope is rate limited.
  """
  @spec check_all(rate_limit_key(), [scope()], keyword()) :: :ok | {:error, scope(), check_result()}
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
  @spec status(rate_limit_key(), scope()) :: rate_limit_info()
  def status(identifier, scope) do
    config = get_scope_config(scope, [])
    key = build_key(identifier, scope)

    Algorithms.status(key, config)
  end

  @doc """
  Reset rate limit for an identifier.
  """
  @spec reset(rate_limit_key(), scope()) :: :ok
  def reset(identifier, scope) do
    key = build_key(identifier, scope)
    :ets.delete(@ets_table, key)
    :ok
  end

  @doc """
  Reset all rate limits for an identifier.
  """
  @spec reset_all(rate_limit_key()) :: :ok
  def reset_all(identifier) do
    # Match string keys containing the identifier suffix — no atom creation.
    suffix = ":#{identifier}"

    @ets_table
    |> :ets.tab2list()
    |> Enum.each(fn record ->
      key = elem(record, 0)
      if is_binary(key) and String.ends_with?(key, suffix) do
        :ets.delete(@ets_table, key)
      end
    end)

    :ok
  end

  @doc """
  Add to whitelist (never rate limited).
  """
  defdelegate whitelist(identifier), to: AccessControl

  @doc """
  Remove from whitelist.
  """
  defdelegate unwhitelist(identifier), to: AccessControl

  @doc """
  Check if identifier is whitelisted.
  """
  defdelegate whitelisted?(identifier), to: AccessControl

  @doc """
  Add to blacklist (always rate limited).
  """
  @spec blacklist(rate_limit_key(), keyword()) :: :ok | {:error, term()}
  def blacklist(identifier, opts \\ []) do
    duration = Keyword.get(opts, :duration, :infinity)
    AccessControl.blacklist(identifier, duration)
  end

  @doc """
  Remove from blacklist.
  """
  defdelegate unblacklist(identifier), to: AccessControl

  @doc """
  Check if identifier is blacklisted.
  """
  defdelegate blacklisted?(identifier), to: AccessControl

  @doc """
  Get configuration for a scope.
  """
  @spec get_scope_config(scope(), keyword()) :: map()
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
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  @spec init(keyword()) :: {:ok, map()}
  def init(_opts) do
    # Create ETS table
    :ets.new(@ets_table, [:named_table, :public, :set, {:read_concurrency, true}])

    # Schedule cleanup
    schedule_cleanup()

    {:ok, %{}}
  end

  @impl true
  @spec handle_info(:cleanup, map()) :: {:noreply, map()}
  def handle_info(:cleanup, state) do
    AccessControl.cleanup_expired()
    schedule_cleanup()
    {:noreply, state}
  end

  @impl true
  @spec handle_info(term(), map()) :: {:noreply, map()}
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
