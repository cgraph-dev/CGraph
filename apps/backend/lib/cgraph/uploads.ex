defmodule CGraph.Uploads do
  @moduledoc """
  The Uploads context.

  Handles file uploads, storage, and quota management.
  Includes magic byte validation for security and image optimization for performance.

  ## Image Optimization

  When an image is uploaded, we generate multiple sizes:
  - Thumbnail (150x150) - For lists and previews
  - Preview (800x800) - For chat views
  - Original - For full-screen viewing

  This prevents users from downloading massive 10MB photos just to see a small chat bubble.
  """

  import Ecto.Query, warn: false
  alias CGraph.Repo

  require Logger

  alias CGraph.Uploads.ImageOptimizer

  # Magic byte signatures for file type validation
  # These are the first bytes of valid files for each supported type
  @magic_signatures %{
    # Images
    "image/jpeg" => [<<0xFF, 0xD8, 0xFF>>],
    "image/png" => [<<0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A>>],
    "image/gif" => [<<0x47, 0x49, 0x46, 0x38, 0x37, 0x61>>, <<0x47, 0x49, 0x46, 0x38, 0x39, 0x61>>],
    "image/webp" => [<<0x52, 0x49, 0x46, 0x46>>],  # RIFF header (need to check WEBP at offset 8)
    "image/bmp" => [<<0x42, 0x4D>>],
    "image/heic" => [<<0x00, 0x00, 0x00>>],  # ftyp box (need additional validation)
    "image/heif" => [<<0x00, 0x00, 0x00>>],
    # Videos
    "video/mp4" => [<<0x00, 0x00, 0x00>>],  # ftyp box
    "video/quicktime" => [<<0x00, 0x00, 0x00>>],
    "video/webm" => [<<0x1A, 0x45, 0xDF, 0xA3>>],
    "video/x-matroska" => [<<0x1A, 0x45, 0xDF, 0xA3>>],
    # Audio
    "audio/mpeg" => [<<0xFF, 0xFB>>, <<0xFF, 0xFA>>, <<0x49, 0x44, 0x33>>],  # MP3 with ID3
    "audio/wav" => [<<0x52, 0x49, 0x46, 0x46>>],  # RIFF header
    "audio/ogg" => [<<0x4F, 0x67, 0x67, 0x53>>],
    "audio/webm" => [<<0x1A, 0x45, 0xDF, 0xA3>>],
    "audio/m4a" => [<<0x00, 0x00, 0x00>>],  # ftyp box
    "audio/aac" => [<<0xFF, 0xF1>>, <<0xFF, 0xF9>>],
    # Documents
    "application/pdf" => [<<0x25, 0x50, 0x44, 0x46>>],  # %PDF
    "application/zip" => [<<0x50, 0x4B, 0x03, 0x04>>],
    "text/plain" => []  # No magic bytes for text, allow all
  }

  # Maximum bytes to read for magic number validation
  @magic_read_bytes 16

  # Rename inner module to avoid shadowing Elixir's File module
  defmodule UploadedFile do
    @moduledoc """
    Schema for uploaded files.
    """
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :binary_id, autogenerate: true}
    schema "files" do
      field :filename, :string
      field :original_filename, :string
      field :content_type, :string
      field :size, :integer
      field :url, :string
      field :thumbnail_url, :string
      field :width, :integer
      field :height, :integer
      field :duration, :float
      field :checksum, :string
      field :is_public, :boolean, default: false
      field :context, :string
      belongs_to :user, CGraph.Accounts.User, type: :binary_id

      timestamps()
    end

    def changeset(file, attrs) do
      file
      |> cast(attrs, [:filename, :original_filename, :content_type, :size, :url,
                      :thumbnail_url, :width, :height, :duration, :checksum,
                      :is_public, :context, :user_id])
      |> validate_required([:filename, :content_type, :size, :url, :user_id])
    end
  end

  @upload_dir "priv/static/uploads"
  @max_quota 5 * 1024 * 1024 * 1024 # 5 GB default quota

  @doc """
  Store a file upload with magic byte validation and image optimization.

  Validates the file's actual content against its claimed MIME type
  to prevent malicious file uploads (e.g., PHP files disguised as images).

  For images larger than 100KB, generates:
  - Thumbnail (150x150) for lists
  - Preview (800x800) for chat view
  - Optimized original
  """
  @spec store_file(map(), map(), keyword()) :: {:ok, Ecto.Schema.t()} | {:error, term()}
  def store_file(user, upload, opts \\ []) do
    context = Keyword.get(opts, :context, "message")
    skip_validation = Keyword.get(opts, :skip_validation, false)
    skip_optimization = Keyword.get(opts, :skip_optimization, false)

    # Validate file content matches claimed MIME type
    with :ok <- validate_mime_type(upload.path, upload.content_type, skip_validation) do
      do_store_file(user, upload, context, skip_optimization)
    end
  end

  defp do_store_file(user, upload, context, skip_optimization) do
    # Generate unique filename
    ext = Path.extname(upload.filename)
    filename = "#{Ecto.UUID.generate()}#{ext}"

    # Ensure upload directory exists
    upload_path = Path.join([@upload_dir, context])
    File.mkdir_p!(upload_path)

    # Copy file
    dest_path = Path.join(upload_path, filename)
    File.cp!(upload.path, dest_path)

    # Get file info
    {:ok, stat} = File.stat(dest_path)
    checksum = :crypto.hash(:sha256, File.read!(dest_path)) |> Base.encode16(case: :lower)

    # Generate URL
    url = "/uploads/#{context}/#{filename}"

    # Optimize images if applicable (preview_url reserved for future use)
    {thumbnail_url, _preview_url, final_url, dimensions} =
      if ImageOptimizer.should_optimize_image?(upload.content_type, stat.size, skip_optimization) do
        base_id = Path.rootname(filename)
        ImageOptimizer.optimize_image(dest_path, base_id, context, upload.content_type)
      else
        # No optimization - just get dimensions if it's an image
        dims = if String.starts_with?(upload.content_type, "image/") do
          case ImageOptimizer.get_image_dimensions(dest_path) do
            {:ok, w, h} -> %{width: w, height: h}
            _ -> %{}
          end
        else
          %{}
        end
        {nil, nil, url, dims}
      end

    # Create file record
    file_attrs = %{
      filename: filename,
      original_filename: upload.filename,
      content_type: upload.content_type,
      size: stat.size,
      url: final_url,
      thumbnail_url: thumbnail_url,
      checksum: checksum,
      context: context,
      user_id: user.id
    }
    |> Map.merge(dimensions)

    %UploadedFile{}
    |> UploadedFile.changeset(file_attrs)
    |> Repo.insert()
  end

  @doc """
  Get a file by ID.
  """
  @spec get_file(String.t()) :: {:ok, Ecto.Schema.t()} | {:error, :not_found}
  def get_file(file_id) do
    case Repo.get(UploadedFile, file_id) do
      nil -> {:error, :not_found}
      file -> {:ok, file}
    end
  end

  @doc """
  Delete a file.
  """
  @spec delete_file(Ecto.Schema.t()) :: {:ok, Ecto.Schema.t()} | {:error, Ecto.Changeset.t()}
  def delete_file(file) do
    # Delete physical file
    file_path = Path.join(["priv/static", file.url])
    File.rm(file_path)

    # Delete record
    Repo.delete(file)
  end

  @doc """
  Check user's upload quota.
  """
  @spec check_quota(map()) :: :ok | {:error, :quota_exceeded}
  def check_quota(user) do
    usage = get_user_usage(user)
    used = usage.used_bytes || 0

    # Ensure used_bytes is a number before comparison
    used_bytes = if is_number(used), do: used, else: 0

    if used_bytes < @max_quota do
      :ok
    else
      {:error, :quota_exceeded}
    end
  end

  @doc """
  Get user's storage usage.
  """
  @spec get_user_usage(map()) :: map()
  def get_user_usage(user) do
    query = from f in UploadedFile,
      where: f.user_id == ^user.id,
      select: %{
        total_size: sum(f.size),
        count: count(f.id)
      }

    result = Repo.one(query) || %{total_size: 0, count: 0}

    # Get breakdown by type
    images_query = from f in UploadedFile,
      where: f.user_id == ^user.id,
      where: like(f.content_type, "image/%"),
      select: sum(f.size)

    videos_query = from f in UploadedFile,
      where: f.user_id == ^user.id,
      where: like(f.content_type, "video/%"),
      select: sum(f.size)

    documents_query = from f in UploadedFile,
      where: f.user_id == ^user.id,
      where: not like(f.content_type, "image/%") and not like(f.content_type, "video/%"),
      select: sum(f.size)

    images_bytes = Repo.one(images_query) || 0
    videos_bytes = Repo.one(videos_query) || 0
    documents_bytes = Repo.one(documents_query) || 0
    used_bytes = result.total_size || 0
    file_count = result.count || 0

    # Calculate percentage safely, avoiding division by zero or nil issues
    used_percentage =
      if is_number(used_bytes) and used_bytes > 0 do
        Float.round(used_bytes / @max_quota * 100, 1)
      else
        0.0
      end

    %{
      used_bytes: used_bytes,
      total_bytes: @max_quota,
      used_percentage: used_percentage,
      file_count: file_count,
      images_bytes: images_bytes,
      videos_bytes: videos_bytes,
      documents_bytes: documents_bytes
    }
  end

  @doc """
  Generate a presigned URL for direct upload.
  """
  @spec generate_presigned_url(map(), keyword()) :: {:ok, map()}
  def generate_presigned_url(_user, opts \\ []) do
    filename = Keyword.get(opts, :filename)
    content_type = Keyword.get(opts, :content_type)
    context = Keyword.get(opts, :context, "message")

    upload_id = Ecto.UUID.generate()

    {:ok, %{
      upload_id: upload_id,
      url: "/api/v1/uploads/#{upload_id}",
      fields: %{
        key: "uploads/#{context}/#{upload_id}/#{filename}",
        content_type: content_type
      },
      expires_at: DateTime.add(DateTime.utc_now(), 3600, :second)
    }}
  end

  @doc """
  Confirm a presigned upload completed.
  """
  @spec confirm_presigned_upload(map(), String.t(), String.t()) :: {:ok, UploadedFile.t()}
  def confirm_presigned_upload(user, upload_id, key) do
    {:ok, %UploadedFile{
      id: upload_id,
      filename: Path.basename(key),
      url: "/uploads/#{key}",
      user_id: user.id,
      inserted_at: DateTime.utc_now()
    }}
  end

  @doc """
  Validate that file content matches the claimed MIME type using magic bytes.

  This prevents attacks where malicious files (e.g., PHP scripts) are uploaded
  with fake extensions or MIME types (e.g., .jpg, image/jpeg).

  ## Security

  - Reads the first few bytes of the file
  - Compares against known magic byte signatures
  - Rejects files where content doesn't match claimed type
  """
  @spec validate_mime_type(String.t(), String.t(), boolean()) :: :ok | {:error, :invalid_file_type}
  def validate_mime_type(_path, _content_type, true), do: :ok

  def validate_mime_type(path, content_type, _skip) do
    # Normalize MIME type
    base_type = content_type |> String.split(";") |> List.first() |> String.trim() |> String.downcase()

    case Map.get(@magic_signatures, base_type) do
      nil ->
        # Unknown MIME type - check if it's in our allowlist
        if allowed_unknown_type?(base_type) do
          :ok
        else
          Logger.warning("upload_rejected_unknown_mime_type", base_type: base_type)
          {:error, :invalid_file_type}
        end

      [] ->
        # No magic bytes to check (e.g., text/plain)
        :ok

      signatures ->
        validate_file_signature(path, signatures, base_type)
    end
  end

  defp validate_file_signature(path, signatures, content_type) do
    case File.open(path, [:read, :binary]) do
      {:ok, file} ->
        result =
          case IO.binread(file, @magic_read_bytes) do
            {:error, _} ->
              {:error, :invalid_file_type}
            :eof ->
              {:error, :invalid_file_type}
            bytes when is_binary(bytes) ->
              if matches_any_signature?(bytes, signatures, content_type) do
                :ok
              else
                Logger.warning("upload_rejected_magic_bytes_mismatch", content_type: content_type)
                {:error, :invalid_file_type}
              end
          end
        File.close(file)
        result

      {:error, reason} ->
        Logger.error("failed_to_open_file_for_validation", reason: inspect(reason))
        {:error, :invalid_file_type}
    end
  end

  defp matches_any_signature?(bytes, signatures, content_type) do
    Enum.any?(signatures, fn sig ->
      sig_len = byte_size(sig)
      case bytes do
        <<prefix::binary-size(sig_len), _rest::binary>> ->
          matches = prefix == sig
          # Special handling for container formats (MP4, WEBP, etc.)
          matches or check_container_format(bytes, content_type)
        _ ->
          false
      end
    end)
  end

  # Container formats like MP4, M4A, HEIC use ftyp boxes
  # The actual format identifier is at offset 4-8
  defp check_container_format(bytes, content_type) when byte_size(bytes) >= 12 do
    case content_type do
      "video/mp4" ->
        <<_size::32, ftyp::binary-size(4), _rest::binary>> = bytes
        ftyp == "ftyp"

      "video/quicktime" ->
        <<_size::32, ftyp::binary-size(4), _rest::binary>> = bytes
        ftyp == "ftyp"

      "audio/m4a" ->
        <<_size::32, ftyp::binary-size(4), _rest::binary>> = bytes
        ftyp == "ftyp"

      "image/webp" ->
        # RIFF....WEBP
        <<riff::binary-size(4), _size::32, webp::binary-size(4), _::binary>> = bytes
        riff == "RIFF" and webp == "WEBP"

      "image/heic" ->
        <<_size::32, ftyp::binary-size(4), _rest::binary>> = bytes
        ftyp == "ftyp"

      "image/heif" ->
        <<_size::32, ftyp::binary-size(4), _rest::binary>> = bytes
        ftyp == "ftyp"

      _ ->
        false
    end
  end

  defp check_container_format(_bytes, _content_type), do: false

  # Allow certain generic types that don't have magic bytes
  defp allowed_unknown_type?(type) do
    type in [
      "text/plain",
      "text/html",
      "text/css",
      "text/javascript",
      "application/json",
      "application/xml",
      "text/xml"
    ]
  end
end
