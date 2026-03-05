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

  @doc "Starts the server and links it to the calling process."
  @spec start_link(String.t()) :: GenServer.on_start()
  def start_link(document_id) do
    GenServer.start_link(__MODULE__, document_id, name: via(document_id))
  end

  @doc "Applies a Yjs document update from a client."
  @spec apply_update(String.t(), binary(), String.t()) :: :ok
  def apply_update(document_id, update, user_id) do
    ensure_started(document_id)
    GenServer.cast(via(document_id), {:apply_update, update, user_id})
  end

  @doc "Returns the current Yjs document state."
  @spec get_state(String.t()) :: {:ok, binary()}
  def get_state(document_id) do
    ensure_started(document_id)
    GenServer.call(via(document_id), :get_state)
  end

  @doc "Returns the current awareness state for all clients."
  @spec get_awareness(String.t()) :: {:ok, map()}
  def get_awareness(document_id) do
    ensure_started(document_id)
    GenServer.call(via(document_id), :get_awareness)
  end

  @doc "Updates awareness data for a connected client."
  @spec update_awareness(String.t(), String.t(), map()) :: :ok
  def update_awareness(document_id, user_id, data) do
    ensure_started(document_id)
    GenServer.cast(via(document_id), {:update_awareness, user_id, data})
  end

  @doc "Registers a client connection to the document."
  @spec client_connected(String.t(), String.t()) :: :ok
  def client_connected(document_id, user_id) do
    ensure_started(document_id)
    GenServer.cast(via(document_id), {:client_connected, user_id})
  end

  @doc "Unregisters a client from the document."
  @spec client_disconnected(String.t(), String.t()) :: :ok
  def client_disconnected(document_id, user_id) do
    GenServer.cast(via(document_id), {:client_disconnected, user_id})
  catch
    :exit, _ -> :ok
  end

  @doc """
  Replaces the document state with a compacted version from the client.

  Called when a client responds to a compaction request by running
  `Y.mergeUpdates()` and sending back the merged state.
  """
  @spec replace_state(String.t(), binary()) :: :ok
  def replace_state(document_id, compacted_state) when is_binary(compacted_state) do
    GenServer.cast(via(document_id), {:replace_state, compacted_state})
  end

  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------

  @doc "Initializes the server state."
  @spec init(String.t()) :: {:ok, map()}
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

    Logger.debug("documentserver_started_for", document_id: document_id)

    {:ok, state}
  end

  @doc "Handles asynchronous cast messages."
  @spec handle_cast(term(), map()) :: {:noreply, map()}
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
  def handle_cast({:replace_state, compacted_state}, state) when is_binary(compacted_state) do
    # Client-initiated compaction: replace current state with merged/compacted version
    old_size = byte_size(state.yjs_state)
    new_size = byte_size(compacted_state)

    Logger.info(
      "documentserver_state_compacted",
      document_id: state.document_id,
      old_size: old_size,
      new_size: new_size,
      savings_pct: if(old_size > 0, do: Float.round((1 - new_size / old_size) * 100, 1), else: 0.0)
    )

    {:noreply, %{state |
      yjs_state: compacted_state,
      pending_updates: [{compacted_state, "compaction", System.monotonic_time(:millisecond)}],
      last_activity: System.monotonic_time(:millisecond)
    }}
  end

  @doc "Handles synchronous call messages."
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  @impl true
  def handle_call(:get_state, _from, state) do
    {:reply, {:ok, state.yjs_state}, state}
  end

  @impl true
  def handle_call(:get_awareness, _from, state) do
    {:reply, {:ok, state.awareness}, state}
  end

  @doc "Handles asynchronous process messages."
  @spec handle_info(term(), map()) :: {:noreply, map()} | {:stop, :normal, map()}
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
        Logger.info("documentserver_shutting_down_for_inactivity", state_document_id: state.document_id)
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

  @doc "Cleans up resources on server termination."
  @spec terminate(term(), map()) :: :ok
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
        Logger.warning("document_not_found", state_document_id: state.document_id)
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
      Logger.error("failed_to_flush_document", state_document_id: state.document_id, error: inspect(error))
      state
  end

  defp compact_updates(state) do
    state_size = byte_size(state.yjs_state)

    cond do
      state_size > 512 * 1024 ->
        # Over 512KB — broadcast compaction request to connected clients
        Logger.info(
          "documentserver_requesting_compaction",
          document_id: state.document_id,
          size_kb: div(state_size, 1024),
          connected_clients: MapSet.size(state.connected_clients)
        )

        if MapSet.size(state.connected_clients) > 0 do
          Phoenix.PubSub.broadcast(
            CGraph.PubSub,
            "document:#{state.document_id}",
            {:compaction_request, %{
              document_id: state.document_id,
              current_size: state_size,
              reason: "periodic_check"
            }}
          )
        end

        state

      state_size > 256 * 1024 ->
        # Over 256KB — log warning for monitoring
        Logger.debug(
          "documentserver_state_growing",
          document_id: state.document_id,
          size_kb: div(state_size, 1024),
          update_count: state.update_count
        )
        state

      true ->
        state
    end
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
