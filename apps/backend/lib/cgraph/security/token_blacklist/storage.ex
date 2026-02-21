defmodule CGraph.Security.TokenBlacklist.Storage do
  @moduledoc """
  Multi-tier storage operations for the token blacklist.

  Manages three storage tiers:

  - **L1 (Cachex)**: Hot cache for recently revoked tokens
  - **L2 (ETS)**: Fast negative lookups via in-memory table
  - **L3 (Redis)**: Persistent storage with TTL matching token expiry
  """

  require Logger

  @cache_name :cgraph_cache
  @redis_prefix "token_blacklist:"
  @bloom_table :token_blacklist_bloom

  # Default TTL matches refresh token (30 days)
  @default_ttl_seconds 30 * 24 * 60 * 60

  @doc "Returns the default TTL in seconds (30 days)."
  @spec default_ttl_seconds() :: pos_integer()
  def default_ttl_seconds, do: @default_ttl_seconds

  @doc "Initialize the ETS bloom filter table."
  @spec init_bloom_table() :: :ok
  def init_bloom_table do
    :ets.new(@bloom_table, [:set, :public, :named_table, read_concurrency: true])
    :ok
  end

  @doc "Returns the current size of the bloom filter ETS table."
  @spec bloom_table_size() :: non_neg_integer()
  def bloom_table_size do
    :ets.info(@bloom_table, :size)
  end

  # ---------------------------------------------------------------------------
  # Store Operations
  # ---------------------------------------------------------------------------

  @doc "Store a key in the Cachex L1 cache."
  @spec store_in_cachex(String.t(), map(), pos_integer()) :: :ok
  def store_in_cachex(key, data, ttl_seconds) do
    ttl_ms = ttl_seconds * 1000
    case Cachex.put(@cache_name, "blacklist:#{key}", data, ttl: ttl_ms) do
      {:ok, true} -> :ok
      {:ok, false} -> :ok
      error ->
        Logger.warning("failed_to_store_in_cachex", error: inspect(error))
        :ok  # Non-fatal, continue with other tiers
    end
  end

  @doc "Store a key in the ETS L2 table."
  @spec store_in_ets(String.t()) :: :ok
  def store_in_ets(key) do
    expiry = System.system_time(:second) + @default_ttl_seconds
    :ets.insert(@bloom_table, {key, expiry})
    :ok
  end

  @doc "Store a key in Redis L3 persistent storage."
  @spec store_in_redis(String.t(), map(), pos_integer()) :: :ok
  def store_in_redis(key, data, ttl_seconds) do
    redis_key = "#{@redis_prefix}#{key}"
    encoded_data = Jason.encode!(data)

    try do
      case Redix.command(:redix, ["SETEX", redis_key, ttl_seconds, encoded_data]) do
        {:ok, _} -> :ok
        {:error, reason} ->
          Logger.warning("failed_to_store_in_redis", reason: inspect(reason))
          :ok  # Non-fatal for revocation
      end
    catch
      :exit, _ ->
        Logger.warning("Redis unavailable for token blacklist storage")
        :ok
    end
  end

  # ---------------------------------------------------------------------------
  # Check Operations
  # ---------------------------------------------------------------------------

  @doc "Check if a key exists in the ETS L2 table."
  @spec check_in_ets(String.t()) :: boolean()
  def check_in_ets(key) do
    case :ets.lookup(@bloom_table, key) do
      [{^key, expiry}] ->
        if System.system_time(:second) < expiry do
          true
        else
          :ets.delete(@bloom_table, key)
          false
        end
      [] -> false
    end
  end

  @doc "Check if a key exists in the Cachex L1 cache."
  @spec check_in_cachex(String.t()) :: {:ok, map()} | {:error, term()}
  def check_in_cachex(key) do
    case Cachex.get(@cache_name, "blacklist:#{key}") do
      {:ok, nil} -> {:error, :not_found}
      {:ok, data} -> {:ok, data}
      error -> error
    end
  end

  @doc "Check if a key exists in Redis L3."
  @spec check_in_redis(String.t()) :: {:ok, map()} | {:error, term()}
  def check_in_redis(key) do
    redis_key = "#{@redis_prefix}#{key}"

    try do
      case Redix.command(:redix, ["GET", redis_key]) do
        {:ok, nil} -> {:error, :not_found}
        {:ok, data} -> {:ok, Jason.decode!(data)}
        {:error, _} = error -> error
      end
    catch
      :exit, _ -> {:error, :redis_unavailable}
    end
  end

  # ---------------------------------------------------------------------------
  # Cleanup
  # ---------------------------------------------------------------------------

  @doc "Remove expired entries from the ETS bloom table."
  @spec cleanup() :: :ok
  def cleanup do
    now = System.system_time(:second)

    expired = :ets.select(@bloom_table, [{{:"$1", :"$2"}, [{:<, :"$2", now}], [:"$1"]}])

    Enum.each(expired, fn key ->
      :ets.delete(@bloom_table, key)
    end)

    Logger.debug("tokenblacklist_cleanup_removed_expired_entries", expired_count: inspect(length(expired)))
    :ok
  end
end
