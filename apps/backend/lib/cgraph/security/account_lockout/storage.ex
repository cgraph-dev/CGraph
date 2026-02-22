defmodule CGraph.Security.AccountLockout.Storage do
  @moduledoc false

  require Logger

  # ============================================================================
  # Redis Availability
  # ============================================================================

  @spec redis_available?() :: boolean()
  def redis_available? do
    case System.get_env("REDIS_URL") do
      nil -> false
      "" -> false
      _url -> Process.whereis(:redix) != nil
    end
  end

  # ============================================================================
  # Storage Operations (Redis with ETS fallback)
  # ============================================================================

  @spec get_from_storage(String.t(), boolean()) :: {:ok, term()}
  def get_from_storage(key, true = _redis_available) do
    Redix.command(:redix, ["GET", key])
  rescue
    _ -> {:ok, nil}
  catch
    :exit, _ -> {:ok, nil}
  end

  def get_from_storage(key, false = _redis_available) do
    case :ets.lookup(:account_lockout_cache, key) do
      [{^key, value, expiry}] ->
        if DateTime.compare(DateTime.utc_now(), expiry) == :lt do
          {:ok, value}
        else
          :ets.delete(:account_lockout_cache, key)
          {:ok, nil}
        end
      [] -> {:ok, nil}
    end
  rescue
    ArgumentError -> {:ok, nil}
  end

  @spec set_in_storage(String.t(), term(), non_neg_integer(), boolean()) :: {:ok, String.t()} | {:error, term()}
  def set_in_storage(key, value, ttl, true = _redis_available) do
    Redix.command(:redix, ["SETEX", key, ttl, value])
  rescue
    _ -> {:error, :redis_unavailable}
  catch
    :exit, _ -> {:error, :redis_unavailable}
  end

  def set_in_storage(key, value, ttl, false = _redis_available) do
    expiry = DateTime.add(DateTime.utc_now(), ttl, :second)
    :ets.insert(:account_lockout_cache, {key, value, expiry})
    {:ok, "OK"}
  rescue
    ArgumentError -> {:error, :ets_unavailable}
  end

  @spec delete_from_storage(String.t(), boolean()) :: {:ok, non_neg_integer()} | {:error, term()}
  def delete_from_storage(key, true = _redis_available) do
    Redix.command(:redix, ["DEL", key])
  rescue
    _ -> {:ok, 0}
  catch
    :exit, _ -> {:ok, 0}
  end

  def delete_from_storage(key, false = _redis_available) do
    :ets.delete(:account_lockout_cache, key)
    {:ok, 1}
  rescue
    ArgumentError -> {:ok, 0}
  end

  # Legacy Redis operations (kept for compatibility but wrapped)
  @spec get_from_redis(String.t()) :: {:ok, term()}
  def get_from_redis(key) do
    get_from_storage(key, redis_available?())
  end

  @spec set_in_redis(String.t(), term(), non_neg_integer()) :: {:ok, String.t()} | {:error, term()}
  def set_in_redis(key, value, ttl) do
    set_in_storage(key, value, ttl, redis_available?())
  end

  @spec delete_from_redis(String.t()) :: {:ok, non_neg_integer()} | {:error, term()}
  def delete_from_redis(key) do
    delete_from_storage(key, redis_available?())
  end

  # ============================================================================
  # Counter Operations
  # ============================================================================

  @spec increment_attempts(String.t(), non_neg_integer()) :: non_neg_integer()
  def increment_attempts(key, window) do
    redis_avail = redis_available?()

    if redis_avail do
      try do
        case Redix.command(:redix, ["INCR", key]) do
          {:ok, count} ->
            # Set expiry only on first attempt
            if count == 1 do
              Redix.command(:redix, ["EXPIRE", key, window])
            end
            count
          {:error, _} -> 1
        end
      rescue
        _ -> ets_increment_attempts(key, window)
      catch
        :exit, _ -> ets_increment_attempts(key, window)
      end
    else
      ets_increment_attempts(key, window)
    end
  end

  @spec get_lock_count(String.t()) :: non_neg_integer()
  def get_lock_count(identifier) do
    key = lock_count_key(identifier)
    case get_from_redis(key) do
      {:ok, nil} -> 0
      {:ok, count} when is_binary(count) -> String.to_integer(count)
      {:ok, count} when is_integer(count) -> count
      _ -> 0
    end
  end

  @spec increment_lock_count(String.t()) :: term()
  def increment_lock_count(identifier) do
    key = lock_count_key(identifier)
    redis_avail = redis_available?()

    if redis_avail do
      try do
        # Lock count persists for 24 hours
        Redix.command(:redix, ["INCR", key])
        Redix.command(:redix, ["EXPIRE", key, 86_400])
      rescue
        _ -> ets_increment_lock_count(key)
      catch
        :exit, _ -> ets_increment_lock_count(key)
      end
    else
      ets_increment_lock_count(key)
    end
  end

  # ============================================================================
  # Key Builders
  # ============================================================================

  @redis_prefix "account_lockout:"
  @ip_prefix "ip_lockout:"

  @spec lockout_key(String.t()) :: String.t()
  def lockout_key(identifier), do: "#{@redis_prefix}lock:#{identifier}"
  @spec attempts_key(String.t()) :: String.t()
  def attempts_key(identifier), do: "#{@redis_prefix}attempts:#{identifier}"
  @spec lock_count_key(String.t()) :: String.t()
  def lock_count_key(identifier), do: "#{@redis_prefix}lock_count:#{identifier}"
  @spec ip_lockout_key(String.t()) :: String.t()
  def ip_lockout_key(ip), do: "#{@ip_prefix}#{ip}"

  # ============================================================================
  # Private ETS Helpers
  # ============================================================================

  defp ets_increment_attempts(key, window) do
    case :ets.lookup(:account_lockout_cache, key) do
      [{^key, count, _expiry}] ->
        new_count = count + 1
        expiry = DateTime.add(DateTime.utc_now(), window, :second)
        :ets.insert(:account_lockout_cache, {key, new_count, expiry})
        new_count
      [] ->
        expiry = DateTime.add(DateTime.utc_now(), window, :second)
        :ets.insert(:account_lockout_cache, {key, 1, expiry})
        1
    end
  rescue
    ArgumentError -> 1
  end

  defp ets_increment_lock_count(key) do
    case :ets.lookup(:account_lockout_cache, key) do
      [{^key, count, _expiry}] ->
        new_count = count + 1
        expiry = DateTime.add(DateTime.utc_now(), 86_400, :second)
        :ets.insert(:account_lockout_cache, {key, new_count, expiry})
        new_count
      [] ->
        expiry = DateTime.add(DateTime.utc_now(), 86_400, :second)
        :ets.insert(:account_lockout_cache, {key, 1, expiry})
        1
    end
  rescue
    ArgumentError -> 1
  end
end
