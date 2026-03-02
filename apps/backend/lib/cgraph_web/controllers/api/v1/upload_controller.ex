defmodule CGraphWeb.API.V1.UploadController do
  @moduledoc """
  Handles file uploads.
  Supports images, documents, and other media with size and type restrictions.

  SECURITY: Uses server-side MIME sniffing via magic bytes to verify
  file types, preventing content-type spoofing attacks.
  """
  use CGraphWeb, :controller
  require Logger

  alias CGraph.Uploads

  action_fallback CGraphWeb.FallbackController

  # Magic bytes map moved to Uploads module for centralized file type detection
  # Reference: https://en.wikipedia.org/wiki/List_of_file_signatures

  # Max file sizes in bytes
  @max_image_size 10 * 1024 * 1024  # 10 MB
  @max_video_size 100 * 1024 * 1024 # 100 MB
  @max_file_size 25 * 1024 * 1024   # 25 MB

  @allowed_image_types ~w(image/jpeg image/png image/gif image/webp image/heic image/heif)
  @allowed_video_types ~w(video/mp4 video/webm video/quicktime video/x-m4v video/3gpp)
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
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec batch_create(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => file_id}) do
    user = conn.assigns.current_user

    with {:ok, file} <- Uploads.get_file(file_id),
         :ok <- authorize_delete(user, file),
         {:ok, _} <- Uploads.delete_file(file) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Alias for presign/2 to match route naming.
  """
  @spec presigned(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def presigned(conn, params), do: presign(conn, params)

  @doc """
  Get a presigned URL for direct upload to cloud storage.
  POST /api/v1/uploads/presign
  """
  @spec presign(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec confirm(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def confirm(conn, %{"upload_id" => upload_id, "key" => key} = params) do
    user = conn.assigns.current_user

    with {:ok, file} <- Uploads.confirm_presigned_upload(user, upload_id, key) do
      # If encryption metadata is provided, store it on the upload record
      encryption_params = Map.get(params, "encryption", %{})

      if encryption_params != %{} do
        alias CGraph.Uploads.EncryptionMetadata

        changeset = EncryptionMetadata.changeset(%EncryptionMetadata{}, encryption_params)

        if changeset.valid? do
          encryption_attrs =
            encryption_params
            |> Map.take(~w(encrypted_key encryption_iv key_algorithm sender_device_id))
            |> Map.put("is_encrypted", true)

          Uploads.update_encryption_metadata(file, encryption_attrs)
        end
      end

      render(conn, :show, file: file)
    end
  end

  @doc """
  Get user's upload usage stats.
  GET /api/v1/uploads/usage
  """
  @spec usage(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def usage(conn, _params) do
    user = conn.assigns.current_user

    usage = Uploads.get_user_usage(user)
    render(conn, :usage, usage: usage)
  end

  # Private helpers

  defp validate_upload(upload, context) do
    claimed_type = upload.content_type
    size = get_file_size(upload)

    # SECURITY: Verify actual file type via magic bytes
    with {:ok, detected_type} <- detect_mime_type(upload.path),
         :ok <- verify_content_type_match(claimed_type, detected_type, upload.path) do
      # Use detected type for validation (more secure)
      actual_type = detected_type

      cond do
        actual_type in @allowed_image_types ->
          validate_size(size, @max_image_size, "image")

        actual_type in @allowed_video_types ->
          if context in ["message", "post"] do
            validate_size(size, @max_video_size, "video")
          else
            {:error, :video_not_allowed_in_context}
          end

        actual_type in @allowed_document_types ->
          if context == "message" do
            validate_size(size, @max_file_size, "document")
          else
            {:error, :documents_not_allowed_in_context}
          end

        true ->
          {:error, :unsupported_file_type}
      end
    end
  end

  # Detect MIME type from file magic bytes
  defp detect_mime_type(path) do
    case File.open(path, [:read, :binary]) do
      {:ok, file} ->
        # Read first 16 bytes for magic byte detection
        header = IO.binread(file, 16)
        File.close(file)
        identify_type_from_header(header)

      {:error, reason} ->
        Logger.error("failed_to_read_file_for_mime_detection", reason: inspect(reason))
        {:error, :file_read_error}
    end
  end

  # Magic byte detection via pattern matching
  # Each clause matches a specific file signature — no cond needed
  defp identify_type_from_header(<<0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, _::binary>>),
    do: {:ok, "image/png"}

  defp identify_type_from_header(<<0xFF, 0xD8, 0xFF, _::binary>>),
    do: {:ok, "image/jpeg"}

  defp identify_type_from_header(<<0x47, 0x49, 0x46, 0x38, version, 0x61, _::binary>>)
       when version in [0x37, 0x39],
       do: {:ok, "image/gif"}

  defp identify_type_from_header(<<0x52, 0x49, 0x46, 0x46, _size::binary-size(4), "WEBP", _::binary>>),
    do: {:ok, "image/webp"}

  defp identify_type_from_header(<<0x1A, 0x45, 0xDF, 0xA3, _::binary>>),
    do: {:ok, "video/webm"}

  defp identify_type_from_header(<<_size::binary-size(4), "ftyp", _::binary>> = header),
    do: identify_mp4_variant(header)

  defp identify_type_from_header(<<0x25, 0x50, 0x44, 0x46, _::binary>>),
    do: {:ok, "application/pdf"}

  defp identify_type_from_header(<<0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, _::binary>>),
    do: {:ok, "application/msword"}

  defp identify_type_from_header(<<0x50, 0x4B, 0x03, 0x04, _::binary>>),
    do: {:ok, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}

  defp identify_type_from_header(header) when is_binary(header) and byte_size(header) >= 3 do
    if likely_text?(header), do: {:ok, "text/plain"}, else: {:error, :unknown_file_type}
  end

  defp identify_type_from_header(_), do: {:error, :file_too_small}

  defp identify_mp4_variant(header) when byte_size(header) >= 12 do
    brand = binary_part(header, 8, 4)

    cond do
      brand in ["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "M4A "] ->
        {:ok, "video/mp4"}

      brand in ["qt  ", "MSNV"] ->
        {:ok, "video/quicktime"}

      String.starts_with?(brand, "3gp") ->
        {:ok, "video/3gpp"}

      # Default to mp4 for ftyp containers
      true ->
        {:ok, "video/mp4"}
    end
  end

  defp identify_mp4_variant(_), do: {:error, :invalid_mp4}

  defp likely_text?(data) do
    # Check if content appears to be text (printable ASCII, UTF-8 BOM, common text patterns)
    if binary_part(data, 0, min(3, byte_size(data))) == <<0xEF, 0xBB, 0xBF>> do
      # UTF-8 BOM
      true
    else
      # Check if mostly printable ASCII
      printable_ratio =
        data
        |> :binary.bin_to_list()
        |> Enum.count(fn byte ->
          # Printable ASCII, tab, newline, carriage return
          (byte >= 32 and byte <= 126) or byte in [9, 10, 13]
        end)

      printable_ratio / byte_size(data) > 0.9
    end
  end

  # Verify claimed content-type matches detected type
  defp verify_content_type_match(claimed, detected, path) do
    # Allow some flexibility for related types
    if types_compatible?(claimed, detected) do
      :ok
    else
      Logger.warning(
        "Content-type mismatch: claimed=#{claimed}, detected=#{detected}, file=#{path}",
        module: __MODULE__
      )
      {:error, :content_type_mismatch}
    end
  end

  defp types_compatible?(claimed, detected) when claimed == detected, do: true

  # Allow HEIC/HEIF (not easily detected) when claiming image types
  defp types_compatible?(claimed, _detected) when claimed in ["image/heic", "image/heif"], do: true

  # Allow MS Office document type variants
  defp types_compatible?(claimed, detected)
       when claimed in ["application/msword", "application/vnd.ms-excel"] and
            detected in ["application/msword", "application/vnd.ms-excel"],
       do: true

  # Allow OOXML variants
  defp types_compatible?(claimed, detected)
       when claimed in [
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ] and
            detected == "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
       do: true

  # Allow CSV as text/plain
  defp types_compatible?("text/csv", "text/plain"), do: true

  # Video type variants
  defp types_compatible?(claimed, detected)
       when claimed in ["video/mp4", "video/quicktime", "video/x-m4v"] and
            detected in ["video/mp4", "video/quicktime"],
       do: true

  defp types_compatible?(_, _), do: false

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
