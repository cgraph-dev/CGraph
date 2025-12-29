defmodule CgraphWeb.API.V1.UploadController do
  @moduledoc """
  Handles file uploads.
  Supports images, documents, and other media with size and type restrictions.
  """
  use CgraphWeb, :controller

  alias Cgraph.Uploads

  action_fallback CgraphWeb.FallbackController

  # Max file sizes in bytes
  @max_image_size 10 * 1024 * 1024  # 10 MB
  @max_video_size 100 * 1024 * 1024 # 100 MB
  @max_file_size 25 * 1024 * 1024   # 25 MB

  @allowed_image_types ~w(image/jpeg image/png image/gif image/webp)
  @allowed_video_types ~w(video/mp4 video/webm video/quicktime)
  @allowed_document_types ~w(
    application/pdf
    application/msword
    application/vnd.openxmlformats-officedocument.wordprocessingml.document
    application/vnd.ms-excel
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    text/plain
    text/csv
  )

  @doc """
  Upload a file.
  POST /api/v1/uploads
  """
  def create(conn, %{"file" => upload} = params) do
    user = conn.assigns.current_user
    context = Map.get(params, "context", "message") # message, avatar, banner, post, etc.
    
    with :ok <- validate_upload(upload, context),
         :ok <- check_upload_quota(user),
         {:ok, file} <- Uploads.store_file(user, upload, context: context) do
      conn
      |> put_status(:created)
      |> render(:show, file: file)
    end
  end

  # Handle missing file parameter
  def create(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: %{message: "File is required", code: "MISSING_FILE"}})
  end

  @doc """
  Upload multiple files.
  POST /api/v1/uploads/batch
  """
  def batch_create(conn, %{"files" => uploads} = params) when is_list(uploads) do
    user = conn.assigns.current_user
    context = Map.get(params, "context", "message")
    
    # Limit batch size
    if length(uploads) > 10 do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "Maximum 10 files per batch"})
    else
      results = Enum.map(uploads, fn upload ->
        with :ok <- validate_upload(upload, context),
             {:ok, file} <- Uploads.store_file(user, upload, context: context) do
          {:ok, file}
        else
          {:error, reason} -> {:error, upload.filename, reason}
        end
      end)
      
      successful = Enum.filter(results, &match?({:ok, _}, &1)) |> Enum.map(fn {:ok, f} -> f end)
      failed = Enum.filter(results, &match?({:error, _, _}, &1))
      
      conn
      |> put_status(:created)
      |> render(:batch, files: successful, errors: failed)
    end
  end

  @doc """
  Get upload info.
  GET /api/v1/uploads/:id
  """
  def show(conn, %{"id" => file_id}) do
    user = conn.assigns.current_user
    
    with {:ok, file} <- Uploads.get_file(file_id),
         :ok <- authorize_access(user, file) do
      render(conn, :show, file: file)
    end
  end

  @doc """
  Delete an upload.
  DELETE /api/v1/uploads/:id
  """
  def delete(conn, %{"id" => file_id}) do
    user = conn.assigns.current_user
    
    with {:ok, file} <- Uploads.get_file(file_id),
         :ok <- authorize_delete(user, file),
         {:ok, _} <- Uploads.delete_file(file) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Get a presigned URL for direct upload to cloud storage.
  POST /api/v1/uploads/presign
  """
  def presign(conn, params) do
    user = conn.assigns.current_user
    filename = Map.get(params, "filename")
    content_type = Map.get(params, "content_type")
    size = Map.get(params, "size", 0)
    context = Map.get(params, "context", "message")
    
    with :ok <- validate_presign_request(filename, content_type, size, context),
         :ok <- check_upload_quota(user),
         {:ok, presign_data} <- Uploads.generate_presigned_url(user, 
           filename: filename,
           content_type: content_type,
           size: size,
           context: context
         ) do
      render(conn, :presign, presign: presign_data)
    end
  end

  @doc """
  Confirm a presigned upload completed.
  POST /api/v1/uploads/confirm
  """
  def confirm(conn, %{"upload_id" => upload_id, "key" => key}) do
    user = conn.assigns.current_user
    
    with {:ok, file} <- Uploads.confirm_presigned_upload(user, upload_id, key) do
      render(conn, :show, file: file)
    end
  end

  @doc """
  Get user's upload usage stats.
  GET /api/v1/uploads/usage
  """
  def usage(conn, _params) do
    user = conn.assigns.current_user
    
    usage = Uploads.get_user_usage(user)
    render(conn, :usage, usage: usage)
  end

  # Private helpers

  defp validate_upload(upload, context) do
    content_type = upload.content_type
    size = get_file_size(upload)
    
    cond do
      content_type in @allowed_image_types ->
        validate_size(size, @max_image_size, "image")
      
      content_type in @allowed_video_types ->
        if context in ["message", "post"] do
          validate_size(size, @max_video_size, "video")
        else
          {:error, :video_not_allowed_in_context}
        end
      
      content_type in @allowed_document_types ->
        if context == "message" do
          validate_size(size, @max_file_size, "document")
        else
          {:error, :documents_not_allowed_in_context}
        end
      
      true ->
        {:error, :unsupported_file_type}
    end
  end

  defp validate_size(size, max, type) do
    if size <= max do
      :ok
    else
      {:error, {:file_too_large, type, max}}
    end
  end

  defp validate_presign_request(filename, content_type, size, _context) do
    cond do
      is_nil(filename) or String.length(filename) == 0 ->
        {:error, :filename_required}
      
      is_nil(content_type) ->
        {:error, :content_type_required}
      
      content_type not in (@allowed_image_types ++ @allowed_video_types ++ @allowed_document_types) ->
        {:error, :unsupported_file_type}
      
      size > @max_video_size ->
        {:error, {:file_too_large, "file", @max_video_size}}
      
      true ->
        :ok
    end
  end

  defp get_file_size(%Plug.Upload{path: path}) do
    case File.stat(path) do
      {:ok, %{size: size}} -> size
      _ -> 0
    end
  end

  defp check_upload_quota(user) do
    case Uploads.check_quota(user) do
      :ok -> :ok
      {:error, :quota_exceeded} -> {:error, :upload_quota_exceeded}
    end
  end

  defp authorize_access(user, file) do
    if file.user_id == user.id or file.is_public do
      :ok
    else
      {:error, :not_found}
    end
  end

  defp authorize_delete(user, file) do
    if file.user_id == user.id or user.is_admin do
      :ok
    else
      {:error, :unauthorized}
    end
  end
end
