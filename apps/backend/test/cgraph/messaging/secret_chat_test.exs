defmodule CGraph.Messaging.SecretChatTest do
  @moduledoc """
  Tests for the CGraph.Messaging.SecretChat context.

  Secret chats are device-bound, E2EE-mandatory conversations where
  the server only stores opaque ciphertext blobs.
  """
  use CGraph.DataCase, async: true
  import CGraph.Factory

  alias CGraph.Messaging.SecretChat
  alias CGraph.Messaging.{SecretConversation, SecretMessage}

  # ============================================================================
  # Conversation Lifecycle
  # ============================================================================

  describe "create_secret_conversation/3" do
    test "creates a secret conversation between two users" do
      user1 = insert(:user)
      user2 = insert(:user)

      assert {:ok, %SecretConversation{} = convo} =
               SecretChat.create_secret_conversation(user1, user2.id, device_id: "dev_1")

      assert convo.status == "active"
      assert convo.initiator_device_id == "dev_1"
      assert convo.initiator != nil
      assert convo.recipient != nil
    end

    test "prevents creating duplicate active secret chat for same pair" do
      user1 = insert(:user)
      user2 = insert(:user)

      assert {:ok, _convo} = SecretChat.create_secret_conversation(user1, user2.id)
      assert {:error, :already_exists} = SecretChat.create_secret_conversation(user1, user2.id)
    end

    test "prevents creating duplicate in reverse direction" do
      user1 = insert(:user)
      user2 = insert(:user)

      assert {:ok, _convo} = SecretChat.create_secret_conversation(user1, user2.id)
      assert {:error, :already_exists} = SecretChat.create_secret_conversation(user2, user1.id)
    end

    test "returns error when chatting with self" do
      user = insert(:user)

      assert {:error, :cannot_chat_with_self} =
               SecretChat.create_secret_conversation(user, user.id)
    end

    test "stores key fingerprint" do
      user1 = insert(:user)
      user2 = insert(:user)

      assert {:ok, convo} =
               SecretChat.create_secret_conversation(user1, user2.id,
                 device_id: "dev_1",
                 fingerprint: "abc123"
               )

      assert convo.initiator_fingerprint == "abc123"
    end
  end

  describe "list_secret_conversations/1" do
    test "returns active secret conversations for a user" do
      user1 = insert(:user)
      user2 = insert(:user)
      user3 = insert(:user)

      {:ok, _c1} = SecretChat.create_secret_conversation(user1, user2.id)
      {:ok, _c2} = SecretChat.create_secret_conversation(user1, user3.id)

      convos = SecretChat.list_secret_conversations(user1.id)
      assert length(convos) == 2
    end

    test "includes conversations where user is recipient" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, _} = SecretChat.create_secret_conversation(user2, user1.id)

      convos = SecretChat.list_secret_conversations(user1.id)
      assert length(convos) == 1
    end

    test "excludes terminated conversations" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)
      {:ok, _} = SecretChat.destroy_secret_chat(convo, user1.id)

      convos = SecretChat.list_secret_conversations(user1.id)
      assert convos == []
    end

    test "returns empty list for user with no secret chats" do
      user = insert(:user)
      assert SecretChat.list_secret_conversations(user.id) == []
    end
  end

  describe "get_secret_conversation/2" do
    test "returns conversation if user is participant" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, created} = SecretChat.create_secret_conversation(user1, user2.id)

      assert {:ok, fetched} = SecretChat.get_secret_conversation(created.id, user1.id)
      assert fetched.id == created.id
    end

    test "returns conversation if user is recipient" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, created} = SecretChat.create_secret_conversation(user1, user2.id)

      assert {:ok, fetched} = SecretChat.get_secret_conversation(created.id, user2.id)
      assert fetched.id == created.id
    end

    test "returns :not_found for non-participant" do
      user1 = insert(:user)
      user2 = insert(:user)
      user3 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      assert {:error, :not_found} = SecretChat.get_secret_conversation(convo.id, user3.id)
    end

    test "returns :not_found for nonexistent conversation" do
      user = insert(:user)
      assert {:error, :not_found} = SecretChat.get_secret_conversation(Ecto.UUID.generate(), user.id)
    end
  end

  describe "destroy_secret_chat/2" do
    test "terminates conversation and hard-deletes all messages" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      # Add some messages
      {:ok, _} =
        SecretChat.send_secret_message(convo, user1, %{
          ciphertext: :crypto.strong_rand_bytes(32),
          nonce: :crypto.strong_rand_bytes(12),
          ratchet_header: :crypto.strong_rand_bytes(16)
        })

      {:ok, _} =
        SecretChat.send_secret_message(convo, user2, %{
          ciphertext: :crypto.strong_rand_bytes(32),
          nonce: :crypto.strong_rand_bytes(12),
          ratchet_header: :crypto.strong_rand_bytes(16)
        })

      assert {:ok, terminated} = SecretChat.destroy_secret_chat(convo, user1.id)
      assert terminated.status == "terminated"
      assert terminated.terminated_by == user1.id

      # Messages should be hard-deleted
      messages = SecretChat.list_secret_messages(convo)
      assert messages == []
    end

    test "allows new secret chat after termination" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)
      {:ok, _} = SecretChat.destroy_secret_chat(convo, user1.id)

      # Should be able to create a new one
      assert {:ok, new_convo} = SecretChat.create_secret_conversation(user1, user2.id)
      assert new_convo.id != convo.id
    end
  end

  # ============================================================================
  # Messages
  # ============================================================================

  describe "send_secret_message/3" do
    test "stores an encrypted message" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      ct = :crypto.strong_rand_bytes(64)
      nonce = :crypto.strong_rand_bytes(12)
      header = :crypto.strong_rand_bytes(32)

      assert {:ok, %SecretMessage{} = msg} =
               SecretChat.send_secret_message(convo, user1, %{
                 ciphertext: ct,
                 nonce: nonce,
                 ratchet_header: header,
                 content_type: "text"
               })

      assert msg.ciphertext == ct
      assert msg.nonce == nonce
      assert msg.ratchet_header == header
      assert msg.sender_id == user1.id
      assert msg.secret_conversation_id == convo.id
    end

    test "sets expiry when conversation has self-destruct timer" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)
      {:ok, convo} = SecretChat.set_self_destruct_timer(convo, user1.id, 60)

      assert {:ok, msg} =
               SecretChat.send_secret_message(convo, user1, %{
                 ciphertext: :crypto.strong_rand_bytes(32),
                 nonce: :crypto.strong_rand_bytes(12),
                 ratchet_header: :crypto.strong_rand_bytes(16)
               })

      assert msg.expires_at != nil
      assert DateTime.compare(msg.expires_at, DateTime.utc_now()) == :gt
    end

    test "returns error for terminated conversation" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)
      {:ok, terminated} = SecretChat.destroy_secret_chat(convo, user1.id)

      assert {:error, :conversation_terminated} =
               SecretChat.send_secret_message(terminated, user1, %{
                 ciphertext: :crypto.strong_rand_bytes(32),
                 nonce: :crypto.strong_rand_bytes(12),
                 ratchet_header: :crypto.strong_rand_bytes(16)
               })
    end

    test "stores file metadata" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      metadata = %{"size" => 1024, "mime" => "image/png", "thumb_hash" => "abc123"}

      assert {:ok, msg} =
               SecretChat.send_secret_message(convo, user1, %{
                 ciphertext: :crypto.strong_rand_bytes(32),
                 nonce: :crypto.strong_rand_bytes(12),
                 ratchet_header: :crypto.strong_rand_bytes(16),
                 content_type: "image",
                 file_metadata: metadata
               })

      assert msg.file_metadata == metadata
      assert msg.content_type == "image"
    end
  end

  describe "list_secret_messages/2" do
    test "returns messages in reverse chronological order" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      for _ <- 1..5 do
        {:ok, _} =
          SecretChat.send_secret_message(convo, user1, %{
            ciphertext: :crypto.strong_rand_bytes(32),
            nonce: :crypto.strong_rand_bytes(12),
            ratchet_header: :crypto.strong_rand_bytes(16)
          })
      end

      messages = SecretChat.list_secret_messages(convo)
      assert length(messages) == 5

      timestamps = Enum.map(messages, & &1.inserted_at)
      assert timestamps == Enum.sort(timestamps, {:desc, NaiveDateTime})
    end

    test "excludes expired messages" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      # Create a message with past expiry
      {:ok, _} =
        SecretChat.send_secret_message(convo, user1, %{
          ciphertext: :crypto.strong_rand_bytes(32),
          nonce: :crypto.strong_rand_bytes(12),
          ratchet_header: :crypto.strong_rand_bytes(16)
        })

      # Manually set one message to expired
      expired_time = DateTime.add(DateTime.utc_now(), -3600, :second)

      insert(:secret_message,
        secret_conversation: convo,
        sender: user1,
        expires_at: expired_time
      )

      messages = SecretChat.list_secret_messages(convo)
      # Only the non-expired message should be returned
      assert length(messages) == 1
    end

    test "respects limit" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      for _ <- 1..10 do
        {:ok, _} =
          SecretChat.send_secret_message(convo, user1, %{
            ciphertext: :crypto.strong_rand_bytes(32),
            nonce: :crypto.strong_rand_bytes(12),
            ratchet_header: :crypto.strong_rand_bytes(16)
          })
      end

      messages = SecretChat.list_secret_messages(convo, limit: 3)
      assert length(messages) == 3
    end
  end

  describe "mark_secret_message_read/2" do
    test "marks message as read" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      {:ok, msg} =
        SecretChat.send_secret_message(convo, user1, %{
          ciphertext: :crypto.strong_rand_bytes(32),
          nonce: :crypto.strong_rand_bytes(12),
          ratchet_header: :crypto.strong_rand_bytes(16)
        })

      assert {:ok, read_msg} = SecretChat.mark_secret_message_read(msg.id, user2.id)
      assert read_msg.read_at != nil
    end

    test "sets expiry on read when conversation has self-destruct timer" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)
      {:ok, convo} = SecretChat.set_self_destruct_timer(convo, user1.id, 30)

      {:ok, msg} =
        SecretChat.send_secret_message(convo, user1, %{
          ciphertext: :crypto.strong_rand_bytes(32),
          nonce: :crypto.strong_rand_bytes(12),
          ratchet_header: :crypto.strong_rand_bytes(16)
        })

      assert {:ok, read_msg} = SecretChat.mark_secret_message_read(msg.id, user2.id)
      assert read_msg.read_at != nil
      assert read_msg.expires_at != nil
    end
  end

  # ============================================================================
  # Self-Destruct Timer
  # ============================================================================

  describe "set_self_destruct_timer/3" do
    test "sets timer on conversation" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      assert {:ok, updated} = SecretChat.set_self_destruct_timer(convo, user1.id, 300)
      assert updated.self_destruct_seconds == 300
    end

    test "clears timer with nil" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)
      {:ok, convo} = SecretChat.set_self_destruct_timer(convo, user1.id, 300)

      assert {:ok, updated} = SecretChat.set_self_destruct_timer(convo, user1.id, nil)
      assert updated.self_destruct_seconds == nil
    end

    test "rejects invalid timer values" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      assert {:error, _} = SecretChat.set_self_destruct_timer(convo, user1.id, 42)
    end

    test "accepts all valid timer values" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      for seconds <- [5, 30, 60, 300, 3600, 86400, 604_800] do
        assert {:ok, _} = SecretChat.set_self_destruct_timer(convo, user1.id, seconds)
      end
    end
  end

  # ============================================================================
  # Cleanup
  # ============================================================================

  describe "cleanup_expired_messages/0" do
    test "deletes expired messages" do
      user1 = insert(:user)
      user2 = insert(:user)

      {:ok, convo} = SecretChat.create_secret_conversation(user1, user2.id)

      # Insert an expired message
      expired_time = DateTime.add(DateTime.utc_now(), -3600, :second)

      insert(:secret_message,
        secret_conversation: convo,
        sender: user1,
        expires_at: expired_time
      )

      # Insert a non-expired message
      {:ok, _} =
        SecretChat.send_secret_message(convo, user1, %{
          ciphertext: :crypto.strong_rand_bytes(32),
          nonce: :crypto.strong_rand_bytes(12),
          ratchet_header: :crypto.strong_rand_bytes(16)
        })

      count = SecretChat.cleanup_expired_messages()
      assert count == 1

      # Only the non-expired message remains
      remaining = SecretChat.list_secret_messages(convo)
      assert length(remaining) == 1
    end

    test "returns 0 when no expired messages exist" do
      assert SecretChat.cleanup_expired_messages() == 0
    end
  end
end
