defmodule Cgraph.Storage do
  @moduledoc """
  Unified storage interface for file uploads.
  
  ## Overview
  
  Provides a consistent API for file storage across different backends:
  
  - **Local**: Development and testing
  - **S3**: AWS S3 and compatible services (MinIO, DigitalOcean Spaces)
  - **R2**: Cloudflare R2 (S3-compatible)
  
  ## Configuration
  
  Configure the storage backend in your config files:
  
      # Development (local storage)
      config :cgraph, :storage,
        backend: :local,
        local_path: "priv/static/uploads",
        base_url: "/uploads"
  
      # Production (Cloudflare R2)
      config :cgraph, :storage,
        backend: :r2,
        bucket: "cgraph-uploads",
        region: "auto",
        access_key_id: System.get_env("R2_ACCESS_KEY_ID"),
        secret_access_key: System.get_env("R2_SECRET_ACCESS_KEY"),
        endpoint: System.get_env("R2_ENDPOINT"),
        public_url: System.get_env("R2_PUBLIC_URL")
  
  ## Usage
  
      # Store a file
      {:ok, result} = Cgraph.Storage.store(file_path, "image.jpg", context: "avatars")
      
      # Get a signed URL (for private files)
      {:ok, url} = Cgraph.Storage.signed_url(key, expires_in: 3600)
      
      # Delete a file
      :ok = Cgraph.Storage.delete(url)
  """
  
  @type storage_result :: %{
    key: String.t(),
    url: String.t(),
    path: String.t(),
    size: integer()
  }
  
  @callback store(String.t(), String.t(), keyword()) :: {:ok, storage_result()} | {:error, term()}
  @callback delete(String.t()) :: :ok | {:error, term()}
  @callback signed_url(String.t(), keyword()) :: {:ok, String.t()} | {:error, term()}
  @callback exists?(String.t()) :: boolean()
  
  @doc """
  Store a file using the configured backend.
  """
  @spec store(String.t() | map(), String.t(), keyword() | String.t()) :: {:ok, storage_result()} | {:error, term()}
  def store(source, filename_or_user_id, opts_or_context \\ [])
  
  def store(%{path: source_path, filename: filename}, user_id, context) when is_binary(context) do
    unique = :crypto.strong_rand_bytes(8) |> Base.url_encode64(padding: false)
    ext = Path.extname(filename)
    new_filename = "#{unique}#{ext}"
    
    backend().store(source_path, new_filename, context: context, user_id: user_id)
  end
  
  def store(source_path, filename, opts) when is_binary(source_path) and is_list(opts) do
    backend().store(source_path, filename, opts)
  end
  
  @doc """
  Delete a file from storage.
  """
  @spec delete(String.t()) :: :ok | {:error, term()}
  def delete(url_or_key) do
    backend().delete(url_or_key)
  end
  
  @doc """
  Generate a signed URL for private file access.
  """
  @spec signed_url(String.t(), keyword()) :: {:ok, String.t()} | {:error, term()}
  def signed_url(key, opts \\ []) do
    backend().signed_url(key, opts)
  end
  
  @doc """
  Check if a file exists in storage.
  """
  @spec exists?(String.t()) :: boolean()
  def exists?(key) do
    backend().exists?(key)
  end
  
  @doc """
  Get the current storage backend module.
  """
  @spec backend() :: module()
  def backend do
    config = Application.get_env(:cgraph, :storage, [])
    
    case Keyword.get(config, :backend, :local) do
      :local -> Cgraph.Storage.Local
      :s3 -> Cgraph.Storage.S3
      :r2 -> Cgraph.Storage.R2
      module when is_atom(module) -> module
    end
  end
  
  @doc """
  Alias for backend/0.
  """
  @spec current_backend() :: module()
  def current_backend, do: backend()
  
  @doc """
  Get public URL for a stored file.
  """
  @spec get_url(String.t(), atom()) :: String.t()
  def get_url(path, _backend \\ :local) do
    config = Application.get_env(:cgraph, :storage, [])
    base_url = Keyword.get(config, :base_url, "/uploads")
    
    Path.join(base_url, path)
  end
  
  @doc """
  Get a presigned URL for temporary access.
  """
  @spec get_presigned_url(String.t(), integer()) :: {:ok, String.t()} | {:error, term()}
  def get_presigned_url(path, expires_in_seconds) do
    signed_url(path, expires_in: expires_in_seconds)
  end
  
  @doc """
  List files in a directory.
  """
  @spec list(String.t()) :: {:ok, [String.t()]} | {:error, term()}
  def list(prefix) do
    config = Application.get_env(:cgraph, :storage, [])
    local_path = Keyword.get(config, :local_path, "priv/static/uploads")
    
    full_path = Path.join(local_path, prefix)
    
    if File.dir?(full_path) do
      {:ok, File.ls!(full_path)}
    else
      {:ok, []}
    end
  rescue
    _ -> {:ok, []}
  end
  
  @doc """
  Detect content type from filename.
  """
  @spec detect_content_type(String.t()) :: String.t()
  def detect_content_type(filename) do
    ext = filename |> Path.extname() |> String.downcase()
    
    case ext do
      # Audio
      ".webm" -> "audio/webm"
      ".ogg" -> "audio/ogg"
      ".opus" -> "audio/ogg"
      ".mp3" -> "audio/mpeg"
      ".m4a" -> "audio/mp4"
      ".wav" -> "audio/wav"
      ".aac" -> "audio/aac"
      ".flac" -> "audio/flac"
      
      # Images
      ".jpg" -> "image/jpeg"
      ".jpeg" -> "image/jpeg"
      ".png" -> "image/png"
      ".gif" -> "image/gif"
      ".webp" -> "image/webp"
      ".svg" -> "image/svg+xml"
      ".ico" -> "image/x-icon"
      ".bmp" -> "image/bmp"
      
      # Video
      ".mp4" -> "video/mp4"
      ".avi" -> "video/x-msvideo"
      ".mov" -> "video/quicktime"
      ".mkv" -> "video/x-matroska"
      
      # Documents
      ".pdf" -> "application/pdf"
      ".doc" -> "application/msword"
      ".docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ".xls" -> "application/vnd.ms-excel"
      ".xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ".txt" -> "text/plain"
      ".json" -> "application/json"
      ".xml" -> "application/xml"
      ".html" -> "text/html"
      ".css" -> "text/css"
      ".js" -> "application/javascript"
      
      # Archives
      ".zip" -> "application/zip"
      ".tar" -> "application/x-tar"
      ".gz" -> "application/gzip"
      ".rar" -> "application/vnd.rar"
      ".7z" -> "application/x-7z-compressed"
      
      # Default
      _ -> "application/octet-stream"
    end
  end
  
  @doc """
  Validate a file before storage.
  """
  @spec validate_file(String.t(), keyword()) :: :ok | {:error, atom()}
  def validate_file(path, opts \\ []) do
    max_size = Keyword.get(opts, :max_size)
    
    case File.stat(path) do
      {:ok, %{size: size}} ->
        if max_size && size > max_size do
          {:error, :file_too_large}
        else
          :ok
        end
        
      {:error, :enoent} ->
        {:error, :not_found}
        
      {:error, _} ->
        {:error, :invalid_file}
    end
  end
end
