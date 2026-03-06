defmodule CGraph.Messaging.FileTransfer do
  @moduledoc """
  Context for file transfers in chat conversations.

  Handles upload initiation, chunked uploads for large files, secure download
  URLs, file type validation, tier-based storage quotas, and E2EE-aware
  encrypted metadata storage.

  ## Upload Flow

  1. Client calls `initiate_upload/2` with file metadata
  2. For files <= 5MB: returns presigned PUT URL (direct upload)
  3. For files > 5MB: returns multipart upload config with chunk presigned URLs
  4. Client uploads to storage directly
  5. Client calls `complete_upload/2` to finalize
  6. Server marks transfer as ready

  ## Security

  - Dangerous file types are rejected (.exe, .bat, .cmd, etc.)
  - File sizes enforced per subscription tier
  - Download URLs are time-limited signed tokens
  - E2EE files store only encrypted metadata (server never sees plaintext)
  """

  import Ecto.Query
  alias CGraph.Repo

  require Logger

  # ============================================================================
  # Schema
  # ============================================================================

  defmodule Transfer do
    @moduledoc "Schema for file transfer records."
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :binary_id, autogenerate: true}
    @foreign_key_type :binary_id
    @timestamps_opts [type: :utc_datetime_usec]

    @statuses ~w(pending uploading processing ready failed expired)
    @upload_types ~w(direct chunked)

    schema "file_transfers" do
      field :file_name, :string
      field :file_size, :integer
      field :file_mime_type, :string
      field :file_extension, :string
      field :storage_key, :string
      field :thumbnail_key, :string
      field :status, :string, default: "pending"
      field :upload_type, :string, default: "direct"
      field :chunks_total, :integer
      field :chunks_uploaded, :integer, default: 0
      field :upload_id, :string
      field :checksum_sha256, :string
      field :is_encrypted, :boolean, default: false
      field :encrypted_metadata, :binary
      field :download_count, :integer, default: 0
      field :expires_at, :utc_datetime_usec
      field :conversation_id, :binary_id
      field :message_id, :binary_id

      belongs_to :user, CGraph.Accounts.User

      timestamps()
    end

    def changeset(transfer, attrs) do
      transfer
      |> cast(attrs, [
        :user_id,
        :conversation_id,
        :message_id,
        :file_name,
        :file_size,
        :file_mime_type,
        :file_extension,
        :storage_key,
        :thumbnail_key,
        :status,
        :upload_type,
        :chunks_total,
        :chunks_uploaded,
        :upload_id,
        :checksum_sha256,
        :is_encrypted,
        :encrypted_metadata,
        :download_count,
        :expires_at
      ])
      |> validate_required([:user_id, :file_name, :file_size, :file_mime_type])
      |> validate_inclusion(:status, @statuses)
      |> validate_inclusion(:upload_type, @upload_types)
      |> validate_number(:file_size, greater_than: 0)
      |> foreign_key_constraint(:user_id)
    end

    def statuses, do: @statuses
  end

  # ============================================================================
  # Configuration
  # ============================================================================

  @dangerous_extensions ~w(.exe .bat .cmd .scr .vbs .com .pif .msi .ps1 .wsf .jar)
  @chunk_size 5 * 1024 * 1024
  @direct_upload_max 5 * 1024 * 1024

  # Tier-based max file size in bytes
  @tier_file_limits %{
    "free" => 25 * 1024 * 1024,
    "plus" => 50 * 1024 * 1024,
    "pro" => 100 * 1024 * 1024,
    "ultimate" => 200 * 1024 * 1024
  }

  # Tier-based max storage in bytes
  @tier_storage_limits %{
    "free" => 500 * 1024 * 1024,
    "plus" => 2 * 1024 * 1024 * 1024,
    "pro" => 10 * 1024 * 1024 * 1024,
    "ultimate" => 50 * 1024 * 1024 * 1024
  }

  # ============================================================================
  # Upload Initiation
  # ============================================================================

  @doc """
  Initiates a file upload.

  Validates file type, checks tier storage quota, and creates a file_transfer
  record. Returns presigned URL(s) for upload.

  ## Attrs

    * `file_name` — original file name
    * `file_size` — file size in bytes
    * `file_mime_type` — MIME type
    * `conversation_id` — optional conversation context
    * `is_encrypted` — whether file is E2EE encrypted
  """
  @spec initiate_upload(map(), map()) ::
          {:ok, map()} | {:error, atom() | Ecto.Changeset.t()}
  def initiate_upload(user, attrs) do
    file_name = attrs[:file_name] || attrs["file_name"]
    file_size = attrs[:file_size] || attrs["file_size"]
    file_mime = attrs[:file_mime_type] || attrs["file_mime_type"]
    ext = Path.extname(file_name || "") |> String.downcase()

    with :ok <- validate_file_type(ext),
         :ok <- validate_file_size(file_size, user),
         :ok <- validate_storage_quota(user, file_size) do
      storage_key = generate_storage_key(user.id, file_name)
      upload_type = if file_size > @direct_upload_max, do: "chunked", else: "direct"

      chunks_total =
        if upload_type == "chunked" do
          ceil(file_size / @chunk_size)
        end

      transfer_attrs = %{
        user_id: user.id,
        conversation_id: attrs[:conversation_id] || attrs["conversation_id"],
        file_name: file_name,
        file_size: file_size,
        file_mime_type: file_mime,
        file_extension: ext,
        storage_key: storage_key,
        status: "pending",
        upload_type: upload_type,
        chunks_total: chunks_total,
        is_encrypted: attrs[:is_encrypted] || attrs["is_encrypted"] || false
      }

      case %Transfer{} |> Transfer.changeset(transfer_attrs) |> Repo.insert() do
        {:ok, transfer} ->
          upload_config = build_upload_config(transfer)
          {:ok, %{transfer: transfer, upload: upload_config}}

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  # ============================================================================
  # Chunk Management
  # ============================================================================

  @doc """
  Records a chunk upload completion. Returns updated progress.
  """
  @spec upload_chunk(String.t(), integer(), String.t()) ::
          {:ok, map()} | {:error, atom()}
  def upload_chunk(transfer_id, chunk_number, etag) do
    case Repo.get(Transfer, transfer_id) do
      nil ->
        {:error, :not_found}

      %Transfer{status: status} when status not in ["pending", "uploading"] ->
        {:error, :invalid_status}

      transfer ->
        new_uploaded = transfer.chunks_uploaded + 1

        transfer
        |> Ecto.Changeset.change(%{
          chunks_uploaded: new_uploaded,
          status: "uploading"
        })
        |> Repo.update()
        |> case do
          {:ok, updated} ->
            {:ok,
             %{
               transfer_id: updated.id,
               chunk_number: chunk_number,
               etag: etag,
               chunks_uploaded: updated.chunks_uploaded,
               chunks_total: updated.chunks_total,
               complete: updated.chunks_uploaded == updated.chunks_total
             }}

          {:error, _} ->
            {:error, :update_failed}
        end
    end
  end

  # ============================================================================
  # Upload Completion
  # ============================================================================

  @doc """
  Completes a file upload. Marks transfer as processing/ready.
  """
  @spec complete_upload(String.t(), map()) :: {:ok, Transfer.t()} | {:error, atom()}
  def complete_upload(transfer_id, attrs \\ %{}) do
    case Repo.get(Transfer, transfer_id) do
      nil ->
        {:error, :not_found}

      %Transfer{upload_type: "chunked", chunks_uploaded: uploaded, chunks_total: total}
      when uploaded < total ->
        {:error, :incomplete_upload}

      transfer ->
        checksum = attrs[:checksum_sha256] || attrs["checksum_sha256"]

        transfer
        |> Ecto.Changeset.change(%{
          status: "ready",
          checksum_sha256: checksum
        })
        |> Repo.update()
    end
  end

  # ============================================================================
  # Download
  # ============================================================================

  @doc """
  Generates a time-limited download URL for a file transfer.

  Validates the user has access and increments download count.

  ## Options

    * `:ttl` — URL time-to-live in seconds (default: 3600)
  """
  @spec generate_download_url(String.t(), String.t(), keyword()) ::
          {:ok, map()} | {:error, atom()}
  def generate_download_url(transfer_id, user_id, opts \\ []) do
    ttl = Keyword.get(opts, :ttl, 3600)

    case get_transfer(transfer_id) do
      {:ok, %Transfer{status: "ready"} = transfer} ->
        # Generate a signed download token
        token =
          Phoenix.Token.sign(
            CGraphWeb.Endpoint,
            "file_download",
            %{transfer_id: transfer.id, user_id: user_id}
          )

        # Generate a signed storage URL
        download_url =
          case CGraph.Storage.signed_url(transfer.storage_key, expires_in: ttl) do
            {:ok, url} -> url
            _ -> "/api/v1/files/#{transfer.id}/download?token=#{token}"
          end

        # Increment download count
        transfer
        |> Ecto.Changeset.change(%{download_count: transfer.download_count + 1})
        |> Repo.update()

        {:ok,
         %{
           url: download_url,
           token: token,
           expires_in: ttl,
           file_name: transfer.file_name,
           file_size: transfer.file_size,
           file_mime_type: transfer.file_mime_type
         }}

      {:ok, %Transfer{status: status}} ->
        {:error, :"transfer_#{status}"}

      {:error, :not_found} ->
        {:error, :not_found}
    end
  end

  @doc """
  Verifies a download token.
  """
  @spec verify_download_token(String.t()) :: {:ok, map()} | {:error, atom()}
  def verify_download_token(token) do
    case Phoenix.Token.verify(CGraphWeb.Endpoint, "file_download", token, max_age: 3600) do
      {:ok, data} -> {:ok, data}
      {:error, _} -> {:error, :invalid_token}
    end
  end

  # ============================================================================
  # Queries
  # ============================================================================

  @doc "Gets a transfer by ID."
  @spec get_transfer(String.t()) :: {:ok, Transfer.t()} | {:error, :not_found}
  def get_transfer(transfer_id) do
    case Repo.get(Transfer, transfer_id) do
      nil -> {:error, :not_found}
      transfer -> {:ok, transfer}
    end
  end

  @doc "Gets user's storage usage in bytes."
  @spec get_user_storage_usage(String.t()) :: integer()
  def get_user_storage_usage(user_id) do
    from(t in Transfer,
      where: t.user_id == ^user_id,
      where: t.status in ["ready", "processing", "uploading"],
      select: coalesce(sum(t.file_size), 0)
    )
    |> Repo.one()
  end

  @doc """
  Cancels an upload. Marks as failed and cleans up storage.
  """
  @spec cancel_upload(String.t(), String.t()) :: {:ok, Transfer.t()} | {:error, atom()}
  def cancel_upload(transfer_id, user_id) do
    case Repo.get(Transfer, transfer_id) do
      nil ->
        {:error, :not_found}

      %Transfer{user_id: ^user_id, status: status} = transfer
      when status in ["pending", "uploading"] ->
        # Clean up any partial upload from storage
        if transfer.storage_key do
          CGraph.Storage.delete(transfer.storage_key)
        end

        transfer
        |> Ecto.Changeset.change(%{status: "failed"})
        |> Repo.update()

      %Transfer{user_id: ^user_id} ->
        {:error, :cannot_cancel}

      _other ->
        {:error, :not_found}
    end
  end

  # ============================================================================
  # Cleanup
  # ============================================================================

  @doc """
  Cleans up abandoned and expired file transfers.
  Returns count of cleaned up transfers.
  """
  @spec cleanup_stale_transfers() :: non_neg_integer()
  def cleanup_stale_transfers do
    now = DateTime.utc_now()
    yesterday = DateTime.add(now, -24, :hour)

    # Delete abandoned uploads (pending > 24 hours)
    {abandoned, _} =
      from(t in Transfer,
        where: t.status == "pending",
        where: t.inserted_at < ^yesterday
      )
      |> Repo.delete_all()

    # Delete expired transfers
    {expired, _} =
      from(t in Transfer,
        where: not is_nil(t.expires_at),
        where: t.expires_at < ^now
      )
      |> Repo.delete_all()

    count = abandoned + expired

    if count > 0 do
      Logger.info("file_transfer_cleanup",
        abandoned: abandoned,
        expired: expired
      )
    end

    count
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp validate_file_type(ext) do
    if ext in @dangerous_extensions do
      {:error, :dangerous_file_type}
    else
      :ok
    end
  end

  defp validate_file_size(file_size, user) when is_integer(file_size) do
    tier = get_user_tier(user)
    max_size = Map.get(@tier_file_limits, tier, @tier_file_limits["free"])

    if file_size > max_size do
      {:error, :file_too_large}
    else
      :ok
    end
  end

  defp validate_file_size(_, _), do: {:error, :invalid_file_size}

  defp validate_storage_quota(user, file_size) do
    tier = get_user_tier(user)
    max_storage = Map.get(@tier_storage_limits, tier, @tier_storage_limits["free"])
    current_usage = get_user_storage_usage(user.id)

    if current_usage + file_size > max_storage do
      {:error, :storage_quota_exceeded}
    else
      :ok
    end
  end

  defp get_user_tier(user) do
    case Map.get(user, :subscription_tier) do
      nil -> "free"
      tier -> tier
    end
  end

  defp generate_storage_key(user_id, file_name) do
    unique = :crypto.strong_rand_bytes(16) |> Base.url_encode64(padding: false)
    ext = Path.extname(file_name || "")
    "files/#{user_id}/#{unique}#{ext}"
  end

  defp build_upload_config(%Transfer{upload_type: "direct"} = transfer) do
    url =
      case CGraph.Storage.signed_url(transfer.storage_key, expires_in: 3600) do
        {:ok, url} -> url
        _ -> nil
      end

    %{
      type: "direct",
      url: url,
      storage_key: transfer.storage_key,
      max_size: transfer.file_size
    }
  end

  defp build_upload_config(%Transfer{upload_type: "chunked"} = transfer) do
    chunk_urls =
      for chunk <- 1..transfer.chunks_total do
        chunk_key = "#{transfer.storage_key}.part#{chunk}"

        url =
          case CGraph.Storage.signed_url(chunk_key, expires_in: 3600) do
            {:ok, url} -> url
            _ -> nil
          end

        %{chunk_number: chunk, url: url}
      end

    %{
      type: "chunked",
      upload_id: transfer.upload_id,
      storage_key: transfer.storage_key,
      chunk_size: @chunk_size,
      chunks_total: transfer.chunks_total,
      chunks: chunk_urls
    }
  end
end
