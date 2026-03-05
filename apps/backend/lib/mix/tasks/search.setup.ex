defmodule Mix.Tasks.Search.Setup do
  @moduledoc """
  Initialize MeiliSearch indexes and run a full reindex.

  This is a convenience task for first-time deployment or disaster recovery.
  It combines index setup with a full reindex in one command.

  ## Usage

      # Full setup: create indexes + reindex all documents
      mix search.setup

      # Dry run: show what would happen without making changes
      mix search.setup --dry-run

  ## Deployment Checklist

  1. Set MeiliSearch secrets on Fly.io:

         fly secrets set MEILISEARCH_URL=https://your-meilisearch.example.com
         fly secrets set MEILISEARCH_API_KEY=your_production_master_key

  2. Run this task from a one-off machine:

         fly ssh console -C "bin/cgraph eval 'Mix.Tasks.Search.Setup.run_setup()'"

     Or via mix on a connected console:

         mix search.setup

  3. Verify with:

         mix search.reindex --health
         mix search.reindex --stats

  ## Notes

  - If MEILISEARCH_URL is not set, search falls back to PostgreSQL ILIKE queries.
  - Index setup is also run automatically on application startup (async).
  - For incremental reindexing, use `mix search.reindex --index <name>`.
  """

  use Mix.Task

  alias CGraph.Search.{Engine, Indexer}

  @shortdoc "Initialize MeiliSearch indexes and run full reindex"

  @impl Mix.Task
  @doc "Runs the search setup task."
  @spec run(list()) :: :ok
  def run(args) do
    {opts, _, _} = OptionParser.parse(args,
      strict: [dry_run: :boolean],
      aliases: [n: :dry_run]
    )

    Mix.Task.run("app.start")

    if opts[:dry_run] do
      dry_run()
    else
      run_setup()
    end
  end

  @doc """
  Programmatic entry point for `fly ssh console` eval.

  Usage:
      fly ssh console -C "bin/cgraph eval 'Mix.Tasks.Search.Setup.run_setup()'"
  """
  @spec run_setup() :: :ok
  def run_setup do
    IO.puts("\n=== MeiliSearch Setup ===\n")

    backend = Engine.get_backend()
    IO.puts("  Backend: #{backend}")

    config = Application.get_env(:cgraph, Engine, [])
    url = Keyword.get(config, :meilisearch_url, "not configured")
    IO.puts("  URL: #{url}")

    case backend do
      :meilisearch ->
        IO.puts("\n  Step 1/3: Health check...")
        case Engine.healthy?() do
          true ->
            IO.puts("  ✓ MeiliSearch is healthy")

            IO.puts("\n  Step 2/3: Creating/updating indexes...")
            Engine.setup_indexes()
            IO.puts("  ✓ Indexes configured")

            IO.puts("\n  Step 3/3: Running full reindex...")
            for index <- [:users, :posts, :groups, :messages] do
              IO.puts("    Reindexing #{index}...")
              Indexer.reindex_all(index)
              IO.puts("    ✓ #{index} complete")
            end

            IO.puts("\n  === Setup Complete ===\n")

          false ->
            IO.puts("  ✗ MeiliSearch is unreachable at #{url}")
            IO.puts("  Check MEILISEARCH_URL and MEILISEARCH_API_KEY secrets.")
            IO.puts("  Aborting setup.\n")
        end

      :postgres ->
        IO.puts("\n  MEILISEARCH_URL not set — using PostgreSQL fallback.")
        IO.puts("  To enable MeiliSearch:")
        IO.puts("    fly secrets set MEILISEARCH_URL=https://your-meilisearch.example.com")
        IO.puts("    fly secrets set MEILISEARCH_API_KEY=your_master_key")
        IO.puts("  Then re-run: mix search.setup\n")
    end

    :ok
  end

  defp dry_run do
    IO.puts("\n=== MeiliSearch Setup (Dry Run) ===\n")

    backend = Engine.get_backend()
    IO.puts("  Backend: #{backend}")

    config = Application.get_env(:cgraph, Engine, [])
    url = Keyword.get(config, :meilisearch_url, "not configured")
    IO.puts("  URL: #{url}")

    IO.puts("\n  Would perform:")
    IO.puts("    1. Health check against #{url}")
    IO.puts("    2. Create/update indexes: users, posts, groups, messages")
    IO.puts("    3. Full reindex of all 4 indexes")
    IO.puts("\n  No changes made (dry run).\n")
  end
end
