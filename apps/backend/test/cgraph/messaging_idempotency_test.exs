defmodule Cgraph.MessagingIdempotencyTest do
  @moduledoc """
  Tests for message idempotency to prevent duplicate messages on network retry.
  """
  use Cgraph.DataCase, async: true

  alias Cgraph.Messaging
  alias Cgraph.Accounts

  describe "message idempotency" do
    setup do
      # Create two users with proper validation-compliant credentials
      unique = abs(System.unique_integer())
      {:ok, user1} = Accounts.create_user(%{
        email: "sender_#{unique}@test.com",
        password: "Password123!",
        username: "sender_#{unique}"
      })

      unique2 = abs(System.unique_integer())
      {:ok, user2} = Accounts.create_user(%{
        email: "receiver_#{unique2}@test.com",
        password: "Password123!",
        username: "receiver_#{unique2}"
      })

      # Create conversation - function expects user struct and list of participant IDs
      {:ok, conversation, _} = Messaging.create_or_get_conversation(user1, [user2.id])

      %{user1: user1, user2: user2, conversation: conversation}
    end

    test "creates message with client_message_id", %{user1: user, conversation: conv} do
      client_id = Ecto.UUID.generate()

      {:ok, message} = Messaging.create_message(user, conv, %{
        "content" => "Hello!",
        "client_message_id" => client_id
      })

      assert message.client_message_id == client_id
      assert message.content == "Hello!"
    end

    test "returns existing message when same client_message_id is sent twice", %{user1: user, conversation: conv} do
      client_id = Ecto.UUID.generate()

      # First send
      {:ok, message1} = Messaging.create_message(user, conv, %{
        "content" => "Hello!",
        "client_message_id" => client_id
      })

      # Retry with same client_message_id (simulating network retry)
      {:ok, message2} = Messaging.create_message(user, conv, %{
        "content" => "Hello!",
        "client_message_id" => client_id
      })

      # Should return the same message, not create a duplicate
      assert message1.id == message2.id
    end

    test "creates different messages with different client_message_ids", %{user1: user, conversation: conv} do
      {:ok, message1} = Messaging.create_message(user, conv, %{
        "content" => "First message",
        "client_message_id" => Ecto.UUID.generate()
      })

      {:ok, message2} = Messaging.create_message(user, conv, %{
        "content" => "Second message",
        "client_message_id" => Ecto.UUID.generate()
      })

      assert message1.id != message2.id
      assert message1.content == "First message"
      assert message2.content == "Second message"
    end

    test "creates message without client_message_id (backwards compatible)", %{user1: user, conversation: conv} do
      {:ok, message} = Messaging.create_message(user, conv, %{
        "content" => "Hello without idempotency!"
      })

      assert message.client_message_id == nil
      assert message.content == "Hello without idempotency!"
    end

    test "same client_message_id can be used in different conversations", %{user1: user1, user2: user2} do
      # Create two different conversations
      unique3 = abs(System.unique_integer())
      {:ok, user3} = Accounts.create_user(%{
        email: "third_#{unique3}@test.com",
        password: "Password123!",
        username: "third_#{unique3}"
      })

      {:ok, conv1, _} = Messaging.create_or_get_conversation(user1, [user2.id])
      {:ok, conv2, _} = Messaging.create_or_get_conversation(user1, [user3.id])

      client_id = Ecto.UUID.generate()

      # Same client_message_id in different conversations should work
      {:ok, message1} = Messaging.create_message(user1, conv1, %{
        "content" => "Hello conv1!",
        "client_message_id" => client_id
      })

      {:ok, message2} = Messaging.create_message(user1, conv2, %{
        "content" => "Hello conv2!",
        "client_message_id" => client_id
      })

      # Different messages in different conversations
      assert message1.id != message2.id
      assert message1.conversation_id == conv1.id
      assert message2.conversation_id == conv2.id
    end

    test "idempotency returns preloaded message", %{user1: user, conversation: conv} do
      client_id = Ecto.UUID.generate()

      # First create
      {:ok, _} = Messaging.create_message(user, conv, %{
        "content" => "Hello!",
        "client_message_id" => client_id
      })

      # Idempotent retry should return preloaded message
      {:ok, message} = Messaging.create_message(user, conv, %{
        "content" => "Hello!",
        "client_message_id" => client_id
      })

      # Should have preloaded associations
      assert Ecto.assoc_loaded?(message.sender)
      assert Ecto.assoc_loaded?(message.reactions)
    end
  end
end
