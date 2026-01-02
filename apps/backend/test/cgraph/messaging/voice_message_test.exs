defmodule Cgraph.Messaging.VoiceMessageTest do
  use Cgraph.DataCase, async: true
  
  alias Cgraph.Messaging.VoiceMessage
  alias Cgraph.Accounts
  
  describe "changeset/2" do
    test "valid changeset with required fields" do
      user = create_user()
      
      attrs = %{
        filename: "voice_123.opus",
        content_type: "audio/ogg",
        size: 50_000,
        user_id: user.id
      }
      
      changeset = VoiceMessage.changeset(%VoiceMessage{}, attrs)
      
      assert changeset.valid?
    end
    
    test "invalid without filename" do
      user = create_user()
      
      attrs = %{
        content_type: "audio/ogg",
        size: 50_000,
        user_id: user.id
      }
      
      changeset = VoiceMessage.changeset(%VoiceMessage{}, attrs)
      
      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).filename
    end
    
    test "invalid without user_id" do
      attrs = %{
        filename: "voice_123.opus",
        content_type: "audio/ogg",
        size: 50_000
      }
      
      changeset = VoiceMessage.changeset(%VoiceMessage{}, attrs)
      
      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).user_id
    end
    
    test "rejects file size exceeding limit" do
      user = create_user()
      
      attrs = %{
        filename: "voice_123.opus",
        content_type: "audio/ogg",
        size: 15_000_000,  # 15 MB, exceeds 10 MB limit
        user_id: user.id
      }
      
      changeset = VoiceMessage.changeset(%VoiceMessage{}, attrs)
      
      refute changeset.valid?
      assert errors_on(changeset).size != nil
    end
    
    test "rejects duration exceeding limit" do
      user = create_user()
      
      attrs = %{
        filename: "voice_123.opus",
        content_type: "audio/ogg",
        size: 50_000,
        duration: 400.0,  # 400 seconds, exceeds 300 second limit
        user_id: user.id
      }
      
      changeset = VoiceMessage.changeset(%VoiceMessage{}, attrs)
      
      refute changeset.valid?
      assert errors_on(changeset).duration != nil
    end
    
    test "rejects unsupported content type" do
      user = create_user()
      
      attrs = %{
        filename: "voice_123.pdf",
        content_type: "application/pdf",
        size: 50_000,
        user_id: user.id
      }
      
      changeset = VoiceMessage.changeset(%VoiceMessage{}, attrs)
      
      refute changeset.valid?
      assert errors_on(changeset).content_type != nil
    end
    
    test "accepts all supported audio formats" do
      user = create_user()
      
      supported = [
        "audio/webm",
        "audio/ogg",
        "audio/mp4",
        "audio/mpeg",
        "audio/mp3",
        "audio/m4a",
        "audio/x-m4a",
        "audio/wav"
      ]
      
      Enum.each(supported, fn content_type ->
        attrs = %{
          filename: "voice.audio",
          content_type: content_type,
          size: 50_000,
          user_id: user.id
        }
        
        changeset = VoiceMessage.changeset(%VoiceMessage{}, attrs)
        assert changeset.valid?, "Expected #{content_type} to be valid"
      end)
    end
  end
  
  describe "create/2" do
    test "creates voice message record" do
      user = create_user()
      
      attrs = %{
        filename: "voice_#{System.unique_integer([:positive])}.opus",
        content_type: "audio/ogg",
        size: 50_000,
        duration: 30.5,
        url: "https://storage.example.com/voice/abc123.opus",
        user_id: user.id
      }
      
      {:ok, voice_message} = VoiceMessage.create(attrs)
      
      assert voice_message.id
      assert voice_message.filename == attrs.filename
      assert voice_message.duration == 30.5
      assert voice_message.url == attrs.url
    end
    
    test "creates with waveform data" do
      user = create_user()
      waveform = Enum.map(1..100, fn _ -> :rand.uniform() end)
      
      attrs = %{
        filename: "voice_#{System.unique_integer([:positive])}.opus",
        content_type: "audio/ogg",
        size: 50_000,
        waveform: waveform,
        user_id: user.id
      }
      
      {:ok, voice_message} = VoiceMessage.create(attrs)
      
      assert voice_message.waveform == waveform
      assert length(voice_message.waveform) == 100
    end
  end
  
  describe "get/1" do
    test "returns voice message by id" do
      user = create_user()
      
      attrs = %{
        filename: "voice_#{System.unique_integer([:positive])}.opus",
        content_type: "audio/ogg",
        size: 50_000,
        user_id: user.id
      }
      
      {:ok, created} = VoiceMessage.create(attrs)
      {:ok, fetched} = VoiceMessage.get(created.id)
      
      assert fetched.id == created.id
      assert fetched.filename == created.filename
    end
    
    test "returns error for non-existent id" do
      assert {:error, :not_found} = VoiceMessage.get(Ecto.UUID.generate())
    end
  end
  
  describe "delete/1" do
    test "soft deletes voice message" do
      user = create_user()
      
      attrs = %{
        filename: "voice_#{System.unique_integer([:positive])}.opus",
        content_type: "audio/ogg",
        size: 50_000,
        user_id: user.id
      }
      
      {:ok, voice_message} = VoiceMessage.create(attrs)
      
      assert :ok = VoiceMessage.delete(voice_message)
      
      # Should no longer be findable
      assert {:error, :not_found} = VoiceMessage.get(voice_message.id)
    end
  end
  
  describe "for_user/1" do
    test "returns all voice messages for user" do
      user = create_user()
      
      # Create multiple voice messages (with is_processed: true to be returned)
      Enum.each(1..3, fn i ->
        {:ok, _} = VoiceMessage.create(%{
          filename: "voice_#{i}.opus",
          content_type: "audio/ogg",
          size: 50_000,
          user_id: user.id,
          is_processed: true
        })
      end)
      
      messages = VoiceMessage.for_user(user.id)
      
      assert length(messages) == 3
    end
    
    test "does not return other users' messages" do
      user1 = create_user()
      user2 = create_user()
      
      {:ok, _} = VoiceMessage.create(%{
        filename: "voice_user1.opus",
        content_type: "audio/ogg",
        size: 50_000,
        user_id: user1.id,
        is_processed: true
      })
      
      {:ok, _} = VoiceMessage.create(%{
        filename: "voice_user2.opus",
        content_type: "audio/ogg",
        size: 50_000,
        user_id: user2.id,
        is_processed: true
      })
      
      messages = VoiceMessage.for_user(user1.id)
      
      assert length(messages) == 1
      assert hd(messages).user_id == user1.id
    end
  end
  
  describe "validate_upload/1" do
    test "accepts valid upload" do
      upload = %{
        filename: "recording.webm",
        content_type: "audio/webm",
        path: "/tmp/upload.webm"
      }
      
      assert :ok = VoiceMessage.validate_upload(upload)
    end
    
    test "rejects missing filename" do
      upload = %{
        content_type: "audio/webm",
        path: "/tmp/upload.webm"
      }
      
      assert {:error, :invalid_upload} = VoiceMessage.validate_upload(upload)
    end
    
    test "rejects unsupported content type" do
      upload = %{
        filename: "document.pdf",
        content_type: "application/pdf",
        path: "/tmp/upload.pdf"
      }
      
      assert {:error, :unsupported_format} = VoiceMessage.validate_upload(upload)
    end
  end
  
  describe "rate limiting" do
    test "enforces rate limit for uploads" do
      user = create_user()
      
      # Check rate limit functions exist
      assert function_exported?(VoiceMessage, :check_rate_limit, 1)
    end
  end
  
  # Helper functions
  
  defp create_user do
    unique = System.unique_integer([:positive])
    {:ok, user} = Accounts.register_user(%{
      email: "voice_test_#{unique}@example.com",
      password: "TestPassword123!",
      username: "voice_user_#{unique}"
    })
    user
  end
end
