defmodule Mix.Tasks.Search.Reindex do
  @moduledoc """
  Reindex all documents in Meilisearch.

  This task populates (or refreshes) the Meilisearch indexes with data
  from the PostgreSQL database. Run this after:

  - First-time Meilisearch setup
  - Recovering from Meilisearch data loss
  - Schema changes that affect searchable fields

  ## Usage

      # Reindex everything
      mix search.reindex

      # Reindex a specific index
      mix search.reindex --index users
      mix search.reindex --index posts
      mix search.reindex --index groups
      mix search.reindex --index messages

      # Custom batch size
      mix search.reindex --batch-size 500

      # Check search health without reindexing
      mix search.reindex --health

      # View index statistics
      mix search.reindex --stats

  ## Options

    * `--index` - Specific index to reindex (users, posts, groups, messages)
    * `--batch-size` - Documents per batch (default: 1000)
    * `--health` - Only check Meilisearch health
    * `--stats` - Only show index statistics
    * `--setup` - Only set up indexes (create/update settings)
  """

  use Mix.Task

  @shortdoc "Reindex documents in Meilisearch"

  @valid_indexes ~w(users posts groups messages)

  @impl Mix.Task
  def run(args) do
    {opts, _, _} = OptionParser.parse(args,
      strict: [
        index: :string,
        batch_size: :integer,
        health: :boolean,
        stats: :boolean,
        setup: :boolean
      ],
      aliases: [i: :index, b: :batch_size, h: :health, s: :stats]
    )

    # Start the application
    Mix.Task.run("app.start")

    cond do
      opts[:health] -> health_check()
      opts[:stats] -> show_stats()
      opts[:setup] -> setup_indexes()
      true -> reindex(opts)
    end
  end

  defp health_check do
    IO.puts("\n=== Meilisearch Health Check ===\n")

    backend = CGraph.Search.Engine.get_backend()
    IO.puts("  Backend: #{backend}")

    config = Application.get_env(:cgraph, CGraph.Search.Engine, [])
    url = Keyword.get(config, :meilisearch_url, "http://localhost:7700")
    IO.puts("  URL: #{url}")

    if backend == :meilisearch do
      case CGraph.Search.Engine.healthy?() do
        true -> IO.puts("  Status: ✓ Healthy\n")
        false -> IO.puts("  Status: ✗ Unreachable\n")
      end
    else
      IO.puts("  Status: PostgreSQL fallback (MEILISEARCH_URL not set)\n")
    end
  end

  defp show_stats do
    IO.puts("\n=== Meilisearch Statistics ===\n")

    case CGraph.Search.Engine.stats() do
      {:ok, stats} ->
        IO.puts("  #{inspect(stats, pretty: true)}\n")

      {:error, reason} ->
        IO.puts("  Error: #{inspect(reason)}\n")
    end
  end

  defp setup_indexes do
    IO.puts("\n=== Setting Up Meilisearch Indexes ===\n")

    case CGraph.Search.Engine.get_backend() do
      :meilisearch ->
        CGraph.Search.Engine.setup_indexes()
        IO.puts("  ✓ Indexes configured successfully\n")

      :postgres ->
        IO.puts("  Skipped — backend is PostgreSQL (set MEILISEARCH_URL to enable)\n")
    end
  end

  defp reindex(opts) do
    batch_size = Keyword.get(opts, :batch_size, 1000)

    backend = CGraph.Search.Engine.get_backend()
    if backend != :meilisearch do
      IO.puts("\n  Warning: Backend is :#{backend} (set MEILISEARCH_URL to enable Meilisearch)")
      IO.puts("  Reindex will send documents but they won't reach a search engine.\n")
    end

    # Set up indexes first
    IO.puts("\n=== Setting up indexes ===\n")
    CGraph.Search.Engine.setup_indexes()
    IO.puts("  ✓ Index settings configured\n")

    case opts[:index] do
      nil ->
        IO.puts("=== Reindexing ALL indexes ===\n")
        reindex_index(:users, batch_size)
        reindex_index(:posts, batch_size)
        reindex_index(:groups, batch_size)
        reindex_index(:messages, batch_size)

      index when index in @valid_indexes ->
        IO.puts("=== Reindexing #{index} ===\n")
        reindex_index(String.to_existing_atom(index), batch_size)

      other ->
        IO.puts("  Error: Unknown index '#{other}'. Valid: #{Enum.join(@valid_indexes, ", ")}\n")
    end

    IO.puts("\n=== Reindex complete ===\n")
  end

  defp reindex_index(index, batch_size) do
    IO.puts("  Reindexing :#{index} (batch_size: #{batch_size})...")
    start = System.monotonic_time(:millisecond)

    case CGraph.Search.Indexer.reindex_all(index, batch_size: batch_size) do
      :ok ->
        duration = System.monotonic_time(:millisecond) - start
        IO.puts("  ✓ :#{index} reindexed in #{duration}ms\n")

      {:error, reason} ->
        IO.puts("  ✗ :#{index} failed: #{inspect(reason)}\n")
    end
  end
end
