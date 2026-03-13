defmodule CGraph.Presence.Sampled do
  @moduledoc """
  Presence sampling for large channels with millions of users.

  ## Overview

  Standard Phoenix.Presence broadcasts to ALL connected users when presence
  changes. This causes CPU spikes and network saturation for large channels.
  This module provides:

  - **Presence Sampling**: Only track a statistical sample of users
  - **HyperLogLog Counts**: Approximate user counts with O(1) memory
  - **Tiered Broadcasting**: Different strategies based on channel size
  - **Probabilistic Sync**: Reduced sync frequency for large channels

  ## Architecture

  See `CGraph.Presence.Sampled.Tiers` for tier thresholds.
  HyperLogLog provides approximate counts with ~12KB memory (±2% error).

  ## Usage

      # Track user with automatic sampling decision
      {:ok, tracked?} = SampledPresence.track(channel_id, user_id, meta)

      # Get approximate online count (O(1) operation)
      {:ok, ~45_000} = SampledPresence.approximate_count(channel_id)

      # Get online users (returns sample for large channels)
      {:ok, users} = SampledPresence.list_online(channel_id)

      # Get presence summary for client
      summary = SampledPresence.get_summary(channel_id)
      # => %{total: 1_234_567, online: 45_123, typing: 23, approximate: true}

  ## Configuration

      config :cgraph, CGraph.Presence.Sampled,
        tiers: [
          %{max_size: 100, sample_rate: 1.0, batch_interval: 0},
          %{max_size: 1_000, sample_rate: 0.5, batch_interval: 1_000},
          %{max_size: 10_000, sample_rate: 0.1, batch_interval: 5_000},
          %{max_size: 100_000, sample_rate: 0.01, batch_interval: 10_000},
          %{max_size: :infinity, sample_rate: 0.001, batch_interval: 30_000}
        ],
        hll_precision: 14,
        enable_bloom_filter: true
  """

  use GenServer
  require Logger

  alias CGraph.Presence.Sampled.Store
  alias CGraph.Presence.Sampled.Tiers

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type channel_id :: String.t()
  @type user_id :: String.t()

  @type presence_meta :: %{
          optional(:status) => String.t(),
          optional(:typing) => boolean(),
          optional(:device) => String.t()
        }

  @type presence_summary :: %{
          total: non_neg_integer(),
          online: non_neg_integer(),
          typing: non_neg_integer(),
          approximate: boolean(),
          sample_rate: float()
        }

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc """
  Start the sampled presence manager.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Track a user's presence with automatic sampling.

  Returns `{:ok, true}` if user is tracked in sample,
  `{:ok, false}` if user counted but not in sample.
  """
  @spec track(channel_id(), user_id(), presence_meta()) :: {:ok, boolean()}
  def track(channel_id, user_id, meta \\ %{}) do
    GenServer.call(__MODULE__, {:track, channel_id, user_id, meta})
  end

  @doc """
  Untrack a user from a channel.
  """
  @spec untrack(channel_id(), user_id()) :: :ok
  def untrack(channel_id, user_id) do
    GenServer.call(__MODULE__, {:untrack, channel_id, user_id})
  end

  @doc """
  Update user metadata (typing, status, etc).
  Only updates if user is in the tracked sample.
  """
  @spec update(channel_id(), user_id(), map()) :: term()
  def update(channel_id, user_id, meta_updates) do
    GenServer.call(__MODULE__, {:update, channel_id, user_id, meta_updates})
  end

  @doc """
  Get approximate online count using HyperLogLog.

  This is O(1) memory and time complexity regardless of channel size.
  """
  defdelegate approximate_count(channel_id), to: Tiers

  @doc """
  Get the sampled online users.

  For large channels, this returns only the tracked sample.
  """
  @spec list_online(channel_id(), keyword()) :: {:ok, [map()]}
  def list_online(channel_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)
    {:ok, Store.list_online_entries(channel_id, limit)}
  end

  @doc """
  Get users currently typing in a channel.

  Only considers users in the tracked sample.
  """
  @spec list_typing(channel_id()) :: {:ok, [map()]}
  def list_typing(channel_id) do
    {:ok, Store.list_typing_entries(channel_id)}
  end

  @doc """
  Get presence summary for a channel.

  Returns approximate counts for large channels.
  """
  @spec get_summary(channel_id()) :: presence_summary()
  def get_summary(channel_id) do
    with {:ok, online_count} <- Tiers.approximate_count(channel_id),
         {:ok, typing_list} <- list_typing(channel_id) do
      tier = Tiers.get_tier(online_count)
      total = Tiers.get_total_members(channel_id)

      %{
        total: total,
        online: online_count,
        typing: length(typing_list),
        approximate: tier.sample_rate < 1.0,
        sample_rate: tier.sample_rate
      }
    else
      _ ->
        %{total: 0, online: 0, typing: 0, approximate: false, sample_rate: 1.0}
    end
  end

  @doc """
  Check if a specific user is online.

  For sampled channels, this checks the tracked sample.
  """
  defdelegate user_online?(channel_id, user_id), to: Store, as: :user_in_sample?

  @doc """
  Get the current tier for a channel based on size.
  """
  @spec get_channel_tier(channel_id()) :: map()
  def get_channel_tier(channel_id) do
    case Tiers.approximate_count(channel_id) do
      {:ok, count} -> Tiers.get_tier(count)
    end
  end

  @doc """
  Force broadcast presence summary to all channel subscribers.

  Used for manual refresh or periodic updates.
  """
  @spec broadcast_summary(channel_id()) :: :ok | {:error, term()}
  def broadcast_summary(channel_id) do
    summary = get_summary(channel_id)

    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "presence:#{channel_id}",
      {:presence_summary, summary}
    )
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @doc "Initializes the process state."
  @spec init(keyword()) :: {:ok, map()}
  @impl true
  def init(_opts) do
    Store.init_table()

    schedule_cleanup()
    schedule_batch_broadcasts()

    {:ok, %{pending_broadcasts: %{}}}
  end

  @doc "Handles synchronous call messages."
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  @impl true
  def handle_call({:track, channel_id, user_id, meta}, _from, state) do
    # Always add to HyperLogLog for counting
    Tiers.hll_add(channel_id, user_id)

    # Determine if we should track in sample
    {:ok, current_count} = Tiers.approximate_count(channel_id)
    tier = Tiers.get_tier(current_count)

    should_sample = Tiers.should_sample?(user_id, tier.sample_rate)

    if should_sample do
      Store.add_to_sample(channel_id, user_id, meta)

      state =
        if tier.batch_interval > 0 do
          schedule_channel_broadcast(state, channel_id, tier.batch_interval)
        else
          broadcast_change(channel_id, :join, user_id, meta)
          state
        end

      {:reply, {:ok, true}, state}
    else
      {:reply, {:ok, false}, state}
    end
  end

  @impl true
  def handle_call({:untrack, channel_id, user_id}, _from, state) do
    Store.remove_from_sample(channel_id, user_id)

    {:ok, current_count} = Tiers.approximate_count(channel_id)
    tier = Tiers.get_tier(current_count)

    state =
      if tier.batch_interval > 0 do
        schedule_channel_broadcast(state, channel_id, tier.batch_interval)
      else
        broadcast_change(channel_id, :leave, user_id, %{})
        state
      end

    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:update, channel_id, user_id, meta_updates}, _from, state) do
    result = Store.update_sample(channel_id, user_id, meta_updates)

    if Map.has_key?(meta_updates, :typing) do
      {:ok, current_count} = Tiers.approximate_count(channel_id)
      tier = Tiers.get_tier(current_count)

      if tier.sample_rate == 1.0 do
        broadcast_change(channel_id, :typing, user_id, meta_updates)
      end
    end

    {:reply, result, state}
  end

  @doc "Handles generic messages."
  @spec handle_info(term(), map()) :: {:noreply, map()}
  @impl true
  def handle_info({:broadcast, channel_id}, state) do
    broadcast_summary(channel_id)
    pending = Map.delete(state.pending_broadcasts, channel_id)
    {:noreply, %{state | pending_broadcasts: pending}}
  end

  @impl true
  def handle_info(:cleanup, state) do
    Store.cleanup_stale_entries()
    schedule_cleanup()
    {:noreply, state}
  end

  @impl true
  def handle_info(:batch_broadcasts, state) do
    broadcast_all_summaries()
    schedule_batch_broadcasts()
    {:noreply, state}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp schedule_channel_broadcast(state, channel_id, interval) do
    if Map.has_key?(state.pending_broadcasts, channel_id) do
      state
    else
      ref = Process.send_after(self(), {:broadcast, channel_id}, interval)
      pending = Map.put(state.pending_broadcasts, channel_id, ref)
      %{state | pending_broadcasts: pending}
    end
  end

  defp broadcast_change(channel_id, event, user_id, meta) do
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "presence:#{channel_id}",
      {:presence_change, %{event: event, user_id: user_id, meta: meta}}
    )
  end

  defp broadcast_all_summaries do
    :ets.foldl(
      fn
        {{:sample, channel_id}, _}, acc ->
          case Tiers.approximate_count(channel_id) do
            {:ok, count} when count > 1000 ->
              broadcast_summary(channel_id)

            _ ->
              :ok
          end

          acc

        _, acc ->
          acc
      end,
      nil,
      Store.table_name()
    )
  end

  defp schedule_cleanup do
    Process.send_after(self(), :cleanup, 60_000)
  end

  defp schedule_batch_broadcasts do
    Process.send_after(self(), :batch_broadcasts, 30_000)
  end
end
