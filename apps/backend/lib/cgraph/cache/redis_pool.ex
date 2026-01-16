defmodule CGraph.Cache.RedisPool do
  @moduledoc """
  Redis connection pool for scalable operations.

  Provides pooled connections to Redis for high-throughput scenarios.
  Designed to support 10,000+ concurrent users without bottlenecks.

  ## Architecture

  Uses a round-robin strategy across N connections (default: 20) to
  distribute load evenly. Each connection is a separate Redix process.

  ## Usage

      # Get a connection from the pool
      {:ok, conn} = RedisPool.checkout()

      # Execute commands
      RedisPool.command(["GET", "key"])
      RedisPool.pipeline([["GET", "key1"], ["GET", "key2"]])

  ## Configuration

      config :cgraph, CGraph.Cache.RedisPool,
        pool_size: 20,
        redis_url: "redis://localhost:6379/0"

  ## Performance Targets

  - Handles 50,000+ Redis operations/second
  - Sub-millisecond checkout latency
  - Automatic reconnection on failure
  """

  use Supervisor
  require Logger

  @pool_size Application.compile_env(:cgraph, [__MODULE__, :pool_size], 20)
  # Redis URL is configured at runtime, not compile time
  # Note: checkout_timeout reserved for future pool timeout config
  @command_timeout 5_000

  # ============================================================================
  # Supervisor
  # ============================================================================

  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    pool_size = get_pool_size()

    children =
      for i <- 0..(pool_size - 1) do
        Supervisor.child_spec(
          {Redix, redis_child_opts(i)},
          id: {Redix, i}
        )
      end

    # Add counter for round-robin distribution
    children = children ++ [
      {Agent, fn -> 0 end}
    ]

    Logger.info("[RedisPool] Starting #{pool_size} Redis connections")
    Supervisor.init(children, strategy: :one_for_one)
  end

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Execute a Redis command using a pooled connection.

  Automatically selects a connection using round-robin distribution.

  ## Examples

      {:ok, "OK"} = RedisPool.command(["SET", "key", "value"])
      {:ok, value} = RedisPool.command(["GET", "key"])
      {:ok, 1} = RedisPool.command(["INCR", "counter"])

  ## Options

  - `:timeout` - Command timeout in milliseconds (default: 5000)
  """
  @spec command(list(), keyword()) :: {:ok, term()} | {:error, term()}
  def command(args, opts \\ []) when is_list(args) do
    timeout = Keyword.get(opts, :timeout, @command_timeout)
    conn = checkout()

    try do
      Redix.command(conn, args, timeout: timeout)
    rescue
      e ->
        Logger.error("[RedisPool] Command failed: #{inspect(e)}")
        {:error, :redis_error}
    end
  end

  @doc """
  Execute a Redis command, raising on error.
  """
  @spec command!(list(), keyword()) :: term()
  def command!(args, opts \\ []) when is_list(args) do
    case command(args, opts) do
      {:ok, result} -> result
      {:error, reason} -> raise "Redis command failed: #{inspect(reason)}"
    end
  end

  @doc """
  Execute multiple Redis commands in a pipeline.

  Significantly more efficient than individual commands for batch operations.

  ## Examples

      commands = [
        ["GET", "user:1:coins"],
        ["GET", "user:1:xp"],
        ["GET", "user:1:level"]
      ]
      {:ok, [coins, xp, level]} = RedisPool.pipeline(commands)

  ## Performance

  Pipeline reduces round-trip latency from N*RTT to just RTT for N commands.
  """
  @spec pipeline(list(list()), keyword()) :: {:ok, list()} | {:error, term()}
  def pipeline(commands, opts \\ []) when is_list(commands) do
    timeout = Keyword.get(opts, :timeout, @command_timeout)
    conn = checkout()

    try do
      Redix.pipeline(conn, commands, timeout: timeout)
    rescue
      e ->
        Logger.error("[RedisPool] Pipeline failed: #{inspect(e)}")
        {:error, :redis_error}
    end
  end

  @doc """
  Execute multiple commands as an atomic transaction.

  ## Examples

      commands = [
        ["DECR", "user:1:coins"],
        ["INCR", "user:1:purchases"]
      ]
      {:ok, results} = RedisPool.transaction(commands)
  """
  @spec transaction(list(list()), keyword()) :: {:ok, list()} | {:error, term()}
  def transaction(commands, opts \\ []) when is_list(commands) do
    timeout = Keyword.get(opts, :timeout, @command_timeout * 2)
    conn = checkout()

    full_pipeline =
      [["MULTI"]] ++
      commands ++
      [["EXEC"]]

    try do
      case Redix.pipeline(conn, full_pipeline, timeout: timeout) do
        {:ok, results} ->
          # Last result is the EXEC response with actual values
          {:ok, List.last(results)}

        {:error, _} = error ->
          error
      end
    rescue
      e ->
        Logger.error("[RedisPool] Transaction failed: #{inspect(e)}")
        {:error, :redis_error}
    end
  end

  @doc """
  Get or set a cached value with automatic expiration.

  ## Examples

      # Fetch with 5-minute TTL
      value = RedisPool.fetch("expensive:query", 300, fn ->
        Database.expensive_query()
      end)
  """
  @spec fetch(String.t(), pos_integer(), (-> term())) :: term()
  def fetch(key, ttl_seconds, fallback) when is_function(fallback, 0) do
    case command(["GET", key]) do
      {:ok, nil} ->
        value = fallback.()
        encoded = encode_value(value)
        command(["SETEX", key, ttl_seconds, encoded])
        value

      {:ok, encoded} ->
        decode_value(encoded)

      {:error, _} ->
        fallback.()
    end
  end

  @doc """
  Increment a counter with optional expiration.

  ## Examples

      {:ok, 5} = RedisPool.incr("api:requests:user:123")
      {:ok, 1} = RedisPool.incr("rate_limit:user:123", expire: 60)
  """
  @spec incr(String.t(), keyword()) :: {:ok, integer()} | {:error, term()}
  def incr(key, opts \\ []) do
    expire = Keyword.get(opts, :expire)

    result = command(["INCR", key])

    if expire && match?({:ok, 1}, result) do
      command(["EXPIRE", key, expire])
    end

    result
  end

  @doc """
  Delete one or more keys.
  """
  @spec delete(String.t() | list(String.t())) :: {:ok, integer()} | {:error, term()}
  def delete(keys) when is_list(keys) do
    command(["DEL" | keys])
  end

  def delete(key) when is_binary(key) do
    command(["DEL", key])
  end

  @doc """
  Check if Redis pool is healthy.
  """
  @spec healthy?() :: boolean()
  def healthy? do
    case command(["PING"]) do
      {:ok, "PONG"} -> true
      _ -> false
    end
  end

  @doc """
  Get pool statistics for monitoring.
  """
  @spec stats() :: map()
  def stats do
    pool_size = get_pool_size()

    connection_states =
      for i <- 0..(pool_size - 1) do
        conn = connection_name(i)
        alive = Process.whereis(conn) != nil
        {i, alive}
      end

    healthy_count = Enum.count(connection_states, fn {_, alive} -> alive end)

    %{
      pool_size: pool_size,
      healthy_connections: healthy_count,
      unhealthy_connections: pool_size - healthy_count,
      connections: Map.new(connection_states)
    }
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  # Checkout a connection using round-robin
  defp checkout do
    pool_size = get_pool_size()
    counter_pid = Process.whereis(Agent)

    index =
      if counter_pid do
        Agent.get_and_update(Agent, fn count ->
          next = rem(count + 1, pool_size)
          {count, next}
        end)
      else
        # Fallback to random if agent not available
        :rand.uniform(pool_size) - 1
      end

    connection_name(index)
  end

  defp connection_name(index) do
    :"cgraph_redis_#{index}"
  end

  defp get_pool_size do
    Application.get_env(:cgraph, [__MODULE__, :pool_size], @pool_size)
  end

  defp redis_child_opts(index) do
    url = Application.get_env(:cgraph, :redis_url) || "redis://localhost:6379/0"

    [
      name: connection_name(index),
      sync_connect: false,
      exit_on_disconnection: false,
      backoff_initial: 500,
      backoff_max: 30_000
    ] ++ parse_redis_url(url)
  end

  defp parse_redis_url(url) when is_binary(url) do
    case URI.parse(url) do
      %URI{host: host, port: port, userinfo: userinfo, path: path} ->
        opts = [
          host: host || "localhost",
          port: port || 6379
        ]

        opts = if userinfo do
          case String.split(userinfo, ":") do
            [_user, password] -> Keyword.put(opts, :password, password)
            [password] -> Keyword.put(opts, :password, password)
            _ -> opts
          end
        else
          opts
        end

        opts = if path && path != "/" do
          database = path |> String.trim_leading("/") |> String.to_integer()
          Keyword.put(opts, :database, database)
        else
          opts
        end

        opts
    end
  end

  defp parse_redis_url(opts) when is_list(opts), do: opts

  # Value encoding for complex types
  defp encode_value(value) when is_binary(value), do: value
  defp encode_value(value), do: :erlang.term_to_binary(value) |> Base.encode64()

  defp decode_value(value) when is_binary(value) do
    if String.printable?(value) && !String.starts_with?(value, "g") do
      value
    else
      try do
        value |> Base.decode64!() |> :erlang.binary_to_term()
      rescue
        _ -> value
      end
    end
  end
end
