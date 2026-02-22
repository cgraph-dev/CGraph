defmodule CGraph.Presence.Sampled.Tiers do
  @moduledoc """
  Tier configuration, sampling logic, and HyperLogLog counting for sampled presence.

  Determines which tier a channel falls into based on its current user count,
  provides deterministic sampling decisions, and manages HyperLogLog-based
  approximate counting via Redis.

  ## Tier Thresholds

  | Channel Size    | Sample Rate | Batch Interval |
  |-----------------|-------------|----------------|
  | < 100           | 100%        | 0 (immediate)  |
  | 100 – 1,000     | 50%         | 1 s            |
  | 1,000 – 10,000   | 10%         | 5 s            |
  | 10,000 – 100,000 | 1%          | 10 s           |
  | > 100,000       | 0.1%        | 30 s           |
  """

  alias CGraph.Redis

  @hll_prefix "presence:hll:"

  @default_tiers [
    %{max_size: 100, sample_rate: 1.0, batch_interval: 0},
    %{max_size: 1_000, sample_rate: 0.5, batch_interval: 1_000},
    %{max_size: 10_000, sample_rate: 0.1, batch_interval: 5_000},
    %{max_size: 100_000, sample_rate: 0.01, batch_interval: 10_000},
    %{max_size: :infinity, sample_rate: 0.001, batch_interval: 30_000}
  ]

  @type tier :: %{
          max_size: non_neg_integer() | :infinity,
          sample_rate: float(),
          batch_interval: non_neg_integer()
        }

  @doc """
  Returns the default tier configuration list.
  """
  @spec default_tiers() :: [tier()]
  def default_tiers, do: @default_tiers

  @doc """
  Get the tier for the given user count.
  """
  @spec get_tier(non_neg_integer()) :: tier()
  def get_tier(count) do
    tiers = config(:tiers) || @default_tiers

    Enum.find(tiers, List.last(tiers), fn tier ->
      tier.max_size == :infinity or count <= tier.max_size
    end)
  end

  @doc """
  Determine whether a user should be included in the sample.

  Uses deterministic hashing so the same user is always in or out of the sample
  regardless of when the decision is made.
  """
  @spec should_sample?(String.t(), float()) :: boolean()
  def should_sample?(_user_id, sample_rate) when sample_rate >= 1.0, do: true

  def should_sample?(user_id, sample_rate) do
    hash = :erlang.phash2(user_id, 1000)
    threshold = round(sample_rate * 1000)
    hash < threshold
  end

  @doc """
  Get approximate online count for a channel using HyperLogLog.

  This is O(1) memory and time complexity regardless of channel size.
  Falls back to ETS count on Redis failure.
  """
  @spec approximate_count(String.t()) :: {:ok, non_neg_integer()}
  def approximate_count(channel_id) do
    hll_key = "#{@hll_prefix}#{channel_id}"

    case Redis.command(["PFCOUNT", hll_key]) do
      {:ok, count} when is_integer(count) ->
        {:ok, count}

      {:ok, count} when is_binary(count) ->
        {:ok, String.to_integer(count)}

      {:error, _} ->
        count = CGraph.Presence.Sampled.Store.ets_count(channel_id)
        {:ok, count}
    end
  end

  @doc """
  Add a user to the HyperLogLog counter for a channel.
  """
  @spec hll_add(String.t(), String.t()) :: term()
  def hll_add(channel_id, user_id) do
    hll_key = "#{@hll_prefix}#{channel_id}"
    Redis.command(["PFADD", hll_key, user_id])
  end

  @doc """
  Get total members for a channel.

  In a real implementation, this would query the database
  for total channel membership count.
  """
  @spec get_total_members(String.t()) :: non_neg_integer()
  def get_total_members(_channel_id) do
    0
  end

  @doc """
  Read a configuration key from application config for `CGraph.Presence.Sampled`.
  """
  @spec config(atom()) :: term()
  def config(key) do
    Application.get_env(:cgraph, CGraph.Presence.Sampled, [])
    |> Keyword.get(key)
  end
end
