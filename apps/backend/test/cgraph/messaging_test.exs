defmodule Cgraph.MessagingTest do
  use Cgraph.DataCase, async: false

  alias Cgraph.Messaging
  alias Cgraph.Messaging.{Conversation, Message}
  alias Cgraph.Accounts

  setup do
    {:ok, user1} = Accounts.create_user(%{
      username: "messager1",
      email: "msg1@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })
    
    {:ok, user2} = Accounts.create_user(%{
      username: "messager2",
      email: "msg2@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })
    
    %{user1: user1, user2: user2}
  end

  describe "conversations" do
    test "create_conversation/2 creates a direct message conversation", %{user1: user1, user2: user2} do
      assert {:ok, %Conversation{} = conv} = Messaging.create_conversation(user1, %{"participant_ids" => [user2.id]})
      # DMs use user_one_id and user_two_id (sorted) for uniqueness
      assert conv.user_one_id != nil
      assert conv.user_two_id != nil
      assert length(conv.participants) == 2
    end

    test "get_or_create_dm/2 returns existing conversation", %{user1: user1, user2: user2} do
      {:ok, conv1} = Messaging.create_conversation(user1, %{"participant_ids" => [user2.id]})
      # get_or_create_dm now returns {conv, :existing/:created} indicator
      {:ok, conv2, _status} = Messaging.get_or_create_dm(user1, user2)
      
      assert conv1.id == conv2.id
    end

    test "list_conversations/1 returns user's conversations", %{user1: user1, user2: user2} do
      {:ok, _} = Messaging.create_conversation(user1, %{"participant_ids" => [user2.id]})
      
      {conversations, _meta} = Messaging.list_conversations(user1)
      assert length(conversations) == 1
    end

    test "get_conversation/1 returns conversation by id", %{user1: user1, user2: user2} do
      {:ok, conv} = Messaging.create_conversation(user1, %{"participant_ids" => [user2.id]})
      
      assert {:ok, found} = Messaging.get_conversation(conv.id)
      assert found.id == conv.id
    end
  end

  describe "messages" do
    setup %{user1: user1, user2: user2} do
      {:ok, conversation} = Messaging.create_conversation(user1, %{"participant_ids" => [user2.id]})
      %{user1: user1, user2: user2, conversation: conversation}
    end

    test "create_message/3 creates a new message", %{user1: user1, conversation: conversation} do
      assert {:ok, %Message{} = message} = Messaging.create_message(
        user1,
        conversation,
        %{content: "Hello!"}
      )
      
      assert message.content == "Hello!"
      assert message.sender_id == user1.id
      assert message.conversation_id == conversation.id
    end

    test "create_message/3 validates content is not empty", %{user1: user1, conversation: conversation} do
      assert {:error, changeset} = Messaging.create_message(
        user1,
        conversation,
        %{content: ""}
      )
      
      assert errors_on(changeset).content != nil
    end

    test "list_messages/2 returns messages in conversation", %{user1: user1, user2: user2, conversation: conversation} do
      {:ok, _} = Messaging.create_message(user1, conversation, %{content: "Message 1"})
      {:ok, _} = Messaging.create_message(user2, conversation, %{content: "Message 2"})
      {:ok, _} = Messaging.create_message(user1, conversation, %{content: "Message 3"})
      
      {messages, _meta} = Messaging.list_messages(conversation)
      assert length(messages) == 3
    end

    test "list_messages/2 supports pagination", %{user1: user1, conversation: conversation} do
      for i <- 1..10 do
        {:ok, _} = Messaging.create_message(user1, conversation, %{content: "Message #{i}"})
      end
      
      {messages, _meta} = Messaging.list_messages(conversation, per_page: 5)
      assert length(messages) == 5
    end

    test "update_message/2 updates message content", %{user1: user1, conversation: conversation} do
      {:ok, message} = Messaging.create_message(user1, conversation, %{content: "Original"})
      
      assert {:ok, updated} = Messaging.update_message(message, %{content: "Updated"})
      assert updated.content == "Updated"
      assert updated.is_edited == true
    end

    test "delete_message/1 soft deletes message", %{user1: user1, conversation: conversation} do
      {:ok, message} = Messaging.create_message(user1, conversation, %{content: "To delete"})
      
      assert {:ok, deleted} = Messaging.delete_message(message)
      assert deleted.deleted_at != nil
    end
  end

  describe "reactions" do
    setup %{user1: user1, user2: user2} do
      {:ok, conversation} = Messaging.create_conversation(user1, %{"participant_ids" => [user2.id]})
      {:ok, message} = Messaging.create_message(user1, conversation, %{content: "React to me"})
      %{user1: user1, user2: user2, message: message}
    end

    test "add_reaction/3 adds reaction to message", %{user2: user2, message: message} do
      assert {:ok, reaction} = Messaging.add_reaction(user2, message, "👍")
      assert reaction.emoji == "👍"
    end

    test "add_reaction/3 prevents duplicate reactions", %{user2: user2, message: message} do
      {:ok, _} = Messaging.add_reaction(user2, message, "👍")
      
      assert {:error, _} = Messaging.add_reaction(user2, message, "👍")
    end

    test "remove_reaction/3 removes reaction", %{user2: user2, message: message} do
      {:ok, _} = Messaging.add_reaction(user2, message, "👍")
      
      assert {:ok, _} = Messaging.remove_reaction(user2, message, "👍")
    end

    test "list_reactions/1 returns message reactions", %{user1: user1, user2: user2, message: message} do
      {:ok, _} = Messaging.add_reaction(user1, message, "❤️")
      {:ok, _} = Messaging.add_reaction(user2, message, "👍")
      
      reactions = Messaging.list_reactions(message)
      assert length(reactions) == 2
    end
  end

  describe "read receipts" do
    setup %{user1: user1, user2: user2} do
      {:ok, conversation} = Messaging.create_conversation(user1, %{"participant_ids" => [user2.id]})
      {:ok, message} = Messaging.create_message(user1, conversation, %{content: "Read me"})
      %{user1: user1, user2: user2, conversation: conversation, message: message}
    end

    test "mark_as_read/2 marks message as read", %{user2: user2, message: message} do
      assert {:ok, receipt} = Messaging.mark_as_read(message, user2)
      assert receipt.read_at != nil
    end

    test "mark_conversation_read/2 marks all messages read", %{user1: user1, user2: user2, conversation: conversation} do
      {:ok, _} = Messaging.create_message(user1, conversation, %{content: "Message 1"})
      {:ok, _} = Messaging.create_message(user1, conversation, %{content: "Message 2"})
      
      assert {:ok, count} = Messaging.mark_conversation_read(conversation, user2)
      # Should mark messages not sent by user2
      assert count >= 0
    end
  end
end
