defmodule CGraph.DataExport.Delivery do
  @moduledoc """
  Download URL generation, token verification, notification delivery,
  webhook dispatch, and audit logging for data exports.
  """

  require Logger

  @export_table :cgraph_exports

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Generate a secure download URL for a completed export.

  The URL is time-limited and includes a cryptographic token for security.

  ## Examples

      {:ok, url} = CGraph.DataExport.get_download_url(export_id)
      # => "https://example.com/exports/download/abc123?token=xyz..."
  """
  @spec get_download_url(CGraph.DataExport.export_id()) :: {:ok, String.t()} | {:error, term()}
  def get_download_url(export_id) do
    case lookup_export(export_id) do
      {:ok, export} when export.status == :completed ->
        if DateTime.compare(DateTime.utc_now(), export.expires_at) == :lt do
          url = build_download_url(export)
          {:ok, url}
        else
          {:error, :expired}
        end

      {:ok, %{status: status}} ->
        {:error, {:invalid_status, status}}

      error ->
        error
    end
  end

  @doc """
  Verify a download token and return the export.

  Used by the download controller to validate access. Increments
  the download count on successful verification.
  """
  @spec verify_download(CGraph.DataExport.export_id(), String.t()) ::
          {:ok, CGraph.DataExport.export()} | {:error, term()}
  def verify_download(export_id, token) do
    with {:ok, export} <- lookup_export(export_id),
         :ok <- verify_token(export, token),
         :ok <- check_expiry(export) do
      updated = %{export | download_count: export.download_count + 1}
      :ets.insert(@export_table, {export_id, updated})

      log_download(export)
      {:ok, updated}
    end
  end

  # ---------------------------------------------------------------------------
  # Token & Security
  # ---------------------------------------------------------------------------

  @doc false
  def generate_download_token do
    :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
  end

  defp verify_token(export, token) do
    if Plug.Crypto.secure_compare(export.download_token, token) do
      :ok
    else
      {:error, :invalid_token}
    end
  end

  defp check_expiry(export) do
    if DateTime.compare(DateTime.utc_now(), export.expires_at) == :lt do
      :ok
    else
      {:error, :expired}
    end
  end

  # ---------------------------------------------------------------------------
  # URL Building
  # ---------------------------------------------------------------------------

  @doc false
  def build_download_url(export) do
    base_url = Application.get_env(:cgraph, CGraphWeb.Endpoint)[:url][:host] || "localhost"
    scheme = Application.get_env(:cgraph, CGraphWeb.Endpoint)[:url][:scheme] || "http"

    "#{scheme}://#{base_url}/api/exports/#{export.id}/download?token=#{export.download_token}"
  end

  # ---------------------------------------------------------------------------
  # Notifications & Webhooks
  # ---------------------------------------------------------------------------

  @doc false
  def send_export_notification(export, email) do
    Logger.info("data_export_sending_notification", email: email, export_id: export.id)
    :ok
  end

  @doc false
  def deliver_webhook(export, webhook_url) do
    payload = %{
      event: "export.completed",
      export_id: export.id,
      download_url: build_download_url(export),
      file_size: export.file_size,
      expires_at: export.expires_at
    }

    Task.start(fn ->
      body = Jason.encode!(payload)
      headers = [{"Content-Type", "application/json"}]

      request = Finch.build(:post, webhook_url, headers, body)

      case Finch.request(request, CGraph.Finch) do
        {:ok, %{status: status}} when status in 200..299 ->
          Logger.info("data_export_webhook_delivered", export_id: export.id)

        {:ok, %{status: status}} ->
          Logger.warning("data_export_webhook_failed", status: status, export_id: export.id)

        {:error, reason} ->
          Logger.error("data_export_webhook_error", reason: inspect(reason))
      end
    end)

    :ok
  end

  # ---------------------------------------------------------------------------
  # Audit Logging
  # ---------------------------------------------------------------------------

  @doc false
  def log_export_started(export) do
    Logger.info("data_export_started", export_id: export.id, user_id: export.user_id)

    CGraph.Audit.log(:data_export, :export_started, %{
      export_id: export.id,
      user_id: export.user_id,
      type: export.type,
      format: export.format
    }, actor_id: export.user_id)
  end

  @doc false
  def log_export_completed(export) do
    Logger.info("data_export_completed", export_id: export.id, file_size: export.file_size)

    CGraph.Audit.log(:data_export, :export_completed, %{
      export_id: export.id,
      user_id: export.user_id,
      file_size: export.file_size,
      duration_ms: DateTime.diff(export.completed_at, export.created_at, :millisecond)
    }, actor_id: export.user_id)
  end

  @doc false
  def log_export_failed(export) do
    Logger.error("data_export_error", export_id: export.id, error: export.error)

    CGraph.Audit.log(:data_export, :export_failed, %{
      export_id: export.id,
      user_id: export.user_id,
      error: export.error
    }, actor_id: export.user_id)
  end

  @doc false
  def log_download(export) do
    CGraph.Audit.log(:data_export, :export_downloaded, %{
      export_id: export.id,
      user_id: export.user_id,
      download_count: export.download_count + 1
    }, actor_id: export.user_id)
  end

  @doc false
  def log_export_deleted(export) do
    CGraph.Audit.log(:data_export, :export_deleted, %{
      export_id: export.id,
      user_id: export.user_id
    }, actor_id: export.user_id)
  end

  # ---------------------------------------------------------------------------
  # Private - ETS Lookup
  # ---------------------------------------------------------------------------

  defp lookup_export(export_id) do
    case :ets.lookup(@export_table, export_id) do
      [{^export_id, export}] -> {:ok, export}
      [] -> {:error, :not_found}
    end
  end
end
