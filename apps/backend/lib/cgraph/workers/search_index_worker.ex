defmodule CGraph.Workers.SearchIndexWorker do
  @moduledoc """
  Oban worker for asynchronous search indexing.

  Handles index, bulk_index, and delete operations with retry logic.
  """

  use Oban.Worker,
    queue: :search,
    max_attempts: 3,
    priority: 2

  alias CGraph.Search.Engine

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"operation" => "index", "index" => index, "document" => doc}}) do
    index_atom = String.to_existing_atom(index)

    case Engine.index(index_atom, doc) do
      :ok -> :ok
      {:ok, :postgres_is_source_of_truth} -> :ok
      {:error, reason} ->
        Logger.warning("Search index failed for #{index}: #{inspect(reason)}")
        {:error, reason}
    end
  end

  def perform(%Oban.Job{args: %{"operation" => "bulk_index", "index" => index, "documents" => docs}}) do
    index_atom = String.to_existing_atom(index)

    case Engine.bulk_index(index_atom, docs) do
      :ok -> :ok
      {:ok, :postgres_is_source_of_truth} -> :ok
      {:error, reason} ->
        Logger.warning("Search bulk index failed for #{index}: #{inspect(reason)}")
        {:error, reason}
    end
  end

  def perform(%Oban.Job{args: %{"operation" => "delete", "index" => index, "document_id" => id}}) do
    index_atom = String.to_existing_atom(index)

    case Engine.delete(index_atom, id) do
      :ok -> :ok
      {:ok, :postgres_is_source_of_truth} -> :ok
      {:error, reason} ->
        Logger.warning("Search delete failed for #{index}/#{id}: #{inspect(reason)}")
        {:error, reason}
    end
  end

  def perform(%Oban.Job{args: args}) do
    Logger.warning("Unknown search index operation: #{inspect(args)}")
    :ok
  end
end
