defmodule CGraph.Cache.Tiered do
  @moduledoc """
  Multi-tier cache orchestration.

  Implements the cascading read (L1 → L2 → L3) with optional
  promotion of found values to higher tiers, and the write-through
  strategy that fans out writes to all tiers.
  """

  alias CGraph.Cache.{L1, L2, L3, Telemetry}

  @default_ttl :timer.minutes(5)

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Read through all tiers in order, promoting on hit when requested.
  """
  def get_all(key, promote) do
    try_tier(:l1, key, promote)
  end

  @doc """
  Write value to every tier.
  """
  def set_all(key, value, ttl) do
    L1.set(key, value, ttl)
    L2.set(key, value, ttl)
    L3.set(key, value, ttl)
    :ok
  end

  @doc false
  def default_ttl, do: @default_ttl

  # ---------------------------------------------------------------------------
  # Internals
  # ---------------------------------------------------------------------------

  defp try_tier(:l1, key, promote) do
    case L1.get(key) do
      {:ok, value} ->
        Telemetry.emit_hit(:l1)
        {:ok, value}

      {:error, :not_found} ->
        try_tier(:l2, key, promote)
    end
  end

  defp try_tier(:l2, key, promote) do
    case L2.get(key) do
      {:ok, value} ->
        Telemetry.emit_hit(:l2)
        if promote, do: L1.set(key, value, @default_ttl)
        {:ok, value}

      {:error, :not_found} ->
        try_tier(:l3, key, promote)
    end
  end

  defp try_tier(:l3, key, promote) do
    case L3.get(key) do
      {:ok, value} ->
        Telemetry.emit_hit(:l3)

        if promote do
          L2.set(key, value, @default_ttl)
          L1.set(key, value, @default_ttl)
        end

        {:ok, value}

      error ->
        Telemetry.emit_miss()
        error
    end
  end
end
