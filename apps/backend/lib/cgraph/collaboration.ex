defmodule CGraph.Collaboration do
  @moduledoc """
  Collaborative Editing Context.

  Manages real-time collaborative document editing using Yjs CRDT state
  synchronized via Phoenix Channels. Documents are stored as Yjs binary
  updates in PostgreSQL with periodic compaction.

  ## Architecture

  ```
  Client A (Yjs)  ─── document:{id} channel ───┐
                                                 ├── CGraph.Collaboration.DocumentServer (GenServer)
  Client B (Yjs)  ─── document:{id} channel ───┘       │
                                                        ├── Broadcast updates to all connected clients
                                                        ├── Buffer + flush to DB (every 5s)
                                                        └── Periodic compaction (merge updates)
  ```

  Each active document gets a `DocumentServer` GenServer that:
  - Holds the latest Yjs state in memory
  - Buffers incremental updates and flushes to DB periodically
  - Broadcasts updates to all connected clients via PubSub
  - Tracks connected users for presence/cursor display
  """

  alias CGraph.Collaboration.{Document, DocumentServer}
  alias CGraph.Repo

  import Ecto.Query

  require Logger

  # ---------------------------------------------------------------------------
  # Documents CRUD
  # ---------------------------------------------------------------------------

  @doc """
  Create a new collaborative document.
  """
  def create_document(attrs) do
    %Document{}
    |> Document.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Get a document by ID.
  """
  def get_document(id) do
    case Repo.get(Document, id) do
      nil -> {:error, :not_found}
      doc -> {:ok, doc}
    end
  end

  @doc """
  Get a document by ID with permission check.
  """
  def get_document(id, user_id) do
    case get_document(id) do
      {:ok, doc} ->
        if can_access?(doc, user_id) do
          {:ok, doc}
        else
          {:error, :forbidden}
        end

      error ->
        error
    end
  end

  @doc """
  List documents accessible to a user.
  """
  def list_documents(user_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)

    from(d in Document,
      where: d.owner_id == ^user_id or ^user_id in d.collaborator_ids,
      order_by: [desc: d.updated_at],
      limit: ^limit,
      offset: ^offset
    )
    |> Repo.all()
  end

  # ---------------------------------------------------------------------------
  # Real-time Collaboration
  # ---------------------------------------------------------------------------

  @doc """
  Apply a Yjs update to a document.

  The update is broadcast to all connected clients and persisted to DB.
  """
  def apply_update(document_id, update, user_id) when is_binary(update) do
    DocumentServer.apply_update(document_id, update, user_id)
  end

  @doc """
  Get the full Yjs state for a document (for initial sync).
  """
  def get_state(document_id) do
    DocumentServer.get_state(document_id)
  end

  @doc """
  Get the current awareness/presence state for a document.
  """
  def get_awareness(document_id) do
    DocumentServer.get_awareness(document_id)
  end

  @doc """
  Update awareness (cursor position, selection, user info).
  """
  def update_awareness(document_id, user_id, awareness_data) do
    DocumentServer.update_awareness(document_id, user_id, awareness_data)
  end

  # ---------------------------------------------------------------------------
  # Permissions
  # ---------------------------------------------------------------------------

  defp can_access?(document, user_id) do
    document.owner_id == user_id or
      user_id in (document.collaborator_ids || []) or
      document.visibility == :public
  end

  @doc """
  Add a collaborator to a document.
  """
  def add_collaborator(document_id, owner_id, collaborator_id) do
    case get_document(document_id) do
      {:ok, doc} when doc.owner_id == owner_id ->
        collaborators = Enum.uniq([collaborator_id | doc.collaborator_ids || []])
        doc
        |> Document.changeset(%{collaborator_ids: collaborators})
        |> Repo.update()

      {:ok, _} ->
        {:error, :forbidden}

      error ->
        error
    end
  end

  @doc """
  Remove a collaborator from a document.
  """
  def remove_collaborator(document_id, owner_id, collaborator_id) do
    case get_document(document_id) do
      {:ok, doc} when doc.owner_id == owner_id ->
        collaborators = List.delete(doc.collaborator_ids || [], collaborator_id)
        doc
        |> Document.changeset(%{collaborator_ids: collaborators})
        |> Repo.update()

      {:ok, _} ->
        {:error, :forbidden}

      error ->
        error
    end
  end
end
