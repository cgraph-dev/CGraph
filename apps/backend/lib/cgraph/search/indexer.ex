defmodule CGraph.Search.Indexer do
  @moduledoc """
  Background indexer for keeping search index synchronized.

  Uses Oban for reliable, distributed job processing.

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                      SEARCH INDEXER                             │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   Database Event ──► Trigger ──► Oban Job ──► Meilisearch       │
  │                                                                 │
  │   INSERT user    ──► index_document(:users, user)               │
  │   UPDATE post    ──► index_document(:posts, post)               │
  │   DELETE message ──► delete_document(:messages, id)             │
  │                                                                  │
  │   Batch Reindex  ──► reindex_all(:users, batch_size: 1000)      │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```

  ## Usage

  Documents are indexed automatically via Ecto callbacks or explicitly:

      # Index single document (async via Oban)
      Indexer.index_async(:users, user)

      # Batch reindex (for migrations)
      Indexer.reindex_all(:posts)

      # Sync index (for tests)
      Indexer.index_sync(:users, user)
  """

  alias CGraph.Search.Engine
  alias CGraph.Workers.SearchIndexWorker

  require Logger
  import CGraph.Query.SoftDelete

  # ---------------------------------------------------------------------------
  # Async Operations (via Oban)
  # ---------------------------------------------------------------------------

  @doc """
  Queue a document for indexing.
  Returns immediately, indexing happens in background.
  """
  def index_async(index_name, document) do
    %{
      "operation" => "index",
      "index" => to_string(index_name),
      "document" => prepare_document(index_name, document)
    }
    |> SearchIndexWorker.new()
    |> Oban.insert()
  end

  @doc """
  Queue multiple documents for bulk indexing.
  """
  def bulk_index_async(index_name, documents) do
    prepared = Enum.map(documents, &prepare_document(index_name, &1))

    %{
      "operation" => "bulk_index",
      "index" => to_string(index_name),
      "documents" => prepared
    }
    |> SearchIndexWorker.new()
    |> Oban.insert()
  end

  @doc """
  Queue a document for deletion.
  """
  def delete_async(index_name, document_id) do
    %{
      "operation" => "delete",
      "index" => to_string(index_name),
      "document_id" => to_string(document_id)
    }
    |> SearchIndexWorker.new()
    |> Oban.insert()
  end

  # ---------------------------------------------------------------------------
  # Sync Operations (for tests and immediate needs)
  # ---------------------------------------------------------------------------

  @doc """
  Index a document synchronously.
  """
  def index_sync(index_name, document) do
    prepared = prepare_document(index_name, document)
    Engine.index(index_name, prepared)
  end

  @doc """
  Delete a document synchronously.
  """
  def delete_sync(index_name, document_id) do
    Engine.delete(index_name, document_id)
  end

  # ---------------------------------------------------------------------------
  # Full Reindex Operations
  # ---------------------------------------------------------------------------

  @doc """
  Reindex all documents of a given type.
  Processes in batches to avoid memory issues.

  ## Options

  - `:batch_size` - Documents per batch (default: 1000)
  - `:delay_ms` - Delay between batches (default: 100)
  """
  def reindex_all(index_name, opts \\ []) do
    batch_size = Keyword.get(opts, :batch_size, 1000)

    Logger.info("starting_full_reindex_of", index_name: index_name)

    case index_name do
      :users -> reindex_users(batch_size)
      :posts -> reindex_posts(batch_size)
      :groups -> reindex_groups(batch_size)
      :messages -> reindex_messages(batch_size)
      _ -> {:error, :unknown_index}
    end
  end

  defp reindex_users(batch_size) do
    import Ecto.Query

    CGraph.Repo.transaction(fn ->
      CGraph.Accounts.User
      |> where([u], not_deleted(u))
      |> CGraph.Repo.stream(max_rows: batch_size)
      |> Stream.chunk_every(batch_size)
      |> Stream.each(fn batch ->
        documents = Enum.map(batch, &prepare_document(:users, &1))
        Engine.bulk_index(:users, documents)
        Process.sleep(100)
      end)
      |> Stream.run()
    end)

    Logger.info("Completed reindex of users")
    :ok
  end

  defp reindex_posts(batch_size) do
    import Ecto.Query

    CGraph.Repo.transaction(fn ->
      CGraph.Forums.Post
      |> CGraph.Repo.stream(max_rows: batch_size)
      |> Stream.chunk_every(batch_size)
      |> Stream.each(fn batch ->
        batch = CGraph.Repo.preload(batch, :user)
        documents = Enum.map(batch, &prepare_document(:posts, &1))
        Engine.bulk_index(:posts, documents)
        Process.sleep(100)
      end)
      |> Stream.run()
    end)

    Logger.info("Completed reindex of posts")
    :ok
  end

  defp reindex_groups(batch_size) do
    import Ecto.Query

    CGraph.Repo.transaction(fn ->
      CGraph.Groups.Group
      |> where([g], g.is_public == true)
      |> CGraph.Repo.stream(max_rows: batch_size)
      |> Stream.chunk_every(batch_size)
      |> Stream.each(fn batch ->
        documents = Enum.map(batch, &prepare_document(:groups, &1))
        Engine.bulk_index(:groups, documents)
        Process.sleep(100)
      end)
      |> Stream.run()
    end)

    Logger.info("Completed reindex of groups")
    :ok
  end

  defp reindex_messages(batch_size) do
    import Ecto.Query

    # Messages require careful handling due to E2EE
    # Only index metadata, not content
    CGraph.Repo.transaction(fn ->
      CGraph.Messaging.Message
      |> where([m], not_deleted(m))
      |> CGraph.Repo.stream(max_rows: batch_size)
      |> Stream.chunk_every(batch_size)
      |> Stream.each(fn batch ->
        # Only index non-encrypted messages
        non_encrypted = Enum.reject(batch, & &1.encrypted)
        documents = Enum.map(non_encrypted, &prepare_document(:messages, &1))
        Engine.bulk_index(:messages, documents)
        Process.sleep(100)
      end)
      |> Stream.run()
    end)

    Logger.info("Completed reindex of messages")
    :ok
  end

  # ---------------------------------------------------------------------------
  # Document Preparation
  # ---------------------------------------------------------------------------

  @doc """
  Prepare a document for indexing.
  Extracts and normalizes relevant fields for search.
  """
  def prepare_document(:users, user) do
    %{
      "id" => to_string(user.id),
      "username" => user.username,
      "display_name" => user.display_name,
      "bio" => user.bio,
      "is_verified" => user.is_verified || false,
      "user_id" => user.user_id,
      "created_at" => format_datetime(user.inserted_at)
    }
  end

  def prepare_document(:posts, post) do
    %{
      "id" => to_string(post.id),
      "title" => post.title,
      "content" => truncate_content(post.content, 5000),
      "forum_id" => to_string(post.forum_id),
      "author_id" => to_string(post.user_id),
      "author_username" => get_author_username(post),
      "score" => post.score || 0,
      "comment_count" => post.comment_count || 0,
      "created_at" => format_datetime(post.inserted_at)
    }
  end

  def prepare_document(:groups, group) do
    %{
      "id" => to_string(group.id),
      "name" => group.name,
      "description" => group.description,
      "is_public" => group.is_public,
      "member_count" => group.member_count || 0,
      "created_at" => format_datetime(group.inserted_at)
    }
  end

  def prepare_document(:messages, message) do
    # Only index non-encrypted message metadata
    if message.encrypted do
      %{
        "id" => to_string(message.id),
        "conversation_id" => to_string(message.conversation_id),
        "sender_id" => to_string(message.user_id),
        "created_at" => format_datetime(message.inserted_at),
        "content" => ""  # Don't index encrypted content
      }
    else
      %{
        "id" => to_string(message.id),
        "content" => truncate_content(message.content, 2000),
        "conversation_id" => to_string(message.conversation_id),
        "sender_id" => to_string(message.user_id),
        "created_at" => format_datetime(message.inserted_at)
      }
    end
  end

  def prepare_document(_index, doc), do: doc

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp get_author_username(%{user: %{username: username}}), do: username
  defp get_author_username(_), do: nil

  defp format_datetime(nil), do: nil
  defp format_datetime(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp format_datetime(%NaiveDateTime{} = dt), do: NaiveDateTime.to_iso8601(dt)

  defp truncate_content(nil, _max), do: ""
  defp truncate_content(content, max) when byte_size(content) <= max, do: content
  defp truncate_content(content, max), do: String.slice(content, 0, max)
end
