defmodule CGraph.Archival do
  @moduledoc """
  Archival context — moves old data from live tables to archive tables.

  ## Functions

  - `archive_by_policy/1`  — Run a single `ArchivePolicy`, batch-moving rows
  - `restore/2`            — Restore rows from an archive table back to the live table
  - `list_archives/1`      — List archived rows (paginated)
  - `archive_old_messages/1` — Convenience: archive messages older than N days
  - `archive_inactive_threads/1` — Convenience: archive threads older than N days

  ## Design

  All archival operations use raw SQL via `Ecto.Adapters.SQL.query/3` because
  archive tables are structurally identical to the source tables but don't have
  Ecto schemas. This keeps the system decoupled from schema changes.

  Batch operations use `INSERT INTO ... SELECT ... LIMIT` + `DELETE` inside
  a transaction to guarantee atomicity per batch.
  """

  require Logger

  alias CGraph.Archival.ArchivePolicy
  alias CGraph.Repo

  # ── Public API ────────────────────────────────────────────────────────────

  @doc """
  Execute a single archive policy, moving qualifying rows in batches.

  Returns `{:ok, total_archived}` or `{:error, reason}`.
  """
  @spec archive_by_policy(ArchivePolicy.t()) :: {:ok, non_neg_integer()} | {:error, term()}
  def archive_by_policy(%ArchivePolicy{enabled: false}), do: {:ok, 0}

  def archive_by_policy(%ArchivePolicy{} = policy) do
    cutoff = ArchivePolicy.cutoff(policy)

    Logger.info("[Archival] Starting policy=#{policy.name} cutoff=#{DateTime.to_iso8601(cutoff)}")

    count = count_archivable(policy, cutoff)

    if count == 0 do
      Logger.info("[Archival] No rows to archive for policy=#{policy.name}")
      {:ok, 0}
    else
      Logger.info("[Archival] Found #{count} rows to archive for policy=#{policy.name}")
      do_archive_batches(policy, cutoff, count)
    end
  rescue
    e ->
      Logger.error("[Archival] Policy=#{policy.name} failed: #{inspect(e)}")
      {:error, e}
  end

  @doc """
  Restore archived rows back to the live table.

  `ids` must be a list of binary UUIDs present in the archive table.
  """
  @spec restore(ArchivePolicy.t() | String.t(), [String.t()]) ::
          {:ok, non_neg_integer()} | {:error, term()}
  def restore(%ArchivePolicy{} = policy, ids) do
    restore(policy.archive_table, policy.target_table, ids)
  end

  def restore(archive_table, target_table, ids) when is_binary(archive_table) and is_list(ids) do
    if ids == [] do
      {:ok, 0}
    else
      placeholders = Enum.map_join(1..length(ids), ", ", fn i -> "$#{i}" end)

      Repo.transaction(fn ->
        # Copy rows back to live table
        insert_sql = """
        INSERT INTO #{target_table}
        SELECT * FROM #{archive_table}
        WHERE id IN (#{placeholders})
        ON CONFLICT (id) DO NOTHING
        """

        case Ecto.Adapters.SQL.query(Repo, insert_sql, ids) do
          {:ok, %{num_rows: inserted}} ->
            # Remove from archive
            delete_sql = "DELETE FROM #{archive_table} WHERE id IN (#{placeholders})"
            Ecto.Adapters.SQL.query!(Repo, delete_sql, ids)

            Logger.info("[Archival] Restored #{inserted} rows from #{archive_table} → #{target_table}")
            inserted

          {:error, reason} ->
            Repo.rollback(reason)
        end
      end)
    end
  end

  @doc """
  List archived rows from an archive table with pagination.

  Returns `{:ok, rows}` where each row is a map.
  """
  @spec list_archives(String.t(), keyword()) :: {:ok, [map()]} | {:error, term()}
  def list_archives(archive_table, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)
    order_by = Keyword.get(opts, :order_by, "inserted_at DESC")

    sql = """
    SELECT * FROM #{archive_table}
    ORDER BY #{order_by}
    LIMIT $1 OFFSET $2
    """

    case Ecto.Adapters.SQL.query(Repo, sql, [limit, offset]) do
      {:ok, %{columns: columns, rows: rows}} ->
        maps = Enum.map(rows, fn row -> Enum.zip(columns, row) |> Map.new() end)
        {:ok, maps}

      {:error, reason} ->
        {:error, reason}
    end
  end

  # ── Convenience wrappers ──────────────────────────────────────────────────

  @doc """
  Archive messages older than `days` (default 365).
  """
  @spec archive_old_messages(pos_integer()) :: {:ok, non_neg_integer()} | {:error, term()}
  def archive_old_messages(days \\ 365) do
    policy = %ArchivePolicy{
      name: :old_messages,
      days_threshold: days,
      target_table: "messages",
      archive_table: "archive_messages",
      batch_size: 1000
    }

    archive_by_policy(policy)
  end

  @doc """
  Archive forum threads inactive for longer than `days` (default 365).
  """
  @spec archive_inactive_threads(pos_integer()) :: {:ok, non_neg_integer()} | {:error, term()}
  def archive_inactive_threads(days \\ 365) do
    policy = %ArchivePolicy{
      name: :old_forum_posts,
      days_threshold: days,
      target_table: "posts",
      archive_table: "archive_forum_posts",
      batch_size: 1000
    }

    archive_by_policy(policy)
  end

  # ── Internal batch logic ──────────────────────────────────────────────────

  defp count_archivable(policy, cutoff) do
    sql = """
    SELECT COUNT(*) FROM #{policy.target_table}
    WHERE #{policy.timestamp_column} < $1
    """

    case Ecto.Adapters.SQL.query(Repo, sql, [cutoff]) do
      {:ok, %{rows: [[count]]}} -> count
      _ -> 0
    end
  end

  defp do_archive_batches(policy, cutoff, total) do
    batches = ceil(total / policy.batch_size)

    archived =
      Enum.reduce_while(1..batches, 0, fn batch_num, acc ->
        case archive_one_batch(policy, cutoff) do
          {:ok, 0} ->
            {:halt, acc}

          {:ok, count} ->
            new_total = acc + count

            Logger.info(
              "[Archival] policy=#{policy.name} batch=#{batch_num}/#{batches} moved=#{count} total=#{new_total}"
            )

            :telemetry.execute(
              [:cgraph, :archival, :batch],
              %{count: count, batch: batch_num},
              %{policy: policy.name}
            )

            if count < policy.batch_size, do: {:halt, new_total}, else: {:cont, new_total}

          {:error, reason} ->
            Logger.error("[Archival] policy=#{policy.name} batch=#{batch_num} error=#{inspect(reason)}")
            {:halt, acc}
        end
      end)

    :telemetry.execute(
      [:cgraph, :archival, :complete],
      %{total_archived: archived},
      %{policy: policy.name}
    )

    {:ok, archived}
  end

  defp archive_one_batch(policy, cutoff) do
    Repo.transaction(fn ->
      # Step 1: Select IDs to archive
      select_sql = """
      SELECT id FROM #{policy.target_table}
      WHERE #{policy.timestamp_column} < $1
      ORDER BY #{policy.timestamp_column} ASC
      LIMIT $2
      """

      case Ecto.Adapters.SQL.query(Repo, select_sql, [cutoff, policy.batch_size]) do
        {:ok, %{rows: []}} ->
          0

        {:ok, %{rows: id_rows}} ->
          ids = Enum.map(id_rows, fn [id] -> id end)
          placeholders = Enum.map_join(1..length(ids), ", ", fn i -> "$#{i}" end)

          # Step 2: Copy to archive table
          insert_sql = """
          INSERT INTO #{policy.archive_table}
          SELECT * FROM #{policy.target_table}
          WHERE id IN (#{placeholders})
          ON CONFLICT (id) DO NOTHING
          """

          Ecto.Adapters.SQL.query!(Repo, insert_sql, ids)

          # Step 3: Delete from source table
          delete_sql = "DELETE FROM #{policy.target_table} WHERE id IN (#{placeholders})"

          case Ecto.Adapters.SQL.query(Repo, delete_sql, ids) do
            {:ok, %{num_rows: deleted}} -> deleted
            {:error, reason} -> Repo.rollback(reason)
          end

        {:error, reason} ->
          Repo.rollback(reason)
      end
    end)
  end
end
