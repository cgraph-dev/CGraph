defmodule CGraph.Cache.L1 do
  @moduledoc """
  L1 Cache tier — process-local ETS for hot data.

  Provides sub-microsecond lookups using a named ETS table.
  Entries are stored as `{key, value, expiry}` tuples where
  `expiry` is either `:infinity` or a monotonic-time deadline
  in milliseconds.
  """

  @l1_table :cgraph_l1_cache

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc false
  @spec get(term()) :: {:ok, term()} | {:error, :not_found}
  def get(key) do
    table = ensure_table()

    case :ets.lookup(table, key) do
      [{^key, value, expiry}] ->
        if expiry == :infinity or expiry > System.monotonic_time(:millisecond) do
          {:ok, value}
        else
          :ets.delete(table, key)
          {:error, :not_found}
        end

      [] ->
        {:error, :not_found}
    end
  end

  @doc false
  @spec set(term(), term(), non_neg_integer() | :infinity) :: :ok
  def set(key, value, ttl) do
    table = ensure_table()

    expiry =
      if ttl == :infinity do
        :infinity
      else
        System.monotonic_time(:millisecond) + ttl
      end

    :ets.insert(table, {key, value, expiry})
    :ok
  end

  @doc false
  @spec delete(term()) :: :ok
  def delete(key) do
    table = ensure_table()
    :ets.delete(table, key)
    :ok
  end

  @doc false
  @spec clear() :: :ok
  def clear do
    if :ets.whereis(@l1_table) != :undefined do
      :ets.delete_all_objects(@l1_table)
    end

    :ok
  end

  @doc false
  @spec stats() :: map()
  def stats do
    if :ets.whereis(@l1_table) != :undefined do
      %{
        size: :ets.info(@l1_table, :size),
        memory_bytes: :ets.info(@l1_table, :memory) * :erlang.system_info(:wordsize)
      }
    else
      %{size: 0, memory_bytes: 0}
    end
  end

  @doc false
  @spec size() :: non_neg_integer()
  def size do
    if :ets.whereis(@l1_table) != :undefined do
      :ets.info(@l1_table, :size)
    else
      0
    end
  end

  # ---------------------------------------------------------------------------
  # Internals
  # ---------------------------------------------------------------------------

  defp ensure_table do
    case :ets.whereis(@l1_table) do
      :undefined ->
        :ets.new(@l1_table, [:set, :public, :named_table, read_concurrency: true])

      table ->
        table
    end
  end
end
