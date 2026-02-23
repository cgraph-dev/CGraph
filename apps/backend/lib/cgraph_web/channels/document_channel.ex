defmodule CGraphWeb.Channels.DocumentChannel do
  @moduledoc """
  Phoenix Channel for real-time collaborative document editing.

  Uses Yjs CRDT for conflict-free concurrent editing. Each document
  gets its own channel topic: `document:{document_id}`.

  ## Protocol

  ### Client → Server
  - `yjs_update` — Binary Yjs update (incremental change)
  - `awareness_update` — Cursor position, selection, user info
  - `request_state` — Request full document state for sync

  ### Server → Client
  - `yjs_update` — Broadcast of another client's update
  - `initial_state` — Full Yjs state on join
  - `awareness_update` — Another client's cursor/presence
  - `awareness_remove` — Client disconnected
  - `user_joined` — New collaborator connected
  - `user_left` — Collaborator disconnected
  """

  use CGraphWeb, :channel

  require Logger

  alias CGraph.Collaboration
  alias CGraph.Collaboration.DocumentServer

  @impl true
  @doc "Handles a client joining the channel."
  @spec join(String.t(), map(), Phoenix.Socket.t()) :: {:ok, Phoenix.Socket.t()} | {:error, map()}
  def join("document:" <> document_id, _params, socket) do
    user = socket.assigns.current_user
    user_id = user.id

    case Collaboration.get_document(document_id, user_id) do
      {:ok, _document} ->
        # Register this client with the document server
        DocumentServer.client_connected(document_id, user_id)

        # Subscribe to PubSub for this document
        Phoenix.PubSub.subscribe(CGraph.PubSub, "document:#{document_id}")

        # Send initial state
        {:ok, state} = Collaboration.get_state(document_id)
        {:ok, awareness} = Collaboration.get_awareness(document_id)

        socket =
          socket
          |> assign(:document_id, document_id)
          |> assign(:user_id, user_id)

        # Schedule sending initial state after join completes
        send(self(), {:send_initial_state, state, awareness})

        # Broadcast join to other clients
        broadcast_from!(socket, "user_joined", %{
          user_id: user_id,
          username: user.username || "Unknown"
        })

        {:ok, socket}

      {:error, :not_found} ->
        {:error, %{reason: "document_not_found"}}

      {:error, :forbidden} ->
        {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  @doc "Handles incoming channel messages from the client."
  @spec handle_in(String.t(), map(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()} | {:reply, term(), Phoenix.Socket.t()}
  def handle_in("yjs_update", %{"update" => update_base64}, socket) do
    document_id = socket.assigns.document_id
    user_id = socket.assigns.user_id

    # Decode base64 update to binary
    case Base.decode64(update_base64) do
      {:ok, update} ->
        Collaboration.apply_update(document_id, update, user_id)
        {:noreply, socket}

      :error ->
        push(socket, "error", %{message: "Invalid update encoding"})
        {:noreply, socket}
    end
  end

  @impl true
  def handle_in("awareness_update", %{"data" => data}, socket) do
    document_id = socket.assigns.document_id
    user_id = socket.assigns.user_id

    Collaboration.update_awareness(document_id, user_id, data)
    {:noreply, socket}
  end

  @impl true
  def handle_in("request_state", _params, socket) do
    document_id = socket.assigns.document_id

    {:ok, state} = Collaboration.get_state(document_id)
    push(socket, "initial_state", %{
      state: Base.encode64(state),
      version: byte_size(state)
    })

    {:noreply, socket}
  end

  # ---------------------------------------------------------------------------
  # PubSub message handling
  # ---------------------------------------------------------------------------

  @impl true
  @doc "Handles generic messages."
  @spec handle_info(term(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()}
  def handle_info({:send_initial_state, state, awareness}, socket) do
    push(socket, "initial_state", %{
      state: Base.encode64(state),
      awareness: awareness
    })
    {:noreply, socket}
  end

  @impl true
  def handle_info({:yjs_update, update, from_user_id}, socket) do
    # Always forward updates — the client-side Yjs provider uses origin-based
    # filtering to avoid re-applying its own changes. This allows same-user
    # multi-tab editing to work correctly.
    push(socket, "yjs_update", %{
      update: Base.encode64(update),
      user_id: from_user_id
    })
    {:noreply, socket}
  end

  @impl true
  def handle_info({:awareness_update, user_id, data}, socket) do
    if user_id != socket.assigns.user_id do
      push(socket, "awareness_update", %{
        user_id: user_id,
        data: data
      })
    end
    {:noreply, socket}
  end

  @impl true
  def handle_info({:awareness_remove, user_id}, socket) do
    push(socket, "awareness_remove", %{user_id: user_id})
    {:noreply, socket}
  end

  @impl true
  @doc "Handles process termination cleanup."
  @spec terminate(term(), Phoenix.Socket.t()) :: :ok
  def terminate(_reason, socket) do
    if document_id = socket.assigns[:document_id] do
      user_id = socket.assigns.user_id
      DocumentServer.client_disconnected(document_id, user_id)

      broadcast_from!(socket, "user_left", %{user_id: user_id})
    end

    :ok
  end
end
