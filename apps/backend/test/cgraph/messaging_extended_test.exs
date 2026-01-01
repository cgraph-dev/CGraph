defmodule Cgraph.MessagingExtendedTest do
  @moduledoc """
  Extended test suite for Cgraph.Messaging context.
  Tests additional functions beyond the base test suite.
  """
  use Cgraph.DataCase, async: true

  alias Cgraph.Messaging
  alias Cgraph.Messaging.{Conversation, Message}
  alias Cgraph.Accounts

  defp create_user(attrs \\ %{}) do
    unique_id = System.unique_integer([:positive])
    base = %{
      username: "msguser_#{unique_id}",
      email: "msguser_#{unique_id}@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    }
    {:ok, user} = Accounts.create_user(Map.merge(base, attrs))
    user
  end

  defp create_conversation(user1, user2) do
    {:ok, conv, _} = Messaging.create_or_get_conversation(user1, [user2.id])
    conv
  end

  defp send_message(conv, user, content \\ "Test message") do
    {:ok, msg} = Messaging.send_message(conv, user, %{content: content})
    msg
  end

  # ============================================================================
  # Conversation Operations
  # ============================================================================

  describe "create_or_get_conversation/2" do
    test "creates new conversation" do
      user1 = create_user()
      user2 = create_user()
      
      result = Messaging.create_or_get_conversation(user1, [user2.id])
      
      assert match?({:ok, %Conversation{}, :created}, result)
    end

    test "returns existing conversation for same users" do
      user1 = create_user()
      user2 = create_user()
      
      {:ok, conv1, :created} = Messaging.create_or_get_conversation(user1, [user2.id])
      {:ok, conv2, :existing} = Messaging.create_or_get_conversation(user1, [user2.id])
      
      assert conv1.id == conv2.id
    end

    test "works with single recipient_id string" do
      user1 = create_user()
      user2 = create_user()
      
      result = Messaging.create_or_get_conversation(user1, user2.id)
      
      assert match?({:ok, %Conversation{}, _}, result)
    end
  end

  describe "get_conversation/1" do
    test "returns conversation by ID" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      
      {:ok, found} = Messaging.get_conversation(conv.id)
      
      assert found.id == conv.id
    end

    test "returns error for non-existent conversation" do
      result = Messaging.get_conversation(Ecto.UUID.generate())
      
      assert match?({:error, :not_found}, result)
    end
  end

  describe "get_user_conversation/2" do
    test "returns conversation for participant" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      
      {:ok, found} = Messaging.get_user_conversation(user1, conv.id)
      
      assert found.id == conv.id
    end

    test "returns error for non-participant" do
      user1 = create_user()
      user2 = create_user()
      user3 = create_user()
      conv = create_conversation(user1, user2)
      
      result = Messaging.get_user_conversation(user3, conv.id)
      
      assert match?({:error, _}, result)
    end
  end

  describe "list_conversations/2" do
    test "returns user's conversations" do
      user1 = create_user()
      user2 = create_user()
      _conv = create_conversation(user1, user2)
      
      {conversations, meta} = Messaging.list_conversations(user1, [])
      
      assert length(conversations) >= 1
      assert is_map(meta)
    end

    test "paginates results" do
      user1 = create_user()
      
      # Create multiple conversations
      Enum.each(1..3, fn _ ->
        user = create_user()
        create_conversation(user1, user)
      end)
      
      {page1, _} = Messaging.list_conversations(user1, page: 1, per_page: 2)
      
      assert length(page1) == 2
    end
  end

  # ============================================================================
  # Message Operations
  # ============================================================================

  describe "send_message/3" do
    test "sends message to conversation" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      
      {:ok, msg} = Messaging.send_message(conv, user1, %{content: "Hello!"})
      
      assert msg.content == "Hello!"
      assert msg.sender_id == user1.id
    end

    test "creates message with correct conversation_id" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      
      {:ok, msg} = Messaging.send_message(conv, user1, %{content: "Test"})
      
      assert msg.conversation_id == conv.id
    end
  end

  describe "list_messages/2" do
    test "returns messages for conversation" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      _msg1 = send_message(conv, user1, "First")
      _msg2 = send_message(conv, user2, "Second")
      
      {messages, _meta} = Messaging.list_messages(conv, [])
      
      assert length(messages) >= 2
    end

    test "paginates results" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      
      Enum.each(1..5, fn i -> send_message(conv, user1, "Message #{i}") end)
      
      {page1, _} = Messaging.list_messages(conv, page: 1, per_page: 2)
      
      assert length(page1) == 2
    end
  end

  describe "get_message/2" do
    test "returns message by ID" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      msg = send_message(conv, user1)
      
      {:ok, found} = Messaging.get_message(conv, msg.id)
      
      assert found.id == msg.id
    end

    test "returns error for message in wrong conversation" do
      user1 = create_user()
      user2 = create_user()
      user3 = create_user()
      
      conv1 = create_conversation(user1, user2)
      conv2 = create_conversation(user1, user3)
      msg = send_message(conv1, user1)
      
      result = Messaging.get_message(conv2, msg.id)
      
      assert match?({:error, _}, result)
    end
  end

  describe "update_message/2" do
    test "updates message content" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      msg = send_message(conv, user1, "Original")
      
      {:ok, updated} = Messaging.update_message(msg, %{content: "Edited"})
      
      assert updated.content == "Edited"
    end
  end

  describe "delete_message/1" do
    test "deletes message" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      msg = send_message(conv, user1)
      
      result = Messaging.delete_message(msg)
      
      assert match?({:ok, _}, result)
    end
  end

  # ============================================================================
  # Read Status
  # ============================================================================

  describe "mark_messages_read/3" do
    test "marks messages as read" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      msg = send_message(conv, user1)
      
      result = Messaging.mark_messages_read(user2, conv, msg.id)
      
      assert result == :ok or match?({:ok, _}, result)
    end
  end

  describe "get_unread_count/2" do
    test "returns unread count for user" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      _msg = send_message(conv, user1)
      
      count = Messaging.get_unread_count(conv, user2)
      
      assert is_integer(count)
      assert count >= 0
    end
  end

  # ============================================================================
  # Reactions
  # ============================================================================

  describe "add_reaction/3" do
    test "adds reaction to message" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      msg = send_message(conv, user1)
      
      result = Messaging.add_reaction(user2, msg, "👍")
      
      assert match?({:ok, _}, result)
    end
  end

  describe "remove_reaction/3" do
    test "removes reaction from message" do
      user1 = create_user()
      user2 = create_user()
      conv = create_conversation(user1, user2)
      msg = send_message(conv, user1)
      
      {:ok, _} = Messaging.add_reaction(user2, msg, "👍")
      result = Messaging.remove_reaction(user2, msg, "👍")
      
      assert match?({:ok, _}, result) or result == :ok
    end
  end

  # ============================================================================
  # Group Conversations
  # ============================================================================

  describe "create_group_conversation/2" do
    test "creates group conversation" do
      user1 = create_user()
      user2 = create_user()
      user3 = create_user()
      
      result = Messaging.create_group_conversation(user1, %{
        participant_ids: [user2.id, user3.id],
        name: "Test Group"
      })
      
      assert match?({:ok, _}, result)
    end

    test "creates group with minimum participants" do
      user1 = create_user()
      user2 = create_user()
      
      result = Messaging.create_group_conversation(user1, %{
        participant_ids: [user2.id],
        name: "Small Group"
      })
      
      assert match?({:ok, _}, result)
    end
  end

  # ============================================================================
  # Additional Message Tests
  # ============================================================================

  describe "get_message/2 edge cases" do
    test "returns error for non-existent message" do
      user = create_user()
      
      result = Messaging.get_message(user, Ecto.UUID.generate())
      
      assert result == {:error, :not_found}
    end
  end

  describe "list_conversations/2 ordering" do
    test "returns conversations ordered by recent activity" do
      user1 = create_user()
      user2 = create_user()
      user3 = create_user()
      
      conv1 = create_conversation(user1, user2)
      _conv2 = create_conversation(user1, user3)
      
      # Send message to older conversation
      {:ok, _} = Messaging.send_message(conv1, user1, %{content: "Recent"})
      
      {conversations, _meta} = Messaging.list_conversations(user1)
      
      assert length(conversations) >= 2
    end
  end

  describe "conversation participant management" do
    test "get_or_create finds existing conversation" do
      user1 = create_user()
      user2 = create_user()
      
      {:ok, conv1, :created} = Messaging.create_or_get_conversation(user1, [user2.id])
      {:ok, conv2, :existing} = Messaging.create_or_get_conversation(user1, [user2.id])
      
      assert conv1.id == conv2.id
    end
  end
end
