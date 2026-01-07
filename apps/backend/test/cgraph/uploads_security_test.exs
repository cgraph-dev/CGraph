defmodule Cgraph.UploadsSecurityTest do
  @moduledoc """
  Tests for upload security features including magic byte validation.
  """
  use Cgraph.DataCase, async: true

  alias Cgraph.Uploads

  describe "validate_mime_type/3" do
    test "accepts valid JPEG file" do
      # Create a temp file with JPEG magic bytes
      path = create_temp_file(<<0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, "JFIF">>)
      
      assert :ok = Uploads.validate_mime_type(path, "image/jpeg", false)
      
      File.rm!(path)
    end

    test "accepts valid PNG file" do
      # PNG magic bytes
      path = create_temp_file(<<0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A>>)
      
      assert :ok = Uploads.validate_mime_type(path, "image/png", false)
      
      File.rm!(path)
    end

    test "accepts valid GIF file (GIF87a)" do
      path = create_temp_file(<<0x47, 0x49, 0x46, 0x38, 0x37, 0x61>>)
      
      assert :ok = Uploads.validate_mime_type(path, "image/gif", false)
      
      File.rm!(path)
    end

    test "accepts valid GIF file (GIF89a)" do
      path = create_temp_file(<<0x47, 0x49, 0x46, 0x38, 0x39, 0x61>>)
      
      assert :ok = Uploads.validate_mime_type(path, "image/gif", false)
      
      File.rm!(path)
    end

    test "accepts valid PDF file" do
      path = create_temp_file(<<0x25, 0x50, 0x44, 0x46, "-1.4">>)
      
      assert :ok = Uploads.validate_mime_type(path, "application/pdf", false)
      
      File.rm!(path)
    end

    test "rejects JPEG with PNG magic bytes" do
      # File claims to be JPEG but has PNG magic bytes
      path = create_temp_file(<<0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A>>)
      
      assert {:error, :invalid_file_type} = Uploads.validate_mime_type(path, "image/jpeg", false)
      
      File.rm!(path)
    end

    test "rejects file with PHP script content claiming to be image" do
      # Attacker tries to upload PHP script as JPEG
      path = create_temp_file("<?php echo 'hacked'; ?>")
      
      assert {:error, :invalid_file_type} = Uploads.validate_mime_type(path, "image/jpeg", false)
      
      File.rm!(path)
    end

    test "rejects HTML file claiming to be image" do
      path = create_temp_file("<html><script>alert('xss')</script></html>")
      
      assert {:error, :invalid_file_type} = Uploads.validate_mime_type(path, "image/png", false)
      
      File.rm!(path)
    end

    test "accepts text/plain without magic byte check" do
      path = create_temp_file("Hello, world!")
      
      assert :ok = Uploads.validate_mime_type(path, "text/plain", false)
      
      File.rm!(path)
    end

    test "skips validation when skip flag is true" do
      path = create_temp_file("anything")
      
      assert :ok = Uploads.validate_mime_type(path, "image/jpeg", true)
      
      File.rm!(path)
    end

    test "rejects unknown MIME types" do
      path = create_temp_file("some content")
      
      assert {:error, :invalid_file_type} = Uploads.validate_mime_type(path, "application/x-malware", false)
      
      File.rm!(path)
    end

    test "accepts valid MP3 with ID3 header" do
      # ID3 tag header
      path = create_temp_file(<<0x49, 0x44, 0x33, 0x04, 0x00>>)
      
      assert :ok = Uploads.validate_mime_type(path, "audio/mpeg", false)
      
      File.rm!(path)
    end

    test "accepts valid WebM file" do
      # EBML/Matroska magic bytes
      path = create_temp_file(<<0x1A, 0x45, 0xDF, 0xA3>>)
      
      assert :ok = Uploads.validate_mime_type(path, "video/webm", false)
      
      File.rm!(path)
    end
  end

  # Helper to create temporary files for testing
  defp create_temp_file(content) do
    path = Path.join(System.tmp_dir!(), "test_upload_#{:rand.uniform(1_000_000)}")
    File.write!(path, content)
    path
  end
end
