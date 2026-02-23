defmodule CGraph.RateLimiter.Distributed.RedisBackend do
  @moduledoc """
  Redis-backed rate limiting operations using Lua scripts for atomicity.

  Implements token bucket, sliding window, and fixed window algorithms
  using atomic Redis operations to prevent race conditions in distributed
  environments.
  """

  alias CGraph.Redis

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

  @doc """
  Check rate limit using Redis with atomic Lua scripts.

  Returns `{:ok, result}` or `{:error, reason}`.
  """
  @spec check(String.t(), map()) :: {:ok, :ok | {:error, :rate_limited, map()}} | {:error, term()}
  def check(key, config) do
    now = System.system_time(:millisecond)
    window_ms = config.window * 1000

    case config.algorithm do
      :token_bucket ->
        case Redis.command([
               "EVAL",
               @token_bucket_script,
               1,
               key,
               config.limit,
               window_ms,
               config.cost,
               now
             ]) do
          {:ok, [1, _remaining, _]} ->
            {:ok, :ok}

          {:ok, [0, remaining, wait_ms]} ->
            {:ok, {:error, :rate_limited, build_info(config, remaining, wait_ms)}}

          error ->
            {:error, error}
        end

      :sliding_window ->
        request_id = "#{node()}_#{System.unique_integer()}"

        case Redis.command([
               "EVAL",
               @sliding_window_script,
               1,
               key,
               config.limit,
               window_ms,
               now,
               request_id
             ]) do
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

        case Redis.command([
               "EVAL",
               @fixed_window_script,
               1,
               window_key,
               config.limit,
               window_ms
             ]) do
          {:ok, [1, _remaining, _]} ->
            {:ok, :ok}

          {:ok, [0, _, ttl_ms]} ->
            {:ok, {:error, :rate_limited, build_info(config, 0, ttl_ms)}}

          error ->
            {:error, error}
        end
    end
  end

  @doc """
  Get current rate limit status from Redis without consuming a request.
  """
  @spec status(String.t(), map()) :: {:ok, map()} | {:error, term()}
  def status(key, config) do
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
        window_start = now - config.window * 1000

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

  @doc """
  Pre-load Lua scripts into Redis for better performance.
  """
  @spec load_scripts() :: :ok
  def load_scripts do
    # Pre-load scripts for better performance (optional)
    :ok
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
end
