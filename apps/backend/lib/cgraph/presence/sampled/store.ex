defmodule CGraph.Presence.Sampled.Store do
  @moduledoc """
  ETS-based sample storage for sampled presence tracking.

  Manages the ETS table that holds tracked user samples per channel,
  including CRUD operations, queries, and periodic cleanup of stale entries.
  """

  @ets_table :cgraph_sampled_presence

  @doc """
  Returns the ETS table name used for sampled presence.
  """
  @spec table_name() :: atom()
  def table_name, do: @ets_table

  @doc """
  Initialize the ETS table for presence tracking.
  """
  @spec init_table() :: atom()
  def init_table do
    :ets.new(@ets_table, [
      :named_table,
      :public,
      :set,
      {:read_concurrency, true},
      {:write_concurrency, true}
    ])
  end

  @doc """
  Add a user to the tracked sample for a channel.
  """
  @spec add_to_sample(String.t(), String.t(), map()) :: true
  def add_to_sample(channel_id, user_id, meta) do
    now = DateTime.utc_now()

    full_meta =
      Map.merge(meta, %{
        tracked_at: now,
        last_active: now
      })

    case :ets.lookup(@ets_table, {:sample, channel_id}) do
      [{_, sample_map}] ->
        updated = Map.put(sample_map, user_id, full_meta)
        :ets.insert(@ets_table, {{:sample, channel_id}, updated})

      [] ->
        :ets.insert(@ets_table, {{:sample, channel_id}, %{user_id => full_meta}})
    end
  end

  @doc """
  Remove a user from the tracked sample for a channel.
  """
  @spec remove_from_sample(String.t(), String.t()) :: true | :ok
  def remove_from_sample(channel_id, user_id) do
    case :ets.lookup(@ets_table, {:sample, channel_id}) do
      [{_, sample_map}] ->
        updated = Map.delete(sample_map, user_id)

        if map_size(updated) == 0 do
          :ets.delete(@ets_table, {:sample, channel_id})
        else
          :ets.insert(@ets_table, {{:sample, channel_id}, updated})
        end

      [] ->
        :ok
    end
  end

  @doc """
  Update metadata for a user in the tracked sample.
  """
  @spec update_sample(String.t(), String.t(), map()) ::
          {:ok, map()} | {:error, :not_in_sample | :channel_not_found}
  def update_sample(channel_id, user_id, meta_updates) do
    case :ets.lookup(@ets_table, {:sample, channel_id}) do
      [{_, sample_map}] ->
        case Map.get(sample_map, user_id) do
          nil ->
            {:error, :not_in_sample}

          current_meta ->
            updated_meta = Map.merge(current_meta, meta_updates)
            updated_meta = Map.put(updated_meta, :last_active, DateTime.utc_now())
            updated_map = Map.put(sample_map, user_id, updated_meta)
            :ets.insert(@ets_table, {{:sample, channel_id}, updated_map})
            {:ok, updated_meta}
        end

      [] ->
        {:error, :channel_not_found}
    end
  end

  @doc """
  Get the count of users in the ETS sample for a channel.
  """
  @spec ets_count(String.t()) :: non_neg_integer()
  def ets_count(channel_id) do
    case :ets.lookup(@ets_table, {:sample, channel_id}) do
      [{_, sample_map}] -> map_size(sample_map)
      [] -> 0
    end
  end

  @doc """
  List online users from the sample, up to the given limit.
  """
  @spec list_online_entries(String.t(), non_neg_integer()) :: [map()]
  def list_online_entries(channel_id, limit) do
    case :ets.lookup(@ets_table, {:sample, channel_id}) do
      [{_, sample_map}] ->
        sample_map
        |> Map.to_list()
        |> Enum.take(limit)
        |> Enum.map(fn {user_id, meta} -> %{id: user_id, meta: meta} end)

      [] ->
        []
    end
  end

  @doc """
  List user IDs currently typing in a channel from the tracked sample.
  """
  @spec list_typing_entries(String.t()) :: [String.t()]
  def list_typing_entries(channel_id) do
    case :ets.lookup(@ets_table, {:sample, channel_id}) do
      [{_, sample_map}] ->
        sample_map
        |> Enum.filter(fn {_, meta} -> Map.get(meta, :typing, false) end)
        |> Enum.map(fn {user_id, _} -> user_id end)

      [] ->
        []
    end
  end

  @doc """
  Check if a user is present in the tracked sample for a channel.
  """
  @spec user_in_sample?(String.t(), String.t()) :: boolean()
  def user_in_sample?(channel_id, user_id) do
    case :ets.lookup(@ets_table, {:sample, channel_id}) do
      [{_, sample_map}] ->
        Map.has_key?(sample_map, user_id)

      [] ->
        false
    end
  end

  @doc """
  Remove stale entries from all channel samples.

  Entries older than 5 minutes (300 seconds) are considered stale.
  """
  @spec cleanup_stale_entries() :: nil
  def cleanup_stale_entries do
    now = DateTime.utc_now()
    stale_threshold = 300

    :ets.foldl(
      fn
        {{:sample, channel_id}, sample_map}, acc ->
          cleaned =
            Enum.filter(sample_map, fn {_user_id, meta} ->
              case Map.get(meta, :last_active) do
                nil -> false
                last_active -> DateTime.diff(now, last_active, :second) < stale_threshold
              end
            end)
            |> Map.new()

          if map_size(cleaned) == 0 do
            :ets.delete(@ets_table, {:sample, channel_id})
          else
            :ets.insert(@ets_table, {{:sample, channel_id}, cleaned})
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
