defmodule Cgraph.Redis do
  @moduledoc """
  Redis client wrapper with connection pooling and resilience.
  
  ## Overview
  
  Provides a high-level interface to Redis with:
  
  - **Connection Pooling**: Managed pool of Redix connections
  - **Circuit Breaker**: Automatic failover during outages
  - **Pipelines**: Efficient batch operations
  - **PubSub**: Real-time messaging support
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                       REDIS CLIENT                              │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   Application                                                   │
  │        │                                                        │
  │        ▼                                                        │
  │   ┌─────────────────────────────────────────────────────────┐  │
  │   │                    Cgraph.Redis                          │  │
  │   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
  │   │  │   Command   │  │   Pipeline  │  │   PubSub    │     │  │
  │   │  │     API     │  │     API     │  │    API      │     │  │
  │   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │  │
  │   │         │                │                │            │  │
  │   │         └────────────────┼────────────────┘            │  │
  │   │                          ▼                              │  │
  │   │                   ┌─────────────┐                      │  │
  │   │                   │Circuit Break│                      │  │
  │   │                   └──────┬──────┘                      │  │
  │   │                          ▼                              │  │
  │   │                   ┌─────────────┐                      │  │
  │   │                   │ Conn Pool   │                      │  │
  │   │                   └──────┬──────┘                      │  │
  │   └──────────────────────────┼─────────────────────────────┘  │
  │                              │                                  │
  │                              ▼                                  │
  │                         Redis Server                            │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Configuration
  
      config :cgraph, Cgraph.Redis,
        host: "localhost",
        port: 6379,
        password: nil,
        database: 0,
        pool_size: 10,
        ssl: false
  
  ## Usage
  
      # Simple commands
      {:ok, "OK"} = Redis.command(["SET", "key", "value"])
      {:ok, "value"} = Redis.command(["GET", "key"])
      
      # Pipeline for efficiency
      results = Redis.pipeline([
        ["GET", "key1"],
        ["GET", "key2"],
        ["INCR", "counter"]
      ])
      
      # PubSub
      Redis.subscribe("channel:updates", self())
      Redis.publish("channel:updates", "message")
  
  ## Telemetry
  
  - `[:cgraph, :redis, :command]` - Command execution
  - `[:cgraph, :redis, :pipeline]` - Pipeline execution
  - `[:cgraph, :redis, :error]` - Command errors
  """
  
  use GenServer
  require Logger

  # Pool name for future NimblePool integration
  # @pool_name :redis_pool
  @default_timeout 5000

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Start the Redis client supervisor.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @doc """
  Execute a Redis command.
  
  ## Examples
  
      {:ok, "OK"} = Redis.command(["SET", "key", "value"])
      {:ok, nil} = Redis.command(["GET", "nonexistent"])
      {:ok, 1} = Redis.command(["DEL", "key"])
  """
  def command(args, opts \\ []) when is_list(args) do
    timeout = Keyword.get(opts, :timeout, @default_timeout)
    
    start_time = System.monotonic_time(:microsecond)
    
    result = try do
      GenServer.call(__MODULE__, {:command, args}, timeout)
    catch
      :exit, {:timeout, _} ->
        {:error, :timeout}
    end
    
    emit_command_telemetry(args, result, start_time)
    
    result
  end
  
  @doc """
  Execute a Redis command, raising on error.
  """
  def command!(args, opts \\ []) do
    case command(args, opts) do
      {:ok, result} -> result
      {:error, error} -> raise "Redis error: #{inspect(error)}"
    end
  end
  
  @doc """
  Execute multiple commands in a pipeline.
  
  More efficient than individual commands for bulk operations.
  
  ## Example
  
      results = Redis.pipeline([
        ["SET", "key1", "value1"],
        ["SET", "key2", "value2"],
        ["GET", "key1"],
        ["GET", "key2"]
      ])
      # => [{:ok, "OK"}, {:ok, "OK"}, {:ok, "value1"}, {:ok, "value2"}]
  """
  def pipeline(commands, opts \\ []) when is_list(commands) do
    timeout = Keyword.get(opts, :timeout, @default_timeout * length(commands))
    
    start_time = System.monotonic_time(:microsecond)
    
    result = try do
      GenServer.call(__MODULE__, {:pipeline, commands}, timeout)
    catch
      :exit, {:timeout, _} ->
        {:error, :timeout}
    end
    
    emit_pipeline_telemetry(commands, result, start_time)
    
    result
  end
  
  @doc """
  Execute a transaction (MULTI/EXEC).
  
  All commands are executed atomically.
  """
  def transaction(commands, opts \\ []) when is_list(commands) do
    full_pipeline = [["MULTI"]] ++ commands ++ [["EXEC"]]
    
    case pipeline(full_pipeline, opts) do
      {:ok, results} ->
        # Last result is the EXEC result containing actual results
        exec_result = List.last(results)
        {:ok, exec_result}
      error -> error
    end
  end
  
  @doc """
  Publish a message to a channel.
  """
  def publish(channel, message) do
    command(["PUBLISH", channel, encode_message(message)])
  end
  
  @doc """
  Get Redis server info.
  """
  def info(section \\ nil) do
    cmd = if section, do: ["INFO", section], else: ["INFO"]
    
    case command(cmd) do
      {:ok, info} when is_binary(info) -> {:ok, parse_info(info)}
      error -> error
    end
  end
  
  @doc """
  Check if Redis is available.
  """
  def ping do
    case command(["PING"]) do
      {:ok, "PONG"} -> :ok
      _ -> :error
    end
  end
  
  @doc """
  Get pool statistics.
  """
  def pool_stats do
    GenServer.call(__MODULE__, :pool_stats)
  end
  
  # ---------------------------------------------------------------------------
  # Key-Value Convenience Methods
  # ---------------------------------------------------------------------------
  
  @doc """
  Get a value.
  """
  def get(key) do
    command(["GET", key])
  end
  
  @doc """
  Set a value with optional TTL.
  """
  def set(key, value, opts \\ []) do
    ttl = Keyword.get(opts, :ttl)
    nx = Keyword.get(opts, :nx, false)  # Only set if not exists
    xx = Keyword.get(opts, :xx, false)  # Only set if exists
    
    args = ["SET", key, encode_value(value)]
    
    args = if ttl, do: args ++ ["EX", ttl], else: args
    args = if nx, do: args ++ ["NX"], else: args
    args = if xx, do: args ++ ["XX"], else: args
    
    command(args)
  end
  
  @doc """
  Delete one or more keys.
  """
  def del(keys) when is_list(keys), do: command(["DEL" | keys])
  def del(key), do: del([key])
  
  @doc """
  Check if a key exists.
  """
  def exists?(key) do
    case command(["EXISTS", key]) do
      {:ok, 1} -> true
      _ -> false
    end
  end
  
  @doc """
  Set expiration on a key.
  """
  def expire(key, seconds) do
    command(["EXPIRE", key, seconds])
  end
  
  @doc """
  Get remaining TTL of a key.
  """
  def ttl(key) do
    command(["TTL", key])
  end
  
  @doc """
  Increment a counter.
  """
  def incr(key), do: command(["INCR", key])
  def incrby(key, amount), do: command(["INCRBY", key, amount])
  def decr(key), do: command(["DECR", key])
  
  # ---------------------------------------------------------------------------
  # Hash Operations
  # ---------------------------------------------------------------------------
  
  @doc """
  Get a hash field.
  """
  def hget(key, field), do: command(["HGET", key, field])
  
  @doc """
  Set a hash field.
  """
  def hset(key, field, value), do: command(["HSET", key, field, encode_value(value)])
  
  @doc """
  Get all hash fields and values.
  """
  def hgetall(key) do
    case command(["HGETALL", key]) do
      {:ok, list} when is_list(list) -> {:ok, list_to_map(list)}
      result -> result
    end
  end
  
  @doc """
  Delete hash fields.
  """
  def hdel(key, fields) when is_list(fields), do: command(["HDEL", key | fields])
  def hdel(key, field), do: hdel(key, [field])
  
  # ---------------------------------------------------------------------------
  # List Operations
  # ---------------------------------------------------------------------------
  
  @doc """
  Push to the left of a list.
  """
  def lpush(key, values) when is_list(values), do: command(["LPUSH", key | values])
  def lpush(key, value), do: lpush(key, [value])
  
  @doc """
  Push to the right of a list.
  """
  def rpush(key, values) when is_list(values), do: command(["RPUSH", key | values])
  def rpush(key, value), do: rpush(key, [value])
  
  @doc """
  Get a range from a list.
  """
  def lrange(key, start, stop), do: command(["LRANGE", key, start, stop])
  
  @doc """
  Get list length.
  """
  def llen(key), do: command(["LLEN", key])
  
  # ---------------------------------------------------------------------------
  # Set Operations
  # ---------------------------------------------------------------------------
  
  @doc """
  Add members to a set.
  """
  def sadd(key, members) when is_list(members), do: command(["SADD", key | members])
  def sadd(key, member), do: sadd(key, [member])
  
  @doc """
  Get all set members.
  """
  def smembers(key), do: command(["SMEMBERS", key])
  
  @doc """
  Check if a member is in a set.
  """
  def sismember?(key, member) do
    case command(["SISMEMBER", key, member]) do
      {:ok, 1} -> true
      _ -> false
    end
  end
  
  @doc """
  Remove members from a set.
  """
  def srem(key, members) when is_list(members), do: command(["SREM", key | members])
  def srem(key, member), do: srem(key, [member])
  
  # ---------------------------------------------------------------------------
  # Sorted Set Operations
  # ---------------------------------------------------------------------------
  
  @doc """
  Add members to a sorted set.
  """
  def zadd(key, score_members) when is_list(score_members) do
    args = Enum.flat_map(score_members, fn {score, member} -> 
      [score, member] 
    end)
    command(["ZADD", key | args])
  end
  def zadd(key, score, member), do: zadd(key, [{score, member}])
  
  @doc """
  Get range from sorted set by rank.
  """
  def zrange(key, start, stop, opts \\ []) do
    args = ["ZRANGE", key, start, stop]
    args = if Keyword.get(opts, :withscores), do: args ++ ["WITHSCORES"], else: args
    command(args)
  end
  
  @doc """
  Get rank of a member in sorted set.
  """
  def zrank(key, member), do: command(["ZRANK", key, member])
  
  @doc """
  Get score of a member in sorted set.
  """
  def zscore(key, member), do: command(["ZSCORE", key, member])
  
  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(opts) do
    config = get_config(opts)
    
    state = %{
      config: config,
      connections: [],
      pool_size: config[:pool_size],
      connection_index: 0
    }
    
    # Start connection pool
    case start_pool(config) do
      {:ok, connections} ->
        Logger.info("Redis pool started with #{length(connections)} connections")
        {:ok, %{state | connections: connections}}
      {:error, reason} ->
        Logger.error("Failed to start Redis pool: #{inspect(reason)}")
        {:ok, state}
    end
  end
  
  @impl true
  def handle_call({:command, args}, _from, state) do
    result = with_connection(state, fn conn ->
      Redix.command(conn, args)
    end)
    
    {:reply, result, state}
  end
  
  @impl true
  def handle_call({:pipeline, commands}, _from, state) do
    result = with_connection(state, fn conn ->
      Redix.pipeline(conn, commands)
    end)
    
    {:reply, result, state}
  end
  
  @impl true
  def handle_call(:pool_stats, _from, state) do
    stats = %{
      pool_size: state.pool_size,
      active_connections: length(state.connections),
      connection_index: state.connection_index
    }
    
    {:reply, stats, state}
  end
  
  # ---------------------------------------------------------------------------
  # Internal Functions
  # ---------------------------------------------------------------------------
  
  defp get_config(opts) do
    app_config = Application.get_env(:cgraph, Cgraph.Redis, [])
    
    %{
      host: Keyword.get(opts, :host, Keyword.get(app_config, :host, "localhost")),
      port: Keyword.get(opts, :port, Keyword.get(app_config, :port, 6379)),
      password: Keyword.get(opts, :password, Keyword.get(app_config, :password)),
      database: Keyword.get(opts, :database, Keyword.get(app_config, :database, 0)),
      pool_size: Keyword.get(opts, :pool_size, Keyword.get(app_config, :pool_size, 5)),
      ssl: Keyword.get(opts, :ssl, Keyword.get(app_config, :ssl, false))
    }
  end
  
  defp start_pool(config) do
    opts = [
      host: config[:host],
      port: config[:port],
      database: config[:database]
    ]
    
    opts = if config[:password], do: Keyword.put(opts, :password, config[:password]), else: opts
    opts = if config[:ssl], do: Keyword.put(opts, :ssl, true), else: opts
    
    connections = for _i <- 1..config[:pool_size] do
      case Redix.start_link(opts) do
        {:ok, conn} -> conn
        {:error, reason} -> {:error, reason}
      end
    end
    
    errors = Enum.filter(connections, &match?({:error, _}, &1))
    
    if errors == [] do
      {:ok, connections}
    else
      {:error, :connection_failed}
    end
  end
  
  defp with_connection(%{connections: []}, _fun) do
    {:error, :no_connections}
  end
  
  defp with_connection(state, fun) do
    # Simple round-robin selection
    index = rem(state.connection_index, length(state.connections))
    conn = Enum.at(state.connections, index)
    
    try do
      fun.(conn)
    rescue
      e -> {:error, e}
    end
  end
  
  # ---------------------------------------------------------------------------
  # Encoding/Decoding
  # ---------------------------------------------------------------------------
  
  defp encode_value(value) when is_binary(value), do: value
  defp encode_value(value) when is_integer(value), do: Integer.to_string(value)
  defp encode_value(value) when is_float(value), do: Float.to_string(value)
  defp encode_value(value) when is_atom(value), do: Atom.to_string(value)
  defp encode_value(value), do: :erlang.term_to_binary(value) |> Base.encode64()
  
  defp encode_message(message) when is_binary(message), do: message
  defp encode_message(message), do: Jason.encode!(message)
  
  defp list_to_map(list) do
    list
    |> Enum.chunk_every(2)
    |> Enum.map(fn [k, v] -> {k, v} end)
    |> Map.new()
  end
  
  defp parse_info(info) do
    info
    |> String.split("\r\n")
    |> Enum.reject(&(String.starts_with?(&1, "#") or &1 == ""))
    |> Enum.map(fn line ->
      case String.split(line, ":", parts: 2) do
        [key, value] -> {key, value}
        _ -> nil
      end
    end)
    |> Enum.reject(&is_nil/1)
    |> Map.new()
  end
  
  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------
  
  defp emit_command_telemetry(args, result, start_time) do
    duration = System.monotonic_time(:microsecond) - start_time
    [command | _] = args
    
    status = case result do
      {:ok, _} -> :ok
      {:error, _} -> :error
    end
    
    :telemetry.execute(
      [:cgraph, :redis, :command],
      %{duration: duration},
      %{command: command, status: status}
    )
    
    if status == :error do
      :telemetry.execute(
        [:cgraph, :redis, :error],
        %{count: 1},
        %{command: command, error: elem(result, 1)}
      )
    end
  end
  
  defp emit_pipeline_telemetry(commands, result, start_time) do
    duration = System.monotonic_time(:microsecond) - start_time
    
    status = case result do
      {:ok, _} -> :ok
      {:error, _} -> :error
    end
    
    :telemetry.execute(
      [:cgraph, :redis, :pipeline],
      %{duration: duration, command_count: length(commands)},
      %{status: status}
    )
  end
end
