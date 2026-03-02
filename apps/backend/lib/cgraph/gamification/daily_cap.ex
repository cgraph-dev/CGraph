defmodule CGraph.Gamification.DailyCap do
  @moduledoc """
  Redis-backed daily XP cap tracking per user per source type.

  Key format: `daily_cap:{user_id}:{source}:{YYYY-MM-DD}`
  Each key has a TTL of 86 400 s (24 h) for automatic cleanup.

  When Redis is unavailable the module falls back to an ETS table
  that is reset on application restart — good enough for development
  and single-node deployments.

  ## Diminishing returns

  After `diminish_after` actions of the same type in a day, each
  subsequent action yields half the base XP (floored to 1).
  """

  alias CGraph.Gamification.XpConfig
  alias CGraph.Redis

  require Logger

  @ets_table :daily_cap_fallback
  @ttl_seconds 86_400

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Check the daily cap for `source` and, if room remains, atomically
  increment the counter. Returns the effective XP to award after
  applying diminishing returns.

  Returns:
  - `{:ok, effective_xp}` — XP to actually award (may be reduced)
  - `{:error, :daily_cap_reached}` — no room left today
  - `{:error, :unknown_source}` — source not in XpConfig
  """
  @spec check_and_increment(String.t(), atom(), non_neg_integer()) ::
          {:ok, non_neg_integer()} | {:error, :daily_cap_reached | :unknown_source}
  def check_and_increment(user_id, source, base_xp) do
    case XpConfig.get_reward(source) do
      nil ->
        {:error, :unknown_source}

      %{daily_cap: :unlimited} ->
        {:ok, base_xp}

      %{daily_cap: cap, diminish_after: diminish_after} ->
        key = redis_key(user_id, source)
        do_check_and_increment(key, base_xp, cap, diminish_after)
    end
  end

  @doc """
  Return the current daily cap status for a user + source.
  """
  @spec get_cap_status(String.t(), atom()) :: %{
          source: atom(),
          used: non_neg_integer(),
          limit: non_neg_integer() | :unlimited,
          remaining: non_neg_integer() | :unlimited,
          diminishing_active: boolean(),
          action_count: non_neg_integer()
        }
  def get_cap_status(user_id, source) do
    config = XpConfig.get_reward(source)

    if config == nil do
      %{source: source, used: 0, limit: 0, remaining: 0, diminishing_active: false, action_count: 0}
    else
      cap = config.daily_cap
      diminish = config.diminish_after

      {used, count} = read_counters(redis_key(user_id, source))

      remaining =
        case cap do
          :unlimited -> :unlimited
          n -> max(n - used, 0)
        end

      diminishing_active =
        case diminish do
          :never -> false
          n -> count >= n
        end

      %{
        source: source,
        used: used,
        limit: cap,
        remaining: remaining,
        diminishing_active: diminishing_active,
        action_count: count
      }
    end
  end

  @doc """
  Reset daily caps for a user (all sources). Useful for tests.
  """
  @spec reset_daily_caps(String.t()) :: :ok
  def reset_daily_caps(user_id) do
    date = Date.to_iso8601(Date.utc_today())
    sources = XpConfig.all_rewards() |> Map.keys()

    commands =
      Enum.flat_map(sources, fn source ->
        base = "daily_cap:#{user_id}:#{source}:#{date}"
        [["DEL", "#{base}:xp"], ["DEL", "#{base}:count"]]
      end)

    case Redis.pipeline(commands) do
      {:ok, _} -> :ok
      {:error, _} -> ets_reset(user_id)
    end
  end

  @doc false
  @spec ensure_ets_table() :: :ok
  def ensure_ets_table do
    if :ets.whereis(@ets_table) == :undefined do
      :ets.new(@ets_table, [:set, :public, :named_table])
    end

    :ok
  end

  # ---------------------------------------------------------------------------
  # Internal
  # ---------------------------------------------------------------------------

  defp redis_key(user_id, source) do
    date = Date.to_iso8601(Date.utc_today())
    "daily_cap:#{user_id}:#{source}:#{date}"
  end

  # Atomically check cap + increment using a Lua-free two-step pipeline.
  # Step 1: GET current counters
  # Step 2: If room, INCRBY + INCR + EXPIRE
  defp do_check_and_increment(key, base_xp, cap, diminish_after) do
    xp_key = "#{key}:xp"
    count_key = "#{key}:count"

    case Redis.pipeline([["GET", xp_key], ["GET", count_key]]) do
      {:ok, [raw_used, raw_count]} ->
        used = parse_int(raw_used, 0)
        count = parse_int(raw_count, 0)
        effective_xp = apply_diminishing(base_xp, count, diminish_after)

        cond do
          used >= cap ->
            {:error, :daily_cap_reached}

          used + effective_xp > cap ->
            # Partial award — give whatever room remains
            remaining = cap - used
            increment_redis(xp_key, count_key, remaining)
            {:ok, remaining}

          true ->
            increment_redis(xp_key, count_key, effective_xp)
            {:ok, effective_xp}
        end

      {:error, _reason} ->
        # Redis unavailable — fall back to ETS
        ets_check_and_increment(key, base_xp, cap, diminish_after)
    end
  end

  defp increment_redis(xp_key, count_key, amount) do
    Redis.pipeline([
      ["INCRBY", xp_key, to_string(amount)],
      ["INCR", count_key],
      ["EXPIRE", xp_key, to_string(@ttl_seconds)],
      ["EXPIRE", count_key, to_string(@ttl_seconds)]
    ])
  end

  defp apply_diminishing(base_xp, _count, :never), do: base_xp

  defp apply_diminishing(base_xp, count, threshold) when count < threshold, do: base_xp

  defp apply_diminishing(base_xp, count, threshold) do
    # Each action past threshold halves the XP (floored to 1)
    halvings = count - threshold
    reduced = base_xp / :math.pow(2, halvings)
    max(round(reduced), 1)
  end

  defp read_counters(key) do
    xp_key = "#{key}:xp"
    count_key = "#{key}:count"

    case Redis.pipeline([["GET", xp_key], ["GET", count_key]]) do
      {:ok, [raw_used, raw_count]} ->
        {parse_int(raw_used, 0), parse_int(raw_count, 0)}

      {:error, _} ->
        ets_read(key)
    end
  end

  # ---------------------------------------------------------------------------
  # ETS Fallback
  # ---------------------------------------------------------------------------

  defp ets_check_and_increment(key, base_xp, cap, diminish_after) do
    ensure_ets_table()

    {used, count} = ets_read(key)
    effective_xp = apply_diminishing(base_xp, count, diminish_after)

    cond do
      used >= cap ->
        {:error, :daily_cap_reached}

      used + effective_xp > cap ->
        remaining = cap - used
        ets_increment(key, remaining)
        {:ok, remaining}

      true ->
        ets_increment(key, effective_xp)
        {:ok, effective_xp}
    end
  end

  defp ets_read(key) do
    ensure_ets_table()

    xp =
      case :ets.lookup(@ets_table, "#{key}:xp") do
        [{_, v}] -> v
        [] -> 0
      end

    count =
      case :ets.lookup(@ets_table, "#{key}:count") do
        [{_, v}] -> v
        [] -> 0
      end

    {xp, count}
  end

  defp ets_increment(key, amount) do
    ensure_ets_table()
    :ets.update_counter(@ets_table, "#{key}:xp", {2, amount}, {"#{key}:xp", 0})
    :ets.update_counter(@ets_table, "#{key}:count", {2, 1}, {"#{key}:count", 0})
    :ok
  end

  defp ets_reset(user_id) do
    ensure_ets_table()
    date = Date.to_iso8601(Date.utc_today())
    sources = XpConfig.all_rewards() |> Map.keys()

    Enum.each(sources, fn source ->
      base = "daily_cap:#{user_id}:#{source}:#{date}"
      :ets.delete(@ets_table, "#{base}:xp")
      :ets.delete(@ets_table, "#{base}:count")
    end)

    :ok
  end

  defp parse_int(nil, default), do: default
  defp parse_int(val, _default) when is_integer(val), do: val

  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {n, _} -> n
      :error -> default
    end
  end

  defp parse_int(_, default), do: default
end
