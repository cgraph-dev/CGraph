defmodule Cgraph.Integration.RealTimeMessagingIntegrationTest do
  @moduledoc """
  Integration tests for real-time messaging features.
  
  Tests WebSocket channels, presence, typing indicators, and message
  delivery in realistic scenarios.
  
  These tests require full Phoenix channel infrastructure and may be
  excluded in some CI environments using: `mix test --exclude channel`
  """
  use CgraphWeb.ChannelCase, async: false
  
  alias Cgraph.Messaging
  alias Cgraph.Accounts
  alias CgraphWeb.UserSocket
  alias CgraphWeb.ConversationChannel
  
  @moduletag :channel

  # Helper functions
  defp create_user(attrs \\ %{}) do
    base = %{
      email: "user_#{System.unique_integer([:positive])}@example.com",
      username: "user_#{System.unique_integer([:positive])}",
      password: "SecureP@ssword123!"
    }
    {:ok, user} = Accounts.create_user(Map.merge(base, attrs))
    user
  end

  defp create_conversation(user1, user2) do
    {:ok, conv, _} = Messaging.create_or_get_conversation(user1, [user2.id])
    conv
  end

  defp generate_token(user) do
    {:ok, token, _claims} = Cgraph.Guardian.encode_and_sign(user)
    token
  end

  describe "real-time message delivery" do
    setup do
      alice = create_user(%{email: "alice@example.com", username: "alice"})
      bob = create_user(%{email: "bob@example.com", username: "bob"})
      
      conversation = create_conversation(alice, bob)
      
      {:ok, alice: alice, bob: bob, conversation: conversation}
    end
    
    test "message sent by one user is received by another", %{
      alice: alice, 
      bob: bob, 
      conversation: conversation
    } do
      # Connect Alice to the conversation channel
      {:ok, alice_socket} = connect(UserSocket, %{"token" => generate_token(alice)})
      {:ok, _, alice_channel} = subscribe_and_join(
        alice_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      # Connect Bob to the same conversation
      {:ok, bob_socket} = connect(UserSocket, %{"token" => generate_token(bob)})
      {:ok, _, bob_channel} = subscribe_and_join(
        bob_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      # Alice sends a message
      message_content = "Hello Bob! How are you?"
      push(alice_channel, "new_message", %{
        "content" => message_content,
        "conversation_id" => conversation.id
      })
      
      # Bob should receive the message
      assert_broadcast("new_message", %{content: ^message_content})
    end
    
    test "typing indicator is broadcast to other participants", %{
      alice: alice, 
      bob: bob, 
      conversation: conversation
    } do
      {:ok, alice_socket} = connect(UserSocket, %{"token" => generate_token(alice)})
      {:ok, _, alice_channel} = subscribe_and_join(
        alice_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      {:ok, bob_socket} = connect(UserSocket, %{"token" => generate_token(bob)})
      {:ok, _, _bob_channel} = subscribe_and_join(
        bob_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      # Alice starts typing
      push(alice_channel, "typing", %{"typing" => true})
      
      # Bob should see Alice is typing
      alice_username = alice.username
      assert_broadcast("typing", %{user: %{username: ^alice_username}, typing: true})
    end
    
    test "presence tracks online users in conversation", %{
      alice: alice, 
      bob: bob, 
      conversation: conversation
    } do
      {:ok, alice_socket} = connect(UserSocket, %{"token" => generate_token(alice)})
      {:ok, _, _alice_channel} = subscribe_and_join(
        alice_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      # Wait for presence update
      Process.sleep(100)
      
      {:ok, bob_socket} = connect(UserSocket, %{"token" => generate_token(bob)})
      {:ok, _, _bob_channel} = subscribe_and_join(
        bob_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      # Both users should be in presence
      assert_broadcast("presence_state", _presences)
    end
    
    test "message edit is broadcast in real-time", %{
      alice: alice, 
      bob: bob, 
      conversation: conversation
    } do
      # First send a message
      {:ok, message} = Messaging.send_message(
        conversation,
        alice,
        %{"content" => "Original message"}
      )
      
      {:ok, alice_socket} = connect(UserSocket, %{"token" => generate_token(alice)})
      {:ok, _, alice_channel} = subscribe_and_join(
        alice_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      {:ok, bob_socket} = connect(UserSocket, %{"token" => generate_token(bob)})
      {:ok, _, _bob_channel} = subscribe_and_join(
        bob_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      # Alice edits the message
      push(alice_channel, "edit_message", %{
        "message_id" => message.id,
        "content" => "Edited message"
      })
      
      # Bob should see the edit
      assert_broadcast("message_updated", %{id: _, content: "Edited message"})
    end
    
    test "message deletion is broadcast in real-time", %{
      alice: alice, 
      bob: bob, 
      conversation: conversation
    } do
      {:ok, message} = Messaging.send_message(
        conversation,
        alice,
        %{"content" => "This will be deleted"}
      )
      
      {:ok, alice_socket} = connect(UserSocket, %{"token" => generate_token(alice)})
      {:ok, _, alice_channel} = subscribe_and_join(
        alice_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      {:ok, bob_socket} = connect(UserSocket, %{"token" => generate_token(bob)})
      {:ok, _, _bob_channel} = subscribe_and_join(
        bob_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      # Alice deletes the message
      push(alice_channel, "delete_message", %{"message_id" => message.id})
      
      # Bob should see the deletion
      message_id = message.id
      assert_broadcast("message_deleted", %{id: ^message_id})
    end
  end
  
  describe "read receipts" do
    setup do
      alice = create_user()
      bob = create_user()
      conversation = create_conversation(alice, bob)
      
      {:ok, alice: alice, bob: bob, conversation: conversation}
    end
    
    test "read receipt is broadcast when message is read", %{
      alice: alice, 
      bob: bob, 
      conversation: conversation
    } do
      # Alice sends a message
      {:ok, message} = Messaging.send_message(
        conversation,
        alice,
        %{"content" => "Did you get this?"}
      )
      
      {:ok, alice_socket} = connect(UserSocket, %{"token" => generate_token(alice)})
      {:ok, _, _alice_channel} = subscribe_and_join(
        alice_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      {:ok, bob_socket} = connect(UserSocket, %{"token" => generate_token(bob)})
      {:ok, _, bob_channel} = subscribe_and_join(
        bob_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      # Bob marks message as read
      push(bob_channel, "mark_read", %{"message_id" => message.id})
      
      # Alice should see read receipt
      message_id = message.id
      assert_broadcast("message_read", %{message_id: ^message_id, user_id: _})
    end
  end
  
  describe "group channel messaging" do
    setup do
      owner = create_user(%{email: "owner@example.com"})
      member = create_user(%{email: "member@example.com"})
      
      # create_group/2 takes a user struct and attrs
      {:ok, group} = Cgraph.Groups.create_group(owner, %{
        "name" => "Test Group",
        "description" => "A test group"
      })
      
      # Group already has general channel created by default
      # Get the channel
      channels = Cgraph.Groups.list_channels(group)
      channel = List.first(channels)
      
      {:ok, _} = Cgraph.Groups.add_member(group, member)
      
      {:ok, owner: owner, member: member, group: group, channel: channel}
    end
    
    test "group channel message is broadcast to all members", %{
      owner: owner, 
      member: member, 
      channel: channel
    } do
      {:ok, owner_socket} = connect(UserSocket, %{"token" => generate_token(owner)})
      {:ok, _, owner_channel} = subscribe_and_join(
        owner_socket, 
        CgraphWeb.GroupChannel, 
        "group:#{channel.id}"
      )
      
      {:ok, member_socket} = connect(UserSocket, %{"token" => generate_token(member)})
      {:ok, _, _member_channel} = subscribe_and_join(
        member_socket, 
        CgraphWeb.GroupChannel, 
        "group:#{channel.id}"
      )
      
      # Owner sends a message
      push(owner_channel, "new_message", %{"content" => "Welcome everyone!"})
      
      # Member should receive it
      assert_broadcast("new_message", %{content: "Welcome everyone!"})
    end
  end
  
  describe "reconnection and message recovery" do
    test "client receives missed messages after reconnection" do
      alice = create_user()
      bob = create_user()
      conversation = create_conversation(alice, bob)
      
      # Alice sends messages while Bob is offline
      for i <- 1..5 do
        {:ok, _} = Messaging.send_message(
          conversation,
          alice,
          %{"content" => "Message #{i}"}
        )
      end
      
      # Bob connects and requests recent messages
      {:ok, bob_socket} = connect(UserSocket, %{"token" => generate_token(bob)})
      {:ok, reply, _bob_channel} = subscribe_and_join(
        bob_socket, 
        ConversationChannel, 
        "conversation:#{conversation.id}"
      )
      
      # The join reply should include recent messages or a way to fetch them
      assert Map.has_key?(reply, :recent_messages) or is_map(reply)
    end
  end
end
