defmodule CGraph.RateLimiter.Distributed.EtsFallback do
  @moduledoc """
  ETS-based fallback rate limiting for when Redis is unavailable.

  Provides per-node rate limiting using ETS tables with the same algorithm
  interfaces as the Redis backend: token bucket, sliding window, and fixed window.
  """

  @ets_fallback_table :cgraph_rate_limiter_fallback

  @doc """
  Check rate limit using ETS fallback.
  """
  def check(key, config) do
    case config.algorithm do
      :token_bucket -> token_bucket(key, config)
      :sliding_window -> sliding_window(key, config)
      :fixed_window -> fixed_window(key, config)
    end
  end

  @doc """
  Get current rate limit status from ETS.
  """
  def status(key, config) do
    case config.algorithm do
      :token_bucket ->
        case :ets.lookup(@ets_fallback_table, key) do
          [] -> %{limit: config.limit, remaining: config.limit}
          [{_, tokens, _}] -> %{limit: config.limit, remaining: max(0, floor(tokens))}
        end

      :sliding_window ->
        now = System.system_time(:millisecond)
        window_start = now - config.window * 1000

        count =
          case :ets.lookup(@ets_fallback_table, key) do
            [] -> 0
            [{_, timestamps}] -> Enum.count(timestamps, &(&1 > window_start))
          end

        %{limit: config.limit, remaining: max(0, config.limit - count)}

      :fixed_window ->
        now = System.system_time(:millisecond)
        window_ms = config.window * 1000
        window_id = div(now, window_ms)
        window_key = "#{key}:#{window_id}"

        count =
          case :ets.lookup(@ets_fallback_table, window_key) do
            [] -> 0
            [{_, c}] -> c
          end

        %{limit: config.limit, remaining: max(0, config.limit - count)}
    end
  end

  @doc """
  Clean up expired entries from the ETS fallback table.
  """
  def cleanup do
    now = System.system_time(:millisecond)

    # This is a basic cleanup - in production, consider a more sophisticated approach
    :ets.foldl(
      fn
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
      end,
      nil,
      @ets_fallback_table
    )
  end

  # Private algorithm implementations

  defp token_bucket(key, config) do
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

  defp sliding_window(key, config) do
    now = System.system_time(:millisecond)
    window_ms = config.window * 1000
    window_start = now - window_ms

    count =
      case :ets.lookup(@ets_fallback_table, key) do
        [] ->
          0

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
      wait_ms = oldest + window_ms - now

      {:error, :rate_limited, build_info(config, 0, max(0, wait_ms))}
    end
  end

  defp fixed_window(key, config) do
    now = System.system_time(:millisecond)
    window_ms = config.window * 1000
    window_id = div(now, window_ms)
    window_key = "#{key}:#{window_id}"

    count =
      case :ets.lookup(@ets_fallback_table, window_key) do
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
