defmodule Cgraph.Storage.S3 do
  @moduledoc """
  S3-compatible storage backend.
  
  Supports AWS S3, DigitalOcean Spaces, MinIO, and other S3-compatible services.
  
  ## Configuration
  
      config :cgraph, :storage,
        backend: :s3,
        bucket: "my-bucket",
        region: "us-east-1",
        access_key_id: System.get_env("AWS_ACCESS_KEY_ID"),
        secret_access_key: System.get_env("AWS_SECRET_ACCESS_KEY"),
        endpoint: nil,  # Custom endpoint for non-AWS services
        public_url: nil  # Custom public URL for CDN
  
  ## Dependencies
  
  Requires the `ex_aws` and `ex_aws_s3` packages:
  
      {:ex_aws, "~> 2.5"},
      {:ex_aws_s3, "~> 2.5"},
      {:hackney, "~> 1.18"},
      {:sweet_xml, "~> 0.7"}
  """
  
  @behaviour Cgraph.Storage
  
  require Logger
  
  @impl true
  def store(source_path, filename, opts \\ []) do
    context = Keyword.get(opts, :context, "files")
    content_type = Keyword.get(opts, :content_type, MIME.from_path(filename))
    acl = Keyword.get(opts, :acl, :public_read)
    
    config = config()
    bucket = Keyword.fetch!(config, :bucket)
    
    # Generate object key
    key = Path.join([context, filename])
    
    # Read file content
    case File.read(source_path) do
      {:ok, content} ->
        upload_to_s3(bucket, key, content, content_type, acl, config)
      
      {:error, reason} ->
        {:error, {:file_read_failed, reason}}
    end
  end
  
  defp upload_to_s3(bucket, key, content, content_type, acl, config) do
    opts = [
      content_type: content_type,
      acl: acl,
      cache_control: "public, max-age=31536000"
    ]
    
    request = ExAws.S3.put_object(bucket, key, content, opts)
    
    case ExAws.request(request, ex_aws_config(config)) do
      {:ok, _} ->
        url = build_url(bucket, key, config)
        
        {:ok, %{
          key: key,
          url: url,
          path: key,
          size: byte_size(content)
        }}
      
      {:error, reason} ->
        Logger.error("S3 upload failed: #{inspect(reason)}")
        {:error, {:s3_upload_failed, reason}}
    end
  end
  
  @impl true
  def delete(url_or_key) do
    config = config()
    bucket = Keyword.fetch!(config, :bucket)
    
    # Extract key from URL if needed
    key = extract_key(url_or_key, config)
    
    request = ExAws.S3.delete_object(bucket, key)
    
    case ExAws.request(request, ex_aws_config(config)) do
      {:ok, _} -> :ok
      {:error, {:http_error, 404, _}} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end
  
  @impl true
  def signed_url(key, opts \\ []) do
    config = config()
    bucket = Keyword.fetch!(config, :bucket)
    expires_in = Keyword.get(opts, :expires_in, 3600)
    
    # Generate presigned URL
    {:ok, url} = ExAws.S3.presigned_url(
      ex_aws_config(config),
      :get,
      bucket,
      key,
      expires_in: expires_in
    )
    
    {:ok, url}
  end
  
  @impl true
  def exists?(key) do
    config = config()
    bucket = Keyword.fetch!(config, :bucket)
    
    request = ExAws.S3.head_object(bucket, key)
    
    case ExAws.request(request, ex_aws_config(config)) do
      {:ok, _} -> true
      {:error, _} -> false
    end
  end
  
  defp config do
    Application.get_env(:cgraph, :storage, [])
  end
  
  defp ex_aws_config(config) do
    base = [
      access_key_id: Keyword.get(config, :access_key_id),
      secret_access_key: Keyword.get(config, :secret_access_key),
      region: Keyword.get(config, :region, "us-east-1")
    ]
    
    # Add custom endpoint if specified
    case Keyword.get(config, :endpoint) do
      nil -> base
      endpoint -> Keyword.put(base, :host, endpoint)
    end
  end
  
  defp build_url(bucket, key, config) do
    case Keyword.get(config, :public_url) do
      nil ->
        region = Keyword.get(config, :region, "us-east-1")
        "https://#{bucket}.s3.#{region}.amazonaws.com/#{key}"
      
      public_url ->
        "#{String.trim_trailing(public_url, "/")}/#{key}"
    end
  end
  
  defp extract_key(url_or_key, config) do
    public_url = Keyword.get(config, :public_url, "")
    
    cond do
      String.starts_with?(url_or_key, "https://") or String.starts_with?(url_or_key, "http://") ->
        # Extract key from URL
        uri = URI.parse(url_or_key)
        String.trim_leading(uri.path, "/")
      
      String.starts_with?(url_or_key, public_url) ->
        String.replace_prefix(url_or_key, public_url <> "/", "")
      
      true ->
        url_or_key
    end
  end
end
