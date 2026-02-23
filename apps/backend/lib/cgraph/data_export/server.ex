defmodule CGraph.DataExport.Server do
  @moduledoc """
  GenServer process for managing data export lifecycle.

  Handles export request dispatch, ETS-backed export tracking,
  streaming exports, cleanup of expired exports, and export statistics.
  """

  use GenServer
  require Logger

  import Ecto.Query
  alias CGraph.Repo
  alias CGraph.DataExport.{Delivery, Formatter, Processor, Storage}

  @export_table :cgraph_exports

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc """
  Start the DataExport GenServer.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: CGraph.DataExport)
  end

  @doc """
  Export all user data for GDPR compliance (Article 20 - Right to Data Portability).

  See `CGraph.DataExport.export_user_data/2` for full documentation.
  """
  @spec export_user_data(String.t(), CGraph.DataExport.export_options()) ::
          {:ok, CGraph.DataExport.export()} | {:error, term()}
  def export_user_data(user_id, opts \\ []) do
    GenServer.call(CGraph.DataExport, {:export_user_data, user_id, opts}, 60_000)
  end

  @doc """
  Export data from a custom Ecto query.

  See `CGraph.DataExport.export_query/2` for full documentation.
  """
  @spec export_query(Ecto.Query.t(), CGraph.DataExport.export_options()) ::
          {:ok, CGraph.DataExport.export()} | {:error, term()}
  def export_query(query, opts \\ []) do
    GenServer.call(CGraph.DataExport, {:export_query, query, opts}, 60_000)
  end

  @doc """
  Stream export data for memory-efficient processing.

  Returns a Stream that yields formatted data chunks. Uses cursor-based
  streaming to avoid O(n) offset degradation on large datasets.

  ## Examples

      query = from u in User, select: %{id: u.id, email: u.email}

      CGraph.DataExport.stream_export(query, format: :ndjson)
      |> Stream.into(File.stream!("export.ndjson"))
      |> Stream.run()
  """
  @spec stream_export(Ecto.Query.t(), keyword()) :: Enumerable.t()
  def stream_export(query, opts \\ []) do
    format = Keyword.get(opts, :format, :ndjson)
    chunk_size = Keyword.get(opts, :chunk_size, Storage.get_config(:chunk_size))

    Stream.resource(
      fn -> {query, nil, true} end,
      fn
        :done ->
          {:halt, :done}

        {q, last_id, is_first} ->
          chunk_query =
            if last_id do
              from r in q, where: r.id > ^last_id, order_by: [asc: r.id], limit: ^chunk_size
            else
              from r in q, order_by: [asc: r.id], limit: ^chunk_size
            end

          chunk = Repo.all(chunk_query)

          if chunk == [] do
            {:halt, :done}
          else
            new_last_id = List.last(chunk) |> Map.get(:id)
            formatted = Formatter.format_chunk(chunk, format, is_first)
            {[formatted], {q, new_last_id, false}}
          end
      end,
      fn _ -> :ok end
    )
    |> Stream.flat_map(&List.wrap/1)
  end

  @doc """
  Get an export by ID.
  """
  @spec get_export(CGraph.DataExport.export_id()) ::
          {:ok, CGraph.DataExport.export()} | {:error, :not_found}
  def get_export(export_id) do
    case :ets.lookup(@export_table, export_id) do
      [{^export_id, export}] -> {:ok, export}
      [] -> {:error, :not_found}
    end
  end

  @doc """
  Get all exports for a user.
  """
  @spec list_user_exports(String.t()) :: [CGraph.DataExport.export()]
  def list_user_exports(user_id) do
    :ets.tab2list(@export_table)
    |> Enum.filter(fn {_id, export} -> export.user_id == user_id end)
    |> Enum.map(fn {_id, export} -> export end)
    |> Enum.sort_by(& &1.created_at, {:desc, DateTime})
  end

  @doc """
  Delete an export and its associated file.
  """
  @spec delete_export(CGraph.DataExport.export_id()) :: :ok | {:error, term()}
  def delete_export(export_id) do
    case get_export(export_id) do
      {:ok, export} ->
        Storage.delete_export_file(export)
        :ets.delete(@export_table, export_id)
        Delivery.log_export_deleted(export)
        :ok

      error ->
        error
    end
  end

  @doc """
  Cancel a pending or processing export.
  """
  @spec cancel_export(CGraph.DataExport.export_id()) :: :ok | {:error, term()}
  def cancel_export(export_id) do
    GenServer.call(CGraph.DataExport, {:cancel_export, export_id}, 10_000)
  end

  @doc """
  Get export statistics.
  """
  @spec get_stats() :: map()
  def get_stats do
    exports = :ets.tab2list(@export_table) |> Enum.map(fn {_id, e} -> e end)

    %{
      total_exports: length(exports),
      by_status: Enum.frequencies_by(exports, & &1.status),
      by_format: Enum.frequencies_by(exports, & &1.format),
      total_size_bytes: Enum.reduce(exports, 0, fn e, acc -> acc + (e.file_size || 0) end),
      total_downloads: Enum.reduce(exports, 0, fn e, acc -> acc + e.download_count end)
    }
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @impl true
  @doc "Initializes the process state."
  @spec init(keyword()) :: {:ok, map()}
  def init(_opts) do
    :ets.new(@export_table, [:named_table, :set, :public, read_concurrency: true])

    Storage.ensure_storage_dir()
    schedule_cleanup()

    state = %{
      active_exports: %{},
      config: Storage.load_config()
    }

    {:ok, state}
  end

  @impl true
  @doc "Handles synchronous call messages."
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  def handle_call({:export_user_data, user_id, opts}, _from, state) do
    result = Processor.do_export_user_data(user_id, opts)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:export_query, query, opts}, _from, state) do
    result = Processor.do_export_query(query, opts)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:cancel_export, export_id}, _from, state) do
    case get_export(export_id) do
      {:ok, export} when export.status in [:pending, :processing] ->
        updated = %{export | status: :failed, error: "Cancelled by user"}
        :ets.insert(@export_table, {export_id, updated})
        {:reply, :ok, state}

      {:ok, _} ->
        {:reply, {:error, :cannot_cancel}, state}

      error ->
        {:reply, error, state}
    end
  end

  @impl true
  @doc "Handles generic messages."
  @spec handle_info(term(), map()) :: {:noreply, map()}
  def handle_info(:cleanup, state) do
    cleanup_expired_exports()
    schedule_cleanup()
    {:noreply, state}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Private - Cleanup
  # ---------------------------------------------------------------------------

  defp schedule_cleanup do
    Process.send_after(self(), :cleanup, :timer.hours(1))
  end

  defp cleanup_expired_exports do
    retention_days = Storage.get_config(:retention_days)
    cutoff = DateTime.add(DateTime.utc_now(), -retention_days * 24 * 60 * 60, :second)

    expired =
      :ets.tab2list(@export_table)
      |> Enum.filter(fn {_id, export} ->
        export.status in [:completed, :failed, :expired] and
          DateTime.compare(export.created_at, cutoff) == :lt
      end)

    Enum.each(expired, fn {id, export} ->
      Storage.delete_export_file(export)
      :ets.delete(@export_table, id)
    end)

    unless Enum.empty?(expired) do
      Logger.info("data_export_cleanup", expired_count: length(expired))
    end
  end
end
