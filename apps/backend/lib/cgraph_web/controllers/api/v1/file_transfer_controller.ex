defmodule CGraphWeb.API.V1.FileTransferController do
  @moduledoc """
  REST API for file transfer operations.

  Handles file upload initiation, chunk tracking, completion,
  secure download URLs, and storage usage queries.

  ## Endpoints

  - `POST   /api/v1/files/upload`                — Initiate upload
  - `GET    /api/v1/files/usage`                 — Storage usage
  - `GET    /api/v1/files/:id`                   — Transfer status
  - `PUT    /api/v1/files/:id/chunks/:chunk`     — Record chunk upload
  - `POST   /api/v1/files/:id/complete`          — Complete upload
  - `GET    /api/v1/files/:id/download`          — Download URL
  - `DELETE /api/v1/files/:id`                   — Cancel upload
  """
  use CGraphWeb, :controller

  alias CGraph.Messaging.FileTransfer

  action_fallback CGraphWeb.FallbackController

  # ============================================================================
  # Upload Lifecycle
  # ============================================================================

  @doc "Initiate a file upload."
  def initiate(conn, params) do
    user = conn.assigns.current_user

    case FileTransfer.initiate_upload(user, params) do
      {:ok, %{transfer: transfer, upload: upload_config}} ->
        conn
        |> put_status(:created)
        |> json(%{
          transfer: render_transfer(transfer),
          upload: upload_config
        })

      {:error, :dangerous_file_type} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "File type not allowed"})

      {:error, :file_too_large} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "File exceeds maximum size for your tier"})

      {:error, :storage_quota_exceeded} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Storage quota exceeded"})

      {:error, :invalid_file_size} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid file size"})

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Invalid parameters", details: format_errors(changeset)})
    end
  end

  @doc "Record a chunk upload."
  def upload_chunk(conn, %{"id" => id, "chunk_number" => chunk_number} = params) do
    etag = params["etag"] || ""

    chunk_num =
      if is_binary(chunk_number), do: String.to_integer(chunk_number), else: chunk_number

    case FileTransfer.upload_chunk(id, chunk_num, etag) do
      {:ok, progress} ->
        conn
        |> put_status(:ok)
        |> json(%{progress: progress})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "Transfer not found"})

      {:error, :invalid_status} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "Transfer is not in uploadable state"})

      {:error, _} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to record chunk"})
    end
  end

  @doc "Complete a file upload."
  def complete(conn, %{"id" => id} = params) do
    case FileTransfer.complete_upload(id, params) do
      {:ok, transfer} ->
        conn
        |> put_status(:ok)
        |> json(%{transfer: render_transfer(transfer)})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "Transfer not found"})

      {:error, :incomplete_upload} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "Not all chunks have been uploaded"})

      {:error, _} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to complete upload"})
    end
  end

  @doc "Generate a download URL."
  def download(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case FileTransfer.generate_download_url(id, user.id) do
      {:ok, download_info} ->
        conn
        |> put_status(:ok)
        |> json(%{download: download_info})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "Transfer not found"})

      {:error, error} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Cannot download: #{error}"})
    end
  end

  @doc "Get transfer status."
  def status(conn, %{"id" => id}) do
    case FileTransfer.get_transfer(id) do
      {:ok, transfer} ->
        conn
        |> put_status(:ok)
        |> json(%{transfer: render_transfer(transfer)})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "Transfer not found"})
    end
  end

  @doc "Cancel an upload."
  def cancel(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case FileTransfer.cancel_upload(id, user.id) do
      {:ok, transfer} ->
        conn
        |> put_status(:ok)
        |> json(%{transfer: render_transfer(transfer)})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "Transfer not found"})

      {:error, :cannot_cancel} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "Cannot cancel a completed upload"})

      {:error, _} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to cancel upload"})
    end
  end

  @doc "Get user storage usage."
  def storage_usage(conn, _params) do
    user = conn.assigns.current_user
    usage = FileTransfer.get_user_storage_usage(user.id)

    conn
    |> put_status(:ok)
    |> json(%{
      usage: %{
        used_bytes: usage,
        used_human: humanize_bytes(usage)
      }
    })
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp render_transfer(transfer) do
    %{
      id: transfer.id,
      file_name: transfer.file_name,
      file_size: transfer.file_size,
      file_mime_type: transfer.file_mime_type,
      status: transfer.status,
      upload_type: transfer.upload_type,
      chunks_total: transfer.chunks_total,
      chunks_uploaded: transfer.chunks_uploaded,
      is_encrypted: transfer.is_encrypted,
      download_count: transfer.download_count,
      created_at: transfer.inserted_at,
      updated_at: transfer.updated_at
    }
  end

  defp humanize_bytes(bytes) when bytes < 1024, do: "#{bytes} B"
  defp humanize_bytes(bytes) when bytes < 1_048_576, do: "#{Float.round(bytes / 1024, 1)} KB"
  defp humanize_bytes(bytes) when bytes < 1_073_741_824, do: "#{Float.round(bytes / 1_048_576, 1)} MB"
  defp humanize_bytes(bytes), do: "#{Float.round(bytes / 1_073_741_824, 1)} GB"

  defp format_errors(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
