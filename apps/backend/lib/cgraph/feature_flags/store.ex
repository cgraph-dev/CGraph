defmodule CGraph.FeatureFlags.Store do
  @moduledoc """
  Cache management, flag normalization, and telemetry for the feature flags system.

  Uses Cachex for in-memory caching with a configurable TTL and provides
  helper functions for flag name normalization and telemetry emission.
  """

  require Logger

  @cache_name :cgraph_cache
  @cache_prefix "feature_flag:"
  @cache_ttl :timer.minutes(5)

  # ---------------------------------------------------------------------------
  # Flag Name Normalization
  # ---------------------------------------------------------------------------

  @doc """
  Normalizes a flag name to an atom. Binary names are converted via
  `String.to_existing_atom/1` to prevent atom table exhaustion.

  Returns the original string if the atom does not exist.
  """
  @spec normalize_flag_name(atom() | String.t()) :: atom() | String.t()
  def normalize_flag_name(name) when is_binary(name) do
    String.to_existing_atom(name)
  rescue
    ArgumentError ->
      # Log unknown flag names for monitoring
      Logger.warning("unknown_feature_flag_name_requested", name: inspect(name))
      # Return as string to avoid atom creation, callers should handle this
      name
  end

  def normalize_flag_name(name) when is_atom(name), do: name

  # ---------------------------------------------------------------------------
  # Cache Management
  # ---------------------------------------------------------------------------

  @doc """
  Looks up a flag in the cache.

  Returns `{:ok, flag}`, `{:ok, nil}`, or `{:error, reason}`.
  """
  @spec cache_get(atom() | String.t()) :: {:ok, map() | nil} | {:error, term()}
  def cache_get(flag_name) do
    cache_key = @cache_prefix <> to_string(flag_name)
    Cachex.get(@cache_name, cache_key)
  end

  @doc """
  Stores a flag in the cache with the configured TTL.
  """
  @spec cache_flag(atom() | String.t(), map()) :: :ok
  def cache_flag(flag_name, flag) do
    cache_key = @cache_prefix <> to_string(flag_name)
    Cachex.put(@cache_name, cache_key, flag, ttl: @cache_ttl)
    :ok
  end

  @doc """
  Removes a flag from the cache.
  """
  @spec invalidate_cache(atom() | String.t()) :: :ok
  def invalidate_cache(flag_name) do
    cache_key = @cache_prefix <> to_string(flag_name)
    Cachex.del(@cache_name, cache_key)
    :ok
  end

  @doc """
  Clears all entries from the feature flags cache.
  """
  @spec clear_all() :: :ok
  def clear_all do
    Cachex.clear(@cache_name)
    :ok
  end

  @doc """
  Returns the cache TTL value used for scheduling periodic syncs.
  """
  @spec cache_ttl() :: non_neg_integer()
  def cache_ttl, do: @cache_ttl

  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------

  @doc """
  Emits telemetry for a flag check event.
  """
  @spec emit_check_telemetry(atom() | String.t(), boolean(), integer()) :: :ok
  def emit_check_telemetry(flag_name, result, start_time) do
    duration = System.monotonic_time(:microsecond) - start_time

    :telemetry.execute(
      [:cgraph, :feature_flags, :check],
      %{duration: duration},
      %{flag: flag_name, result: result}
    )
  end

  @doc """
  Emits telemetry for a flag update event.
  """
  @spec emit_update_telemetry(atom() | String.t(), map()) :: :ok
  def emit_update_telemetry(flag_name, changes) do
    :telemetry.execute(
      [:cgraph, :feature_flags, :updated],
      %{system_time: System.system_time()},
      %{flag: flag_name, changes: changes}
    )
  end
end
