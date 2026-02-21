defmodule CGraph.RateLimiter.Algorithms do
  @moduledoc """
  Rate limiting algorithm implementations using ETS storage.

  Provides four algorithms:
  - **Token Bucket**: Smooth rate limiting with burst allowance
  - **Sliding Window**: Precise request counting over a sliding time window
  - **Leaky Bucket**: Constant rate processing with buffer
  - **Fixed Window**: Simple time-based counting per window
  """

  @ets_table :cgraph_rate_limiter

  @doc """
  Check if request is allowed using the configured algorithm.
  """
  def check(key, config) do
    case config.algorithm do
      :token_bucket -> check_token_bucket(key, config)
      :sliding_window -> check_sliding_window(key, config)
      :leaky_bucket -> check_leaky_bucket(key, config)
      :fixed_window -> check_fixed_window(key, config)
    end
  end

  @doc """
  Get current rate limit status without consuming a request.
  """
  def status(key, config) do
    case config.algorithm do
      :token_bucket -> token_bucket_status(key, config)
      :sliding_window -> sliding_window_status(key, config)
      :leaky_bucket -> leaky_bucket_status(key, config)
      :fixed_window -> fixed_window_status(key, config)
    end
  end

  # ---------------------------------------------------------------------------
  # Token Bucket
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
  # Sliding Window
  # ---------------------------------------------------------------------------

  defp check_sliding_window(key, config) do
    now = System.system_time(:second)
    window_start = now - config.window

    # Clean old entries and count current
    count =
      case :ets.lookup(@ets_table, key) do
        [] ->
          0

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

    count =
      case :ets.lookup(@ets_table, key) do
        [] ->
          0

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
  # Leaky Bucket
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
  # Fixed Window
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

    count =
      case :ets.lookup(@ets_table, window_key) do
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
end
