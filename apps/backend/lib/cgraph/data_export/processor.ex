defmodule CGraph.DataExport.Processor do
  @moduledoc """
  Export execution logic for data export operations.

  Handles the actual processing of user data exports and query exports,
  including data collection from configured sources, file generation,
  and finalization with delivery and audit logging.
  """

  require Logger

  alias CGraph.Repo
  alias CGraph.DataExport.{Delivery, Formatter, Storage}

  @export_table :cgraph_exports

  @user_data_sources %{
    profile: {CGraph.Users.User, :export_profile},
    settings: {CGraph.Users.UserSettings, :export_settings},
    activity: {CGraph.Audit, :export_user_activity},
    messages: {CGraph.Messages, :export_user_messages},
    connections: {CGraph.Connections, :export_user_connections},
    notifications: {CGraph.Notifications, :export_user_notifications},
    notification_preferences: {CGraph.Notifications.Preferences, :export_for_user},
    push_tokens: {CGraph.Notifications.PushTokens, :export_for_user},
    cosmetics_inventory: {CGraph.Cosmetics, :export_user_inventory},
    nodes_transactions: {CGraph.Nodes, :export_user_transactions},
    paid_dm_files: {CGraph.PaidDm, :export_user_files},
    boost_history: {CGraph.Boosts, :export_user_boosts},
    creator_earnings: {CGraph.Creators.Earnings, :export_user_earnings}
  }

  # ---------------------------------------------------------------------------
  # Export Execution
  # ---------------------------------------------------------------------------

  @doc false
  @spec do_export_user_data(String.t(), keyword()) ::
          {:ok, CGraph.DataExport.export()} | {:error, term()}
  def do_export_user_data(user_id, opts) do
    export_id = generate_export_id()
    format = Keyword.get(opts, :format, :json)
    delivery = Keyword.get(opts, :delivery, :download)
    include = Keyword.get(opts, :include, Map.keys(@user_data_sources))
    exclude = Keyword.get(opts, :exclude, [])

    data_sources = include -- exclude

    export = %{
      id: export_id,
      user_id: user_id,
      type: :user_data,
      format: format,
      status: :processing,
      filename: "user_data_#{user_id}_#{timestamp()}",
      file_size: nil,
      download_count: 0,
      created_at: DateTime.utc_now(),
      completed_at: nil,
      expires_at: nil,
      download_token: nil,
      storage_path: nil,
      error: nil
    }

    :ets.insert(@export_table, {export_id, export})
    Delivery.log_export_started(export)

    Task.start(fn ->
      process_user_export(export, data_sources, opts, delivery)
    end)

    {:ok, export}
  end

  @doc false
  @spec do_export_query(Ecto.Query.t(), keyword()) ::
          {:ok, CGraph.DataExport.export()} | {:error, term()}
  def do_export_query(query, opts) do
    export_id = generate_export_id()
    format = Keyword.get(opts, :format, :json)
    filename = Keyword.get(opts, :filename, "query_export_#{timestamp()}")

    export = %{
      id: export_id,
      user_id: nil,
      type: :query,
      format: format,
      status: :processing,
      filename: filename,
      file_size: nil,
      download_count: 0,
      created_at: DateTime.utc_now(),
      completed_at: nil,
      expires_at: nil,
      download_token: nil,
      storage_path: nil,
      error: nil
    }

    :ets.insert(@export_table, {export_id, export})

    Task.start(fn ->
      process_query_export(export, query, opts)
    end)

    {:ok, export}
  end

  # ---------------------------------------------------------------------------
  # Private - Processing
  # ---------------------------------------------------------------------------

  defp process_user_export(export, data_sources, opts, delivery) do
    data =
      Enum.reduce(data_sources, %{}, fn source, acc ->
        case collect_source_data(source, export.user_id) do
          {:ok, source_data} -> Map.put(acc, source, source_data)
          {:error, _} -> acc
        end
      end)

    export_data = %{
      export_id: export.id,
      user_id: export.user_id,
      exported_at: DateTime.utc_now(),
      format_version: "1.0",
      data: data
    }

    {file_path, file_size} = Storage.write_export_file(export, export_data, opts)

    finalize_export(export, file_path, file_size, delivery, opts)
  rescue
    e ->
      Logger.error("data_export_failed", export_id: export.id, error: inspect(e))
      mark_export_failed(export, Exception.message(e))
  end

  defp process_query_export(export, query, opts) do
    columns = Keyword.get(opts, :columns)
    chunk_size = Keyword.get(opts, :chunk_size, Storage.get_config(:chunk_size))

    file_path = Storage.export_file_path(export)
    file = File.open!(file_path, [:write, :utf8])

    if export.format == :csv and columns do
      header = Enum.join(columns, ",") <> "\n"
      IO.write(file, header)
    end

    total_size =
      query
      |> Repo.stream(max_rows: chunk_size)
      |> Enum.reduce(0, fn record, size ->
        line = Formatter.format_record(record, export.format, columns)
        IO.write(file, line)
        size + byte_size(line)
      end)

    File.close(file)

    finalize_export(export, file_path, total_size, :download, opts)
  rescue
    e ->
      Logger.error("data_export_query_failed", export_id: export.id, error: inspect(e))
      mark_export_failed(export, Exception.message(e))
  end

  defp collect_source_data(source, user_id) do
    case Map.get(@user_data_sources, source) do
      {module, function} ->
        if Code.ensure_loaded?(module) and function_exported?(module, function, 1) do
          apply(module, function, [user_id])
        else
          {:ok, []}
        end

      nil ->
        {:error, :unknown_source}
    end
  end

  defp finalize_export(export, file_path, file_size, delivery, opts) do
    token = Delivery.generate_download_token()
    expiry = Storage.get_config(:link_expiry)

    updated = %{
      export
      | status: :completed,
        file_size: file_size,
        storage_path: file_path,
        download_token: token,
        completed_at: DateTime.utc_now(),
        expires_at: DateTime.add(DateTime.utc_now(), expiry, :millisecond)
    }

    :ets.insert(@export_table, {export.id, updated})

    notify_email = Keyword.get(opts, :notify_email)
    webhook_url = Keyword.get(opts, :webhook_url)

    case delivery do
      :s3 ->
        Storage.upload_to_s3(updated)

      :email when is_binary(notify_email) ->
        Delivery.send_export_notification(updated, notify_email)

      :webhook when is_binary(webhook_url) ->
        Delivery.deliver_webhook(updated, webhook_url)

      _ ->
        :ok
    end

    Delivery.log_export_completed(updated)
  end

  defp mark_export_failed(export, error) do
    updated = %{
      export
      | status: :failed,
        error: error,
        completed_at: DateTime.utc_now()
    }

    :ets.insert(@export_table, {export.id, updated})
    Delivery.log_export_failed(updated)
  end

  # ---------------------------------------------------------------------------
  # Private - Utilities
  # ---------------------------------------------------------------------------

  defp generate_export_id do
    "exp_" <> Base.encode16(:crypto.strong_rand_bytes(12), case: :lower)
  end

  defp timestamp do
    DateTime.utc_now() |> DateTime.to_iso8601() |> String.replace(~r/[:.-]/, "_")
  end
end
