defmodule Cgraph.StorageTest do
  use Cgraph.DataCase, async: true
  
  alias Cgraph.Storage
  
  describe "store/4" do
    setup do
      # Create a temporary test file
      content = "This is test content for storage tests"
      path = Path.join(System.tmp_dir!(), "test_upload_#{System.unique_integer([:positive])}.txt")
      File.write!(path, content)
      
      on_exit(fn -> File.rm(path) end)
      
      {:ok, path: path, content: content}
    end
    
    test "stores file to local storage", %{path: path} do
      upload = %{path: path, filename: "test.txt", content_type: "text/plain"}
      
      {:ok, result} = Storage.store(upload, "test_user", "uploads")
      
      assert result.url
      assert result.path
      assert result.size > 0
    end
    
    test "generates unique filename", %{path: path} do
      upload = %{path: path, filename: "test.txt", content_type: "text/plain"}
      
      {:ok, result1} = Storage.store(upload, "test_user", "uploads")
      {:ok, result2} = Storage.store(upload, "test_user", "uploads")
      
      refute result1.path == result2.path
    end
    
    test "preserves file extension", %{path: path} do
      upload = %{path: path, filename: "document.txt", content_type: "text/plain"}
      
      {:ok, result} = Storage.store(upload, "test_user", "uploads")
      
      assert String.ends_with?(result.path, ".txt")
    end
  end
  
  describe "get_url/2" do
    test "returns URL for stored file" do
      path = "uploads/test_user/abc123.txt"
      
      url = Storage.get_url(path)
      
      assert is_binary(url)
      assert String.contains?(url, "abc123.txt")
    end
    
    test "handles different backends" do
      path = "uploads/test_user/abc123.txt"
      
      # Local storage URL
      url = Storage.get_url(path, :local)
      assert is_binary(url)
    end
  end
  
  describe "get_presigned_url/3" do
    test "generates presigned URL with expiry" do
      path = "uploads/test_user/abc123.txt"
      
      {:ok, url} = Storage.get_presigned_url(path, 3600)
      
      assert is_binary(url)
    end
    
    test "respects custom expiry time" do
      path = "uploads/test_user/abc123.txt"
      
      {:ok, url1} = Storage.get_presigned_url(path, 60)
      {:ok, url2} = Storage.get_presigned_url(path, 3600)
      
      # Both should be valid URLs
      assert is_binary(url1)
      assert is_binary(url2)
    end
  end
  
  describe "delete/2" do
    setup do
      content = "Delete test content"
      path = Path.join(System.tmp_dir!(), "delete_test_#{System.unique_integer([:positive])}.txt")
      File.write!(path, content)
      
      upload = %{path: path, filename: "delete_test.txt", content_type: "text/plain"}
      {:ok, result} = Storage.store(upload, "test_user", "uploads")
      
      on_exit(fn -> File.rm(path) end)
      
      {:ok, stored_path: result.path}
    end
    
    test "deletes stored file", %{stored_path: stored_path} do
      assert :ok = Storage.delete(stored_path)
    end
    
    test "returns ok for non-existent file" do
      # Should not error for missing files
      assert :ok = Storage.delete("non_existent/path/file.txt")
    end
  end
  
  describe "list/2" do
    test "lists files in directory" do
      {:ok, files} = Storage.list("uploads")
      
      assert is_list(files)
    end
    
    test "returns empty list for non-existent directory" do
      {:ok, files} = Storage.list("non_existent_dir_#{System.unique_integer([:positive])}")
      
      assert files == []
    end
  end
  
  describe "backend configuration" do
    test "defaults to local storage" do
      backend = Storage.current_backend()
      
      assert backend == Cgraph.Storage.Local
    end
    
    test "supports S3 backend configuration" do
      assert Code.ensure_loaded?(Cgraph.Storage.S3)
    end
    
    test "supports R2 backend configuration" do
      assert Code.ensure_loaded?(Cgraph.Storage.R2)
    end
  end
  
  describe "content type detection" do
    test "detects common audio types" do
      assert Storage.detect_content_type("voice.webm") == "audio/webm"
      assert Storage.detect_content_type("voice.ogg") == "audio/ogg"
      assert Storage.detect_content_type("voice.mp3") == "audio/mpeg"
      assert Storage.detect_content_type("voice.m4a") == "audio/mp4"
    end
    
    test "detects common image types" do
      assert Storage.detect_content_type("photo.jpg") == "image/jpeg"
      assert Storage.detect_content_type("photo.png") == "image/png"
      assert Storage.detect_content_type("photo.gif") == "image/gif"
      assert Storage.detect_content_type("photo.webp") == "image/webp"
    end
    
    test "returns default for unknown types" do
      content_type = Storage.detect_content_type("file.unknown")
      
      assert content_type == "application/octet-stream"
    end
  end
  
  describe "file validation" do
    test "validates file exists" do
      assert {:error, :not_found} = Storage.validate_file("/non/existent/path")
    end
    
    test "validates file size within limits" do
      path = Path.join(System.tmp_dir!(), "size_test.txt")
      File.write!(path, "small content")
      
      on_exit(fn -> File.rm(path) end)
      
      assert :ok = Storage.validate_file(path, max_size: 1_000_000)
    end
    
    test "rejects oversized files" do
      path = Path.join(System.tmp_dir!(), "size_test.txt")
      File.write!(path, String.duplicate("x", 1000))
      
      on_exit(fn -> File.rm(path) end)
      
      assert {:error, :file_too_large} = Storage.validate_file(path, max_size: 100)
    end
  end
end
