defmodule CGraph.RateLimiter.AccessControl do
  @moduledoc """
  Whitelist and blacklist management for rate limiting.

  Provides mechanisms to exempt specific identifiers from rate limiting
  (whitelist) or always deny them (blacklist) with optional expiration.
  All operations are performed directly on the shared public ETS table.
  """

  require Logger

  @ets_table :cgraph_rate_limiter

  @doc """
  Add identifier to whitelist. Whitelisted identifiers bypass rate limiting.
  """
  @spec whitelist(term()) :: :ok
  def whitelist(identifier) do
    :ets.insert(@ets_table, {{:whitelist, identifier}, true})
    Logger.info("whitelisted_rate_limit_identifier", identifier: identifier)
    :ok
  end

  @doc """
  Remove identifier from whitelist.
  """
  @spec unwhitelist(term()) :: :ok
  def unwhitelist(identifier) do
    :ets.delete(@ets_table, {:whitelist, identifier})
    :ok
  end

  @doc """
  Check if identifier is whitelisted.
  """
  @spec whitelisted?(term()) :: boolean()
  def whitelisted?(identifier) do
    case :ets.lookup(@ets_table, {:whitelist, identifier}) do
      [{_, true}] -> true
      _ -> false
    end
  end

  @doc """
  Add identifier to blacklist. Blacklisted identifiers are always rate limited.

  ## Options

  - `:duration` - Duration in seconds, or `:infinity` (default)
  """
  @spec blacklist(term(), :infinity | pos_integer()) :: :ok
  def blacklist(identifier, duration \\ :infinity) do
    until =
      case duration do
        :infinity -> :infinity
        seconds -> DateTime.add(DateTime.utc_now(), seconds, :second)
      end

    :ets.insert(@ets_table, {{:blacklist, identifier}, until})

    Logger.warning("blacklisted_rate_limit_identifier_until",
      identifier: identifier,
      until: inspect(until)
    )

    :ok
  end

  @doc """
  Remove identifier from blacklist.
  """
  @spec unblacklist(term()) :: :ok
  def unblacklist(identifier) do
    :ets.delete(@ets_table, {:blacklist, identifier})
    :ok
  end

  @doc """
  Check if identifier is blacklisted.
  """
  @spec blacklisted?(term()) :: boolean()
  def blacklisted?(identifier) do
    case :ets.lookup(@ets_table, {:blacklist, identifier}) do
      [{_, until}] when until == :infinity -> true
      [{_, until}] -> DateTime.compare(DateTime.utc_now(), until) == :lt
      _ -> false
    end
  end

  @doc """
  Clean up expired blacklist entries from ETS.
  """
  @spec cleanup_expired() :: nil
  def cleanup_expired do
    :ets.foldl(
      fn
        {{:blacklist, _} = key, until}, acc when until != :infinity ->
          if DateTime.compare(DateTime.utc_now(), until) == :gt do
            :ets.delete(@ets_table, key)
          end

          acc

        _, acc ->
          acc
      end,
      nil,
      @ets_table
    )
  end
end
