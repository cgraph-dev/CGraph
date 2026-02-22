defmodule CGraph.Storage.Local do
  @moduledoc """
  Local filesystem storage backend.

  Used for development and testing. Files are stored in `priv/static/uploads`
  and served via Phoenix static file serving.

  ## Configuration

      config :cgraph, :storage,
        backend: :local,
        local_path: "priv/static/uploads",
        base_url: "/uploads"
  """

  @behaviour CGraph.Storage

  require Logger

  @default_path "priv/static/uploads"
  @default_base_url "/uploads"

  @impl true
  @spec store(String.t(), String.t(), keyword()) :: {:ok, map()} | {:error, term()}
  def store(source_path, filename, opts \\ []) do
    context = Keyword.get(opts, :context, "files")
    config = config()

    base_path = Keyword.get(config, :local_path, @default_path)
    base_url = Keyword.get(config, :base_url, @default_base_url)

    # Create directory structure
    dest_dir = Path.join([base_path, context])
    File.mkdir_p!(dest_dir)

    # Generate unique filename if needed
    final_filename = ensure_unique_filename(dest_dir, filename)
    dest_path = Path.join(dest_dir, final_filename)

    # Copy or move the file
    case File.cp(source_path, dest_path) do
      :ok ->
        {:ok, stat} = File.stat(dest_path)
        url = Path.join([base_url, context, final_filename])
        key = Path.join([context, final_filename])

        {:ok, %{
          key: key,
          url: url,
          path: dest_path,
          size: stat.size
        }}

      {:error, reason} ->
        Logger.error("failed_to_store_file_locally", reason: inspect(reason))
        {:error, {:storage_failed, reason}}
    end
  end

  @impl true
  @spec delete(String.t()) :: :ok | {:error, term()}
  def delete(url_or_key) do
    config = config()
    base_path = Keyword.get(config, :local_path, @default_path)
    base_url = Keyword.get(config, :base_url, @default_base_url)

    # Convert URL to file path
    path = if String.starts_with?(url_or_key, base_url) do
      relative = String.replace_prefix(url_or_key, base_url, "")
      Path.join(base_path, relative)
    else
      Path.join(base_path, url_or_key)
    end

    # Prevent path traversal — resolved path must be within base_path
    resolved = Path.expand(path)
    unless String.starts_with?(resolved, Path.expand(base_path)) do
      {:error, :path_traversal}
    else
      case File.rm(resolved) do
        :ok -> :ok
        {:error, :enoent} -> :ok  # Already deleted
        {:error, reason} -> {:error, reason}
      end
    end
  end

  @impl true
  @spec signed_url(String.t(), keyword()) :: {:ok, String.t()}
  def signed_url(key, _opts \\ []) do
    # Local storage doesn't need signed URLs
    config = config()
    base_url = Keyword.get(config, :base_url, @default_base_url)
    {:ok, Path.join(base_url, key)}
  end

  @impl true
  @spec exists?(String.t()) :: boolean()
  def exists?(key) do
    config = config()
    base_path = Keyword.get(config, :local_path, @default_path)
    path = Path.join(base_path, key)
    File.exists?(path)
  end

  defp config do
    Application.get_env(:cgraph, :storage, [])
  end

  defp ensure_unique_filename(dir, filename) do
    path = Path.join(dir, filename)

    if File.exists?(path) do
      ext = Path.extname(filename)
      base = Path.basename(filename, ext)
      "#{base}_#{:erlang.unique_integer([:positive])}#{ext}"
    else
      filename
    end
  end
end
