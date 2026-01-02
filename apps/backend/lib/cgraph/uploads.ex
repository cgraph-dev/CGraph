defmodule Cgraph.Uploads do
  @moduledoc """
  The Uploads context.
  
  Handles file uploads, storage, and quota management.
  """

  import Ecto.Query, warn: false
  alias Cgraph.Repo

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
      belongs_to :user, Cgraph.Accounts.User, type: :binary_id

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
  Store a file upload.
  """
  def store_file(user, upload, opts \\ []) do
    context = Keyword.get(opts, :context, "message")
    
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
    
    # Create file record
    file_attrs = %{
      filename: filename,
      original_filename: upload.filename,
      content_type: upload.content_type,
      size: stat.size,
      url: url,
      checksum: checksum,
      context: context,
      user_id: user.id
    }
    
    # Add image dimensions if applicable
    file_attrs = if String.starts_with?(upload.content_type, "image/") do
      case get_image_dimensions(dest_path) do
        {:ok, width, height} -> Map.merge(file_attrs, %{width: width, height: height})
        _ -> file_attrs
      end
    else
      file_attrs
    end
    
    %UploadedFile{}
    |> UploadedFile.changeset(file_attrs)
    |> Repo.insert()
  end

  @doc """
  Get a file by ID.
  """
  def get_file(file_id) do
    case Repo.get(UploadedFile, file_id) do
      nil -> {:error, :not_found}
      file -> {:ok, file}
    end
  end

  @doc """
  Delete a file.
  """
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
  def check_quota(user) do
    usage = get_user_usage(user)
    
    if usage.used_bytes < @max_quota do
      :ok
    else
      {:error, :quota_exceeded}
    end
  end

  @doc """
  Get user's storage usage.
  """
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
    
    %{
      used_bytes: used_bytes,
      total_bytes: @max_quota,
      used_percentage: Float.round(used_bytes / @max_quota * 100, 1),
      file_count: result.count,
      images_bytes: images_bytes,
      videos_bytes: videos_bytes,
      documents_bytes: documents_bytes
    }
  end

  @doc """
  Generate a presigned URL for direct upload.
  """
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
  def confirm_presigned_upload(user, upload_id, key) do
    {:ok, %UploadedFile{
      id: upload_id,
      filename: Path.basename(key),
      url: "/uploads/#{key}",
      user_id: user.id,
      inserted_at: DateTime.utc_now()
    }}
  end

  # Private helpers

  defp get_image_dimensions(path) do
    case System.cmd("file", [path], stderr_to_stdout: true) do
      {output, 0} ->
        case Regex.run(~r/(\d+)\s*x\s*(\d+)/, output) do
          [_, w, h] -> {:ok, String.to_integer(w), String.to_integer(h)}
          _ -> {:error, :unknown_dimensions}
        end
      _ ->
        {:error, :command_failed}
    end
  end
end
