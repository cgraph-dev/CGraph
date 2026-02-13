defmodule CGraph.Snowflake do
  @moduledoc """
  Discord-style Snowflake ID generator for guaranteed message ordering.

  ## Architecture

  ```
  ┌──────────────────────────────────────────────────────────────┐
  │                   Snowflake ID (64-bit)                      │
  ├──────────────────────────────────────────────────────────────┤
  │  Timestamp (42 bits)  │  Node (5) │  Worker (5) │  Seq (12) │
  │  ~139 years of IDs    │  32 nodes │  32 workers │  4096/ms  │
  └──────────────────────────────────────────────────────────────┘
  ```

  ## Properties

  - **Globally unique** across all nodes without coordination
  - **Time-ordered** — IDs sort chronologically by default
  - **Extractable timestamp** — can derive `inserted_at` from ID alone
  - **High throughput** — 4096 IDs per millisecond per worker

  ## Why This Matters (vs UUID/auto-increment)

  Discord uses Snowflake IDs for all messages. Benefits:
  - Cursor-based pagination is trivial (WHERE id > last_id ORDER BY id)
  - No need for composite (timestamp, id) indexes
  - Multi-node insert without sequence contention
  - Client can extract approximate timestamp without a DB query

  ## Usage

      id = CGraph.Snowflake.generate()
      # => 1234567890123456789

      {:ok, timestamp} = CGraph.Snowflake.extract_timestamp(id)
      # => ~U[2026-01-15 10:30:00.123Z]
  """

  use GenServer
  import Bitwise
  require Logger

  # CGraph epoch: 2026-01-01T00:00:00Z (milliseconds)
  @epoch 1_767_225_600_000

  # Bit allocations
  @node_bits 5
  @worker_bits 5
  @sequence_bits 12

  @max_node (1 <<< @node_bits) - 1
  @max_worker (1 <<< @worker_bits) - 1
  @max_sequence (1 <<< @sequence_bits) - 1

  @worker_shift @sequence_bits
  @node_shift @sequence_bits + @worker_bits
  @timestamp_shift @sequence_bits + @worker_bits + @node_bits

  # ── Client API ──

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Generate a new Snowflake ID. Returns a 64-bit integer.
  """
  @spec generate() :: pos_integer()
  def generate do
    GenServer.call(__MODULE__, :generate)
  end

  @doc """
  Generate a batch of Snowflake IDs. More efficient than calling generate/0 N times.
  """
  @spec generate_batch(pos_integer()) :: [pos_integer()]
  def generate_batch(count) when count > 0 and count <= 4096 do
    GenServer.call(__MODULE__, {:generate_batch, count})
  end

  @doc """
  Extract the UTC timestamp from a Snowflake ID.
  """
  @spec extract_timestamp(pos_integer()) :: {:ok, DateTime.t()} | {:error, :invalid_snowflake}
  def extract_timestamp(id) when is_integer(id) and id > 0 do
    timestamp_ms = (id >>> @timestamp_shift) + @epoch
    DateTime.from_unix(timestamp_ms, :millisecond)
  end

  def extract_timestamp(_), do: {:error, :invalid_snowflake}

  @doc """
  Extract the node ID from a Snowflake ID.
  """
  @spec extract_node(pos_integer()) :: non_neg_integer()
  def extract_node(id) when is_integer(id) and id > 0 do
    (id >>> @node_shift) &&& @max_node
  end

  @doc """
  Create a Snowflake ID from a DateTime for use as a cursor/boundary.
  Useful for queries like "get all messages after this timestamp".
  """
  @spec from_datetime(DateTime.t()) :: pos_integer()
  def from_datetime(%DateTime{} = dt) do
    timestamp_ms = DateTime.to_unix(dt, :millisecond)
    (timestamp_ms - @epoch) <<< @timestamp_shift
  end

  # ── Server Callbacks ──

  @impl true
  def init(opts) do
    node_id = Keyword.get(opts, :node_id, derive_node_id())
    worker_id = Keyword.get(opts, :worker_id, 0)

    if node_id > @max_node, do: raise("node_id must be 0-#{@max_node}")
    if worker_id > @max_worker, do: raise("worker_id must be 0-#{@max_worker}")

    Logger.info("snowflake_started", node_id: node_id, worker_id: worker_id)

    {:ok, %{
      node_id: node_id,
      worker_id: worker_id,
      sequence: 0,
      last_timestamp: 0
    }}
  end

  @impl true
  def handle_call(:generate, _from, state) do
    {id, new_state} = do_generate(state)
    {:reply, id, new_state}
  end

  @impl true
  def handle_call({:generate_batch, count}, _from, state) do
    {ids, new_state} = Enum.reduce(1..count, {[], state}, fn _, {acc, st} ->
      {id, new_st} = do_generate(st)
      {[id | acc], new_st}
    end)

    {:reply, Enum.reverse(ids), new_state}
  end

  # ── Internal ──

  defp do_generate(state) do
    timestamp = current_timestamp()

    {sequence, timestamp} = cond do
      timestamp == state.last_timestamp ->
        seq = state.sequence + 1
        if seq > @max_sequence do
          # Sequence exhausted for this millisecond — wait for next ms
          next_ts = wait_next_millis(state.last_timestamp)
          {0, next_ts}
        else
          {seq, timestamp}
        end

      timestamp > state.last_timestamp ->
        {0, timestamp}

      true ->
        # Clock moved backwards — wait for it to catch up (NTP drift)
        Logger.warning("snowflake_clock_regression",
          last: state.last_timestamp,
          current: timestamp,
          drift_ms: state.last_timestamp - timestamp
        )
        next_ts = wait_next_millis(state.last_timestamp)
        {0, next_ts}
    end

    id = (timestamp <<< @timestamp_shift)
      ||| (state.node_id <<< @node_shift)
      ||| (state.worker_id <<< @worker_shift)
      ||| sequence

    {id, %{state | sequence: sequence, last_timestamp: timestamp}}
  end

  defp current_timestamp do
    System.system_time(:millisecond) - @epoch
  end

  defp wait_next_millis(last_timestamp) do
    timestamp = current_timestamp()
    if timestamp <= last_timestamp do
      Process.sleep(1)
      wait_next_millis(last_timestamp)
    else
      timestamp
    end
  end

  defp derive_node_id do
    # On Fly.io, use FLY_ALLOC_ID or FLY_MACHINE_ID to derive a stable node ID
    # Falls back to a hash of the hostname
    case System.get_env("FLY_ALLOC_ID") || System.get_env("FLY_MACHINE_ID") do
      nil ->
        {:ok, hostname} = :inet.gethostname()
        :erlang.phash2(hostname, @max_node + 1)

      fly_id ->
        :erlang.phash2(fly_id, @max_node + 1)
    end
  end
end
