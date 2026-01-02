defmodule Cgraph.Storage.R2 do
  @moduledoc """
  Cloudflare R2 storage backend.
  
  R2 is S3-compatible but with some differences in configuration.
  This module provides optimized support for R2's features.
  
  ## Configuration
  
      config :cgraph, :storage,
        backend: :r2,
        bucket: "cgraph-uploads",
        account_id: System.get_env("CF_ACCOUNT_ID"),
        access_key_id: System.get_env("R2_ACCESS_KEY_ID"),
        secret_access_key: System.get_env("R2_SECRET_ACCESS_KEY"),
        public_url: System.get_env("R2_PUBLIC_URL")  # Custom domain or R2.dev URL
  
  ## Features
  
  - Zero egress fees
  - S3-compatible API
  - Automatic replication across Cloudflare's network
  - Integration with Cloudflare CDN
  
  ## Dependencies
  
  Same as S3 backend:
  
      {:ex_aws, "~> 2.5"},
      {:ex_aws_s3, "~> 2.5"},
      {:hackney, "~> 1.18"}
  """
  
  @behaviour Cgraph.Storage
  
  require Logger
  
  @impl true
  def store(source_path, filename, opts \\ []) do
    context = Keyword.get(opts, :context, "files")
    content_type = Keyword.get(opts, :content_type, MIME.from_path(filename))
    
    config = config()
    bucket = Keyword.fetch!(config, :bucket)
    
    # Generate object key with optional prefix for organization
    key = Path.join([context, filename])
    
    case File.read(source_path) do
      {:ok, content} ->
        upload_to_r2(bucket, key, content, content_type, config)
      
      {:error, reason} ->
        {:error, {:file_read_failed, reason}}
    end
  end
  
  defp upload_to_r2(bucket, key, content, content_type, config) do
    opts = [
      content_type: content_type,
      # R2 doesn't support ACLs - use public bucket or signed URLs
      cache_control: "public, max-age=31536000, immutable"
    ]
    
    request = ExAws.S3.put_object(bucket, key, content, opts)
    
    case ExAws.request(request, ex_aws_config(config)) do
      {:ok, _} ->
        url = build_url(key, config)
        
        {:ok, %{
          key: key,
          url: url,
          path: key,
          size: byte_size(content)
        }}
      
      {:error, reason} ->
        Logger.error("R2 upload failed: #{inspect(reason)}")
        {:error, {:r2_upload_failed, reason}}
    end
  end
  
  @impl true
  def delete(url_or_key) do
    config = config()
    bucket = Keyword.fetch!(config, :bucket)
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
  
  @doc """
  Generate a presigned upload URL for direct client uploads.
  
  This allows clients to upload directly to R2 without going through the server,
  reducing bandwidth costs and improving upload speed.
  """
  def presigned_upload_url(key, opts \\ []) do
    config = config()
    bucket = Keyword.fetch!(config, :bucket)
    expires_in = Keyword.get(opts, :expires_in, 3600)
    content_type = Keyword.get(opts, :content_type, "application/octet-stream")
    
    {:ok, url} = ExAws.S3.presigned_url(
      ex_aws_config(config),
      :put,
      bucket,
      key,
      expires_in: expires_in,
      query_params: [{"Content-Type", content_type}]
    )
    
    {:ok, %{
      upload_url: url,
      key: key,
      public_url: build_url(key, config)
    }}
  end
  
  defp config do
    Application.get_env(:cgraph, :storage, [])
  end
  
  defp ex_aws_config(config) do
    account_id = Keyword.fetch!(config, :account_id)
    
    [
      access_key_id: Keyword.fetch!(config, :access_key_id),
      secret_access_key: Keyword.fetch!(config, :secret_access_key),
      # R2 endpoint format
      host: "#{account_id}.r2.cloudflarestorage.com",
      region: "auto",  # R2 uses "auto" for region
      scheme: "https://",
      # Required for S3v4 signing
      s3: [
        scheme: "https://",
        host: "#{account_id}.r2.cloudflarestorage.com",
        region: "auto"
      ]
    ]
  end
  
  defp build_url(key, config) do
    case Keyword.get(config, :public_url) do
      nil ->
        # Fallback to signed URL if no public URL configured
        {:ok, url} = signed_url(key, expires_in: 86400)
        url
      
      public_url ->
        "#{String.trim_trailing(public_url, "/")}/#{key}"
    end
  end
  
  defp extract_key(url_or_key, config) do
    public_url = Keyword.get(config, :public_url, "")
    
    cond do
      String.starts_with?(url_or_key, "https://") or String.starts_with?(url_or_key, "http://") ->
        uri = URI.parse(url_or_key)
        String.trim_leading(uri.path, "/")
      
      public_url != "" and String.starts_with?(url_or_key, public_url) ->
        String.replace_prefix(url_or_key, public_url <> "/", "")
      
      true ->
        url_or_key
    end
  end
end
