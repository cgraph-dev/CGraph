defmodule CGraph.Collaboration.DocumentServer do
  @moduledoc """
  GenServer managing real-time state for a single collaborative document.

  Each active document gets one DocumentServer. It:
  - Holds the merged Yjs state + pending updates in memory
  - Buffers incremental updates and flushes to DB periodically
  - Broadcasts updates via Phoenix PubSub
  - Tracks awareness (cursors, selections, user presence)
  - Compacts accumulated updates periodically

  Starts on demand via `DynamicSupervisor` and shuts down after
  inactivity timeout (5 minutes with no connected clients).
  """

  use GenServer

  require Logger

  alias CGraph.Collaboration.Document
  alias CGraph.Repo

  @flush_interval :timer.seconds(5)
  @compaction_interval :timer.minutes(10)
  @inactivity_timeout :timer.minutes(5)

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  def start_link(document_id) do
    GenServer.start_link(__MODULE__, document_id, name: via(document_id))
  end

  def apply_update(document_id, update, user_id) do
    ensure_started(document_id)
    GenServer.cast(via(document_id), {:apply_update, update, user_id})
  end

  def get_state(document_id) do
    ensure_started(document_id)
    GenServer.call(via(document_id), :get_state)
  end

  def get_awareness(document_id) do
    ensure_started(document_id)
    GenServer.call(via(document_id), :get_awareness)
  end

  def update_awareness(document_id, user_id, data) do
    ensure_started(document_id)
    GenServer.cast(via(document_id), {:update_awareness, user_id, data})
  end

  def client_connected(document_id, user_id) do
    ensure_started(document_id)
    GenServer.cast(via(document_id), {:client_connected, user_id})
  end

  def client_disconnected(document_id, user_id) do
    GenServer.cast(via(document_id), {:client_disconnected, user_id})
  catch
    :exit, _ -> :ok
  end

  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------

  @impl true
  def init(document_id) do
    state = %{
      document_id: document_id,
      yjs_state: <<>>,
      pending_updates: [],
      update_count: 0,
      awareness: %{},
      connected_clients: MapSet.new(),
      last_activity: System.monotonic_time(:millisecond)
    }

    # Load initial state from DB
    state = load_from_db(state)

    schedule_flush()
    schedule_compaction()
    schedule_inactivity_check()

    Logger.debug("DocumentServer started for #{document_id}")

    {:ok, state}
  end

  @impl true
  def handle_cast({:apply_update, update, user_id}, state) do
    # Append to pending updates
    pending = [{update, user_id, System.monotonic_time(:millisecond)} | state.pending_updates]

    # Merge into in-memory state
    merged = merge_yjs_update(state.yjs_state, update)

    # Broadcast to all connected clients via PubSub
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "document:#{state.document_id}",
      {:yjs_update, update, user_id}
    )

    {:noreply, %{state |
      yjs_state: merged,
      pending_updates: pending,
      update_count: state.update_count + 1,
      last_activity: System.monotonic_time(:millisecond)
    }}
  end

  @impl true
  def handle_cast({:update_awareness, user_id, data}, state) do
    awareness = Map.put(state.awareness, user_id, %{
      data: data,
      timestamp: System.monotonic_time(:millisecond)
    })

    # Broadcast awareness to other clients
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "document:#{state.document_id}",
      {:awareness_update, user_id, data}
    )

    {:noreply, %{state | awareness: awareness, last_activity: System.monotonic_time(:millisecond)}}
  end

  @impl true
  def handle_cast({:client_connected, user_id}, state) do
    clients = MapSet.put(state.connected_clients, user_id)
    {:noreply, %{state | connected_clients: clients, last_activity: System.monotonic_time(:millisecond)}}
  end

  @impl true
  def handle_cast({:client_disconnected, user_id}, state) do
    clients = MapSet.delete(state.connected_clients, user_id)
    awareness = Map.delete(state.awareness, user_id)

    # Broadcast awareness removal
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "document:#{state.document_id}",
      {:awareness_remove, user_id}
    )

    {:noreply, %{state | connected_clients: clients, awareness: awareness}}
  end

  @impl true
  def handle_call(:get_state, _from, state) do
    {:reply, {:ok, state.yjs_state}, state}
  end

  @impl true
  def handle_call(:get_awareness, _from, state) do
    {:reply, {:ok, state.awareness}, state}
  end

  @impl true
  def handle_info(:flush, state) do
    state = flush_to_db(state)
    schedule_flush()
    {:noreply, state}
  end

  @impl true
  def handle_info(:compact, state) do
    state = compact_updates(state)
    schedule_compaction()
    {:noreply, state}
  end

  @impl true
  def handle_info(:check_inactivity, state) do
    if MapSet.size(state.connected_clients) == 0 do
      elapsed = System.monotonic_time(:millisecond) - state.last_activity
      if elapsed > @inactivity_timeout do
        Logger.info("DocumentServer shutting down for inactivity: #{state.document_id}")
        # Final flush before shutdown
        flush_to_db(state)
        {:stop, :normal, state}
      else
        schedule_inactivity_check()
        {:noreply, state}
      end
    else
      schedule_inactivity_check()
      {:noreply, state}
    end
  end

  @impl true
  def terminate(_reason, state) do
    # Ensure all pending updates are persisted
    flush_to_db(state)
    :ok
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp via(document_id) do
    {:via, Registry, {CGraph.Collaboration.DocumentRegistry, document_id}}
  end

  defp ensure_started(document_id) do
    case Registry.lookup(CGraph.Collaboration.DocumentRegistry, document_id) do
      [{_pid, _}] -> :ok
      [] ->
        DynamicSupervisor.start_child(
          CGraph.Collaboration.DocumentSupervisor,
          {__MODULE__, document_id}
        )
        :ok
    end
  end

  defp load_from_db(state) do
    case Repo.get(Document, state.document_id) do
      nil ->
        Logger.warning("Document not found: #{state.document_id}")
        state

      doc ->
        %{state | yjs_state: doc.yjs_state || <<>>}
    end
  end

  defp flush_to_db(%{pending_updates: []} = state), do: state

  defp flush_to_db(state) do
    case Repo.get(Document, state.document_id) do
      nil ->
        state

      doc ->
        last_editor =
          case state.pending_updates do
            [{_update, user_id, _ts} | _] -> user_id
            _ -> nil
          end

        doc
        |> Document.changeset(%{
          yjs_state: state.yjs_state,
          version: state.update_count,
          last_edited_by: last_editor
        })
        |> Repo.update()

        %{state | pending_updates: []}
    end
  rescue
    error ->
      Logger.error("Failed to flush document #{state.document_id}: #{inspect(error)}")
      state
  end

  defp compact_updates(state) do
    # TODO(P2): Implement server-side Yjs state compaction.
    # Currently the server concatenates binary updates, which causes O(n) growth.
    # Full compaction requires either:
    #   1. A Yjs NIF (Rust y-crdt via Rustler)
    #   2. A sidecar JS worker running Yjs merge
    # Until then, clients reconcile via Yjs CRDT merge on pull.
    Logger.debug("Compaction check for #{state.document_id}: #{state.update_count} updates, #{byte_size(state.yjs_state)} bytes")
    state
  end

  defp merge_yjs_update(existing_state, new_update) do
    # Yjs merging happens client-side. Server stores the concatenated
    # binary updates. Full server-side Yjs merge would require an NIF
    # or a JS worker process.
    #
    # For now, append updates — clients reconcile via Yjs CRDT merge
    if byte_size(existing_state) == 0 do
      new_update
    else
      existing_state <> new_update
    end
  end

  defp schedule_flush do
    Process.send_after(self(), :flush, @flush_interval)
  end

  defp schedule_compaction do
    Process.send_after(self(), :compact, @compaction_interval)
  end

  defp schedule_inactivity_check do
    Process.send_after(self(), :check_inactivity, @inactivity_timeout)
  end
end
