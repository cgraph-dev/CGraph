defmodule CGraph.Messaging.FileTransferTest do
  @moduledoc "Tests for the file transfer context."
  use CGraph.DataCase, async: true
  import CGraph.Factory

  alias CGraph.Messaging.FileTransfer

  # ============================================================================
  # Upload Initiation
  # ============================================================================

  describe "initiate_upload/2" do
    test "creates a direct upload for small files" do
      user = insert(:user)

      assert {:ok, %{transfer: transfer, upload: config}} =
               FileTransfer.initiate_upload(user, %{
                 file_name: "photo.jpg",
                 file_size: 1_000_000,
                 file_mime_type: "image/jpeg"
               })

      assert transfer.status == "pending"
      assert transfer.upload_type == "direct"
      assert transfer.file_name == "photo.jpg"
      assert transfer.file_size == 1_000_000
      assert transfer.user_id == user.id
      assert config.type == "direct"
    end

    test "creates a chunked upload for large files" do
      user = insert(:user)

      assert {:ok, %{transfer: transfer, upload: config}} =
               FileTransfer.initiate_upload(user, %{
                 file_name: "video.mp4",
                 file_size: 20_000_000,
                 file_mime_type: "video/mp4"
               })

      assert transfer.upload_type == "chunked"
      assert transfer.chunks_total > 0
      assert config.type == "chunked"
      assert config.chunks_total == transfer.chunks_total
    end

    test "rejects dangerous file types" do
      user = insert(:user)

      for ext <- ~w(.exe .bat .cmd .scr .vbs .ps1) do
        assert {:error, :dangerous_file_type} =
                 FileTransfer.initiate_upload(user, %{
                   file_name: "malware#{ext}",
                   file_size: 1000,
                   file_mime_type: "application/octet-stream"
                 })
      end
    end

    test "rejects files too large for tier" do
      user = insert(:user)

      # Free tier max is 25MB
      assert {:error, :file_too_large} =
               FileTransfer.initiate_upload(user, %{
                 file_name: "huge.zip",
                 file_size: 30_000_000,
                 file_mime_type: "application/zip"
               })
    end

    test "stores encrypted metadata flag" do
      user = insert(:user)

      assert {:ok, %{transfer: transfer}} =
               FileTransfer.initiate_upload(user, %{
                 file_name: "secret.pdf",
                 file_size: 5000,
                 file_mime_type: "application/pdf",
                 is_encrypted: true
               })

      assert transfer.is_encrypted == true
    end

    test "rejects invalid file size" do
      user = insert(:user)

      assert {:error, :invalid_file_size} =
               FileTransfer.initiate_upload(user, %{
                 file_name: "test.txt",
                 file_size: "not_a_number",
                 file_mime_type: "text/plain"
               })
    end
  end

  # ============================================================================
  # Chunk Management
  # ============================================================================

  describe "upload_chunk/3" do
    test "records chunk upload and returns progress" do
      user = insert(:user)

      {:ok, %{transfer: transfer}} =
        FileTransfer.initiate_upload(user, %{
          file_name: "big.zip",
          file_size: 20_000_000,
          file_mime_type: "application/zip"
        })

      assert {:ok, progress} = FileTransfer.upload_chunk(transfer.id, 1, "etag_1")

      assert progress.chunk_number == 1
      assert progress.chunks_uploaded == 1
      assert progress.chunks_total == transfer.chunks_total
    end

    test "returns :not_found for nonexistent transfer" do
      assert {:error, :not_found} =
               FileTransfer.upload_chunk(Ecto.UUID.generate(), 1, "etag")
    end

    test "rejects chunks for completed transfers" do
      transfer = insert(:file_transfer, status: "ready")

      assert {:error, :invalid_status} =
               FileTransfer.upload_chunk(transfer.id, 1, "etag")
    end
  end

  # ============================================================================
  # Upload Completion
  # ============================================================================

  describe "complete_upload/2" do
    test "marks transfer as ready" do
      transfer = insert(:file_transfer, status: "uploading")

      assert {:ok, completed} = FileTransfer.complete_upload(transfer.id)
      assert completed.status == "ready"
    end

    test "stores checksum" do
      transfer = insert(:file_transfer, status: "uploading")

      assert {:ok, completed} =
               FileTransfer.complete_upload(transfer.id, %{
                 checksum_sha256: "abc123"
               })

      assert completed.checksum_sha256 == "abc123"
    end

    test "rejects incomplete chunked upload" do
      transfer =
        insert(:file_transfer,
          status: "uploading",
          upload_type: "chunked",
          chunks_total: 5,
          chunks_uploaded: 3
        )

      assert {:error, :incomplete_upload} = FileTransfer.complete_upload(transfer.id)
    end

    test "returns :not_found for nonexistent transfer" do
      assert {:error, :not_found} = FileTransfer.complete_upload(Ecto.UUID.generate())
    end
  end

  # ============================================================================
  # Download
  # ============================================================================

  describe "generate_download_url/3" do
    test "generates download URL for ready transfer" do
      transfer = insert(:file_transfer, status: "ready")
      user = insert(:user)

      assert {:ok, download} =
               FileTransfer.generate_download_url(transfer.id, user.id)

      assert download.file_name == transfer.file_name
      assert download.file_size == transfer.file_size
      assert download.expires_in == 3600
    end

    test "rejects downloads for non-ready transfers" do
      transfer = insert(:file_transfer, status: "uploading")
      user = insert(:user)

      assert {:error, _} =
               FileTransfer.generate_download_url(transfer.id, user.id)
    end

    test "increments download count" do
      transfer = insert(:file_transfer, status: "ready", download_count: 0)
      user = insert(:user)

      {:ok, _} = FileTransfer.generate_download_url(transfer.id, user.id)

      {:ok, updated} = FileTransfer.get_transfer(transfer.id)
      assert updated.download_count == 1
    end
  end

  # ============================================================================
  # Queries
  # ============================================================================

  describe "get_transfer/1" do
    test "returns transfer by ID" do
      transfer = insert(:file_transfer)
      assert {:ok, fetched} = FileTransfer.get_transfer(transfer.id)
      assert fetched.id == transfer.id
    end

    test "returns :not_found for nonexistent" do
      assert {:error, :not_found} = FileTransfer.get_transfer(Ecto.UUID.generate())
    end
  end

  describe "get_user_storage_usage/1" do
    test "sums file sizes for user's active transfers" do
      user = insert(:user)
      insert(:file_transfer, user: user, file_size: 1000, status: "ready")
      insert(:file_transfer, user: user, file_size: 2000, status: "ready")
      insert(:file_transfer, user: user, file_size: 500, status: "failed")

      usage = FileTransfer.get_user_storage_usage(user.id)
      assert usage == 3000
    end

    test "returns 0 for user with no transfers" do
      user = insert(:user)
      assert FileTransfer.get_user_storage_usage(user.id) == 0
    end
  end

  # ============================================================================
  # Cancel
  # ============================================================================

  describe "cancel_upload/2" do
    test "cancels a pending upload" do
      user = insert(:user)
      transfer = insert(:file_transfer, user: user, status: "pending")

      assert {:ok, cancelled} = FileTransfer.cancel_upload(transfer.id, user.id)
      assert cancelled.status == "failed"
    end

    test "rejects cancel for completed uploads" do
      user = insert(:user)
      transfer = insert(:file_transfer, user: user, status: "ready")

      assert {:error, :cannot_cancel} = FileTransfer.cancel_upload(transfer.id, user.id)
    end

    test "returns :not_found for other user's transfer" do
      user = insert(:user)
      other = insert(:user)
      transfer = insert(:file_transfer, user: other, status: "pending")

      assert {:error, :not_found} = FileTransfer.cancel_upload(transfer.id, user.id)
    end
  end

  # ============================================================================
  # Cleanup
  # ============================================================================

  describe "cleanup_stale_transfers/0" do
    test "deletes abandoned pending transfers" do
      old_time = DateTime.utc_now() |> DateTime.add(-25, :hour) |> DateTime.truncate(:microsecond)

      insert(:file_transfer,
        status: "pending",
        inserted_at: old_time,
        updated_at: old_time
      )

      count = FileTransfer.cleanup_stale_transfers()
      assert count >= 1
    end

    test "deletes expired transfers" do
      past = DateTime.utc_now() |> DateTime.add(-1, :hour) |> DateTime.truncate(:microsecond)
      insert(:file_transfer, status: "ready", expires_at: past)

      count = FileTransfer.cleanup_stale_transfers()
      assert count >= 1
    end

    test "does not delete active non-expired transfers" do
      insert(:file_transfer, status: "ready")

      count = FileTransfer.cleanup_stale_transfers()
      assert count == 0
    end
  end
end
