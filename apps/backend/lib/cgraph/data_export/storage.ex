defmodule CGraph.DataExport.Storage do
  @moduledoc """
  File storage, encryption, and configuration for data exports.

  Handles writing export files to disk, AES-256-GCM encryption,
  S3 upload stubs, file path management, and shared configuration access.
  """

  alias CGraph.DataExport.Formatter

  @default_config %{
    storage: :local,
    local_path: "/tmp/cgraph_exports",
    bucket: nil,
    encryption: true,
    link_expiry: :timer.hours(24),
    max_export_size: 100_000_000,
    retention_days: 7,
    chunk_size: 10_000
  }

  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------

  @doc """
  Load the full merged configuration map.
  """
  @spec load_config() :: map()
  def load_config do
    app_config = Application.get_env(:cgraph, CGraph.DataExport, [])
    Map.merge(@default_config, Map.new(app_config))
  end

  @doc """
  Get a single configuration value with default fallback.
  """
  @spec get_config(atom()) :: term()
  def get_config(key) do
    app_config = Application.get_env(:cgraph, CGraph.DataExport, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end

  # ---------------------------------------------------------------------------
  # File Operations
  # ---------------------------------------------------------------------------

  @doc """
  Ensure the local storage directory exists.
  """
  @spec ensure_storage_dir() :: :ok
  def ensure_storage_dir do
    path = get_config(:local_path)
    File.mkdir_p!(path)
    :ok
  end

  @doc """
  Build the file path for an export based on format and filename.
  """
  @spec export_file_path(map()) :: String.t()
  def export_file_path(export) do
    base_path = get_config(:local_path)
    extension = format_extension(export.format)
    Path.join(base_path, "#{export.filename}.#{extension}")
  end

  @doc """
  Write formatted export data to a file, optionally compressing and encrypting.
  """
  @spec write_export_file(map(), map(), keyword()) :: {String.t(), non_neg_integer()}
  def write_export_file(export, data, opts) do
    file_path = export_file_path(export)

    formatted =
      case export.format do
        :json -> Jason.encode!(data, pretty: true)
        :ndjson -> Formatter.format_ndjson(data)
        :csv -> Formatter.format_csv(data)
        :xml -> Formatter.format_xml(data)
      end

    content =
      if Keyword.get(opts, :compress, false) do
        :zlib.gzip(formatted)
      else
        formatted
      end

    content =
      if Keyword.get(opts, :encrypt, get_config(:encryption)) do
        encrypt_content(content, Keyword.get(opts, :password))
      else
        content
      end

    # Validate path stays within export directory
    export_dir = get_config(:export_dir) || Path.join(System.tmp_dir!(), "cgraph_exports")
    resolved = Path.expand(file_path)

    unless String.starts_with?(resolved, Path.expand(export_dir)) do
      raise ArgumentError, "Export path traversal detected"
    end

    :ok = File.write(file_path, content)
    %{size: file_size} = File.stat!(file_path)

    {file_path, file_size}
  end

  @doc """
  Delete an export's file from disk if it exists.
  """
  @spec delete_export_file(map()) :: :ok | {:error, term()}
  def delete_export_file(export) do
    if export.storage_path && File.exists?(export.storage_path) do
      File.rm(export.storage_path)
    end

    :ok
  end

  @doc """
  Upload an export to Cloudflare R2 via ExAws S3-compatible API.

  Expects a map with :key, :body, and :content_type fields.
  Returns {:ok, key} on success or {:error, reason} on failure.
  """
  @spec upload_to_s3(map()) :: {:ok, String.t()} | {:error, term()}
  def upload_to_s3(data) do
    bucket = Application.get_env(:cgraph, :r2_bucket, "cgraph-exports")

    ExAws.S3.put_object(bucket, data.key, data.body, [
      {:content_type, data.content_type},
      {:acl, :private}
    ])
    |> ExAws.request()
    |> case do
      {:ok, _} -> {:ok, data.key}
      {:error, reason} -> {:error, {:s3_upload_failed, reason}}
    end
  end

  # ---------------------------------------------------------------------------
  # File Extension Mapping
  # ---------------------------------------------------------------------------

  @doc false
  @spec format_extension(atom()) :: String.t()
  def format_extension(:json), do: "json"
  def format_extension(:ndjson), do: "ndjson"
  def format_extension(:csv), do: "csv"
  def format_extension(:xml), do: "xml"
  def format_extension(_), do: "data"

  # ---------------------------------------------------------------------------
  # Encryption
  # ---------------------------------------------------------------------------

  @doc false
  @spec encrypt_content(binary(), String.t() | nil) :: binary()
  def encrypt_content(content, password) do
    {key, salt_prefix} =
      if password do
        {key, salt} = derive_key_from_password(password)
        {key, <<2::8, salt::binary>>}
      else
        {get_master_key(), <<1::8>>}
      end

    iv = :crypto.strong_rand_bytes(12)

    {ciphertext, tag} =
      :crypto.crypto_one_time_aead(:aes_256_gcm, key, iv, content, "", true)

    <<salt_prefix::binary, iv::binary, tag::binary, ciphertext::binary>>
  end

  defp derive_key_from_password(password) do
    salt = :crypto.strong_rand_bytes(16)
    key = :crypto.pbkdf2_hmac(:sha256, password, salt, 100_000, 32)
    {key, salt}
  end

  defp get_master_key do
    key_b64 = Application.get_env(:cgraph, :export_encryption_key)

    if key_b64 do
      Base.decode64!(key_b64)
    else
      secret =
        Application.get_env(:cgraph, CGraphWeb.Endpoint)[:secret_key_base] || "dev_secret"

      :crypto.hash(:sha256, secret)
    end
  end
end
