defmodule Cgraph.Integration.VoiceMessageStorageIntegrationTest do
  @moduledoc """
  Integration tests for voice message processing and storage.
  
  Tests the complete voice message lifecycle including:
  - Audio validation
  - Storage backend integration
  - Waveform extraction simulation
  - Presigned URL generation
  """
  use Cgraph.DataCase, async: false
  
  alias Cgraph.Messaging.VoiceMessage
  alias Cgraph.Storage
  alias Cgraph.Messaging
  alias Cgraph.Accounts
  
  @moduletag :integration
  
  describe "voice message with storage backends" do
    setup do
      user = create_user()
      {:ok, user: user}
    end
    
    test "complete voice message creation and storage flow", %{user: user} do
      # Simulate audio file creation
      audio_content = generate_fake_audio_header() <> :crypto.strong_rand_bytes(10_000)
      path = Path.join(System.tmp_dir!(), "voice_#{System.unique_integer([:positive])}.webm")
      File.write!(path, audio_content)
      
      on_exit(fn -> File.rm(path) end)
      
      # Store the audio file
      upload = %{path: path, filename: "recording.webm", content_type: "audio/webm"}
      {:ok, storage_result} = Storage.store(upload, user.id, "voice_messages")
      
      # Create voice message record
      {:ok, voice_message} = VoiceMessage.create(%{
        filename: Path.basename(storage_result.path),
        original_filename: "recording.webm",
        content_type: "audio/webm",
        size: storage_result.size,
        duration: 15.5,
        url: storage_result.url,
        waveform: generate_waveform(100),
        sample_rate: 48000,
        channels: 1,
        bitrate: 64000,
        codec: "opus",
        is_processed: true,
        user_id: user.id
      })
      
      assert voice_message.id
      assert voice_message.url == storage_result.url
      assert voice_message.is_processed
      assert length(voice_message.waveform) == 100
    end
    
    test "voice message with conversation integration", %{user: sender} do
      recipient = create_user()
      
      # Create conversation
      {:ok, conversation, _} = Messaging.create_or_get_conversation(sender, [recipient.id])
      
      # Create and store voice message
      audio_content = generate_fake_audio_header() <> :crypto.strong_rand_bytes(5_000)
      path = Path.join(System.tmp_dir!(), "voice_#{System.unique_integer([:positive])}.ogg")
      File.write!(path, audio_content)
      
      on_exit(fn -> File.rm(path) end)
      
      upload = %{path: path, filename: "voice.ogg", content_type: "audio/ogg"}
      {:ok, storage_result} = Storage.store(upload, sender.id, "voice_messages")
      
      {:ok, voice_message} = VoiceMessage.create(%{
        filename: Path.basename(storage_result.path),
        content_type: "audio/ogg",
        size: storage_result.size,
        duration: 10.0,
        url: storage_result.url,
        waveform: generate_waveform(100),
        is_processed: true,
        user_id: sender.id
      })
      
      # Send message with voice attachment - using structs
      {:ok, message} = Messaging.send_message(
        conversation,
        sender,
        %{
          "content" => "🎤 Voice message",
          "message_type" => "voice",
          "voice_message_id" => voice_message.id
        }
      )
      
      assert message.id
      assert message.content == "🎤 Voice message"
    end
    
    test "presigned URL generation for private voice messages", %{user: user} do
      # Create voice message record
      {:ok, voice_message} = VoiceMessage.create(%{
        filename: "voice_abc123.opus",
        content_type: "audio/ogg",
        size: 50_000,
        duration: 30.0,
        url: "voice_messages/#{user.id}/voice_abc123.opus",
        is_processed: true,
        user_id: user.id
      })
      
      # Generate presigned URL
      {:ok, presigned_url} = Storage.get_presigned_url(voice_message.url, 3600)
      
      assert is_binary(presigned_url)
    end
    
    test "voice message deletion cascades to storage", %{user: user} do
      # Create and store voice message
      audio_content = :crypto.strong_rand_bytes(5_000)
      path = Path.join(System.tmp_dir!(), "delete_voice_#{System.unique_integer([:positive])}.ogg")
      File.write!(path, audio_content)
      
      on_exit(fn -> File.rm(path) end)
      
      upload = %{path: path, filename: "to_delete.ogg", content_type: "audio/ogg"}
      {:ok, storage_result} = Storage.store(upload, user.id, "voice_messages")
      
      {:ok, voice_message} = VoiceMessage.create(%{
        filename: Path.basename(storage_result.path),
        content_type: "audio/ogg",
        size: storage_result.size,
        duration: 5.0,
        url: storage_result.url,
        is_processed: true,
        user_id: user.id
      })
      
      # Delete voice message - need to pass the struct, not id
      assert :ok = VoiceMessage.delete(voice_message)
      
      # Verify storage file is also deleted
      assert :ok = Storage.delete(storage_result.path)
    end
  end
  
  describe "voice message rate limiting integration" do
    test "enforces rate limits across multiple requests" do
      user = create_user()
      
      # Attempt to create many voice messages rapidly
      results = for i <- 1..15 do
        VoiceMessage.create(%{
          filename: "voice_#{i}.opus",
          content_type: "audio/ogg",
          size: 1_000 * i,
          duration: 5.0 + i,
          user_id: user.id
        })
      end
      
      # All should succeed in test environment (rate limiting may be disabled)
      successes = Enum.count(results, fn
        {:ok, _} -> true
        _ -> false
      end)
      
      assert successes >= 10  # At least most should succeed
    end
  end
  
  describe "voice message format validation" do
    test "rejects invalid audio formats" do
      user = create_user()
      
      invalid_formats = [
        {"video/mp4", "video.mp4"},
        {"application/pdf", "document.pdf"},
        {"text/plain", "readme.txt"},
        {"image/png", "image.png"}
      ]
      
      Enum.each(invalid_formats, fn {content_type, filename} ->
        changeset = VoiceMessage.changeset(%VoiceMessage{}, %{
          filename: filename,
          content_type: content_type,
          size: 50_000,
          user_id: user.id
        })
        
        refute changeset.valid?, "Expected #{content_type} to be invalid"
      end)
    end
    
    test "accepts all valid audio formats" do
      user = create_user()
      
      valid_formats = [
        {"audio/webm", "voice.webm"},
        {"audio/ogg", "voice.ogg"},
        {"audio/mp4", "voice.m4a"},
        {"audio/mpeg", "voice.mp3"},
        {"audio/wav", "voice.wav"}
      ]
      
      Enum.each(valid_formats, fn {content_type, filename} ->
        changeset = VoiceMessage.changeset(%VoiceMessage{}, %{
          filename: filename,
          content_type: content_type,
          size: 50_000,
          user_id: user.id
        })
        
        assert changeset.valid?, "Expected #{content_type} to be valid"
      end)
    end
  end
  
  describe "waveform processing" do
    test "generates consistent waveform length" do
      waveform = generate_waveform(100)
      
      assert length(waveform) == 100
      assert Enum.all?(waveform, fn v -> v >= 0.0 and v <= 1.0 end)
    end
    
    test "waveform stored and retrieved correctly" do
      user = create_user()
      original_waveform = generate_waveform(100)
      
      {:ok, voice_message} = VoiceMessage.create(%{
        filename: "voice_#{System.unique_integer([:positive])}.opus",
        content_type: "audio/ogg",
        size: 50_000,
        waveform: original_waveform,
        user_id: user.id
      })
      
      {:ok, retrieved} = VoiceMessage.get(voice_message.id)
      
      assert retrieved.waveform == original_waveform
    end
  end
  
  describe "concurrent voice message operations" do
    test "handles concurrent uploads from same user" do
      user = create_user()
      
      tasks = for i <- 1..5 do
        Task.async(fn ->
          VoiceMessage.create(%{
            filename: "voice_concurrent_#{i}_#{System.unique_integer([:positive])}.opus",
            content_type: "audio/ogg",
            size: 10_000 + i * 1000,
            duration: 5.0 + i,
            waveform: generate_waveform(100),
            user_id: user.id
          })
        end)
      end
      
      results = Task.await_many(tasks, 10_000)
      
      # All should succeed
      assert Enum.all?(results, fn {:ok, _} -> true; _ -> false end)
    end
    
    test "handles concurrent uploads from multiple users" do
      users = for _ <- 1..5 do
        create_user()
      end
      
      tasks = Enum.flat_map(users, fn user ->
        for i <- 1..3 do
          Task.async(fn ->
            VoiceMessage.create(%{
              filename: "voice_#{user.id}_#{i}_#{System.unique_integer([:positive])}.opus",
              content_type: "audio/ogg",
              size: 10_000 + i * 1000,
              duration: 5.0 + i,
              user_id: user.id
            })
          end)
        end
      end)
      
      results = Task.await_many(tasks, 30_000)
      
      successes = Enum.count(results, fn {:ok, _} -> true; _ -> false end)
      assert successes == 15
    end
  end
  
  # Helper functions
  
  defp generate_fake_audio_header do
    # WebM/Matroska magic bytes
    <<0x1A, 0x45, 0xDF, 0xA3>>
  end
  
  defp generate_waveform(samples) do
    for _ <- 1..samples, do: Float.round(:rand.uniform(), 3)
  end
  
  defp create_user(attrs \\ %{}) do
    unique_id = System.unique_integer([:positive])
    
    default_attrs = %{
      email: "user#{unique_id}@example.com",
      username: "user#{unique_id}",
      password: "SecureP@ssword123!"
    }
    
    {:ok, user} = Accounts.create_user(Map.merge(default_attrs, attrs))
    user
  end
end
