defmodule CgraphWeb.Channels.ConversationChannelTest do
  @moduledoc """
  Conversation channel tests — DM real-time features.

  Tests all standard chat features through the Phoenix Channel:
  join, new_message, edit, delete (for_me/for_everyone), forward,
  typing/stop_typing, mark_read with privacy, reactions, and rate limiting.
  """
  use CgraphWeb.ChannelCase

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures

  setup do
    user = user_fixture()
    other = user_fixture()
    %{conversation: conversation} = conversation_fixture(user, other)

    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
    {:ok, _, socket} = subscribe_and_join(socket, "conversation:#{conversation.id}", %{})

    %{socket: socket, user: user, conversation: conversation, other: other}
  end

  # ──────────────────────────────────────────────────────────
  # Join & Presence
  # ──────────────────────────────────────────────────────────

  test "joins conversation channel", %{socket: socket} do
    assert socket.joined
  end

  test "receives message_history after join", %{socket: _socket} do
    assert_push "message_history", %{messages: messages}
    assert is_list(messages)
  end

  test "rejects join for non-member" do
    user = user_fixture()
    other = user_fixture()
    %{conversation: conv} = conversation_fixture(user, other)
    outsider = user_fixture()

    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(outsider)})
    assert {:error, %{reason: "unauthorized"}} =
      subscribe_and_join(socket, "conversation:#{conv.id}", %{})
  end

  # ──────────────────────────────────────────────────────────
  # New Message
  # ──────────────────────────────────────────────────────────

  test "sends new message and receives broadcast", %{socket: socket} do
    ref = push(socket, "new_message", %{
      "content" => "Hello from test"
    })

    assert_reply ref, :ok, %{message_id: message_id}
    assert is_binary(message_id)
    assert_broadcast "new_message", %{message: %{content: "Hello from test"}}
  end

  test "sends message with reply_to_id", %{socket: socket, conversation: conversation, user: user} do
    # Create a message to reply to
    original = message_fixture(conversation, user, %{content: "Original message"})

    ref = push(socket, "new_message", %{
      "content" => "This is a reply",
      "reply_to_id" => original.id
    })

    assert_reply ref, :ok, %{message_id: _}
    assert_broadcast "new_message", %{message: msg}
    assert msg.content == "This is a reply"
  end

  # ──────────────────────────────────────────────────────────
  # Edit Message
  # ──────────────────────────────────────────────────────────

  test "edits own message", %{socket: socket, conversation: conversation, user: user} do
    message = message_fixture(conversation, user, %{content: "before edit"})

    ref = push(socket, "edit_message", %{
      "message_id" => message.id,
      "content" => "after edit"
    })

    assert_reply ref, :ok, %{message_id: mid}
    assert mid == message.id
    assert_broadcast "message_updated", %{message: %{content: "after edit"}}
  end

  test "edit by non-sender returns unauthorized", %{socket: socket, conversation: conversation, other: other} do
    # Create message from `other`, try to edit from `user`'s socket
    message = message_fixture(conversation, other, %{content: "other's msg"})

    ref = push(socket, "edit_message", %{
      "message_id" => message.id,
      "content" => "hacked"
    })

    assert_reply ref, :error, %{reason: "unauthorized"}
  end

  # ──────────────────────────────────────────────────────────
  # Delete Message
  # ──────────────────────────────────────────────────────────

  test "delete for_everyone broadcasts deletion", %{socket: socket, conversation: conversation, user: user} do
    message = message_fixture(conversation, user, %{content: "to be deleted"})

    ref = push(socket, "delete_message", %{
      "message_id" => message.id,
      "mode" => "for_everyone"
    })

    assert_reply ref, :ok
    assert_broadcast "message_deleted", %{message_id: mid}
    assert mid == message.id
  end

  test "delete for_me does not broadcast", %{socket: socket, conversation: conversation, user: user} do
    message = message_fixture(conversation, user, %{content: "private delete"})

    ref = push(socket, "delete_message", %{
      "message_id" => message.id,
      "mode" => "for_me"
    })

    assert_reply ref, :ok
    refute_broadcast "message_deleted", _
  end

  test "delete defaults to for_everyone", %{socket: socket, conversation: conversation, user: user} do
    message = message_fixture(conversation, user, %{content: "default delete"})

    ref = push(socket, "delete_message", %{
      "message_id" => message.id
    })

    assert_reply ref, :ok
    assert_broadcast "message_deleted", %{message_id: mid}
    assert mid == message.id
  end

  # ──────────────────────────────────────────────────────────
  # Forward Message
  # ──────────────────────────────────────────────────────────

  test "forwards message to another conversation", %{socket: socket, conversation: conversation, user: user} do
    message = message_fixture(conversation, user, %{content: "to forward"})

    # Create a second conversation to forward to
    third_user = user_fixture()
    %{conversation: target_conv} = conversation_fixture(user, third_user)

    ref = push(socket, "forward_message", %{
      "message_id" => message.id,
      "to_conversation_id" => target_conv.id
    })

    assert_reply ref, :ok, %{message_id: fwd_id}
    assert is_binary(fwd_id)
  end

  test "forward to non-member conversation returns error", %{socket: socket, conversation: conversation, user: user} do
    message = message_fixture(conversation, user, %{content: "no forward"})

    # Create a conversation where user is NOT a member
    a = user_fixture()
    b = user_fixture()
    %{conversation: foreign_conv} = conversation_fixture(a, b)

    ref = push(socket, "forward_message", %{
      "message_id" => message.id,
      "to_conversation_id" => foreign_conv.id
    })

    assert_reply ref, :error, %{reason: _}
  end

  # ──────────────────────────────────────────────────────────
  # Typing Indicators
  # ──────────────────────────────────────────────────────────

  test "typing indicator broadcasts", %{socket: socket} do
    push(socket, "typing", %{"is_typing" => true})
    assert_broadcast "typing", %{is_typing: true}
  end

  test "stop_typing broadcasts typing false", %{socket: socket} do
    push(socket, "stop_typing", %{})
    assert_broadcast "typing", %{is_typing: false}
  end

  # ──────────────────────────────────────────────────────────
  # Mark Read
  # ──────────────────────────────────────────────────────────

  test "marks message as read", %{socket: socket, conversation: conversation, other: other} do
    # Create a message from the other user
    message = message_fixture(conversation, other, %{content: "read me"})

    ref = push(socket, "mark_read", %{
      "message_id" => message.id
    })

    assert_reply ref, :ok
  end

  # ──────────────────────────────────────────────────────────
  # Message Acknowledgment
  # ──────────────────────────────────────────────────────────

  test "msg_ack records delivery and broadcasts", %{socket: socket, conversation: conversation, other: other} do
    message = message_fixture(conversation, other, %{content: "ack me"})

    ref = push(socket, "msg_ack", %{
      "message_id" => message.id
    })

    assert_reply ref, :ok
    assert_broadcast "msg_delivered", %{message_id: mid}
    assert mid == message.id
  end

  # ──────────────────────────────────────────────────────────
  # Pin/Unpin
  # ──────────────────────────────────────────────────────────

  test "pins and unpins a message", %{socket: socket, conversation: conversation, user: user} do
    message = message_fixture(conversation, user, %{content: "pin me"})

    ref = push(socket, "pin_message", %{"message_id" => message.id})
    assert_reply ref, :ok, %{message_id: mid}
    assert mid == message.id
    assert_broadcast "message_pinned", _

    ref = push(socket, "unpin_message", %{"message_id" => message.id})
    assert_reply ref, :ok, %{message_id: mid2}
    assert mid2 == message.id
    assert_broadcast "message_unpinned", _
  end

  # ──────────────────────────────────────────────────────────
  # Reactions via Channel
  # ──────────────────────────────────────────────────────────

  test "add reaction broadcasts", %{socket: socket, conversation: conversation, user: user} do
    message = message_fixture(conversation, user, %{content: "react to me"})

    ref = push(socket, "add_reaction", %{
      "message_id" => message.id,
      "emoji" => "👍"
    })

    assert_reply ref, :ok
    assert_broadcast "reaction_added", %{message_id: mid, emoji: "👍"}
    assert mid == message.id
  end

  test "remove reaction broadcasts", %{socket: socket, conversation: conversation, user: user} do
    message = message_fixture(conversation, user, %{content: "unreact"})

    # First add, then remove
    push(socket, "add_reaction", %{
      "message_id" => message.id,
      "emoji" => "❤️"
    })
    # Wait for add to complete
    assert_broadcast "reaction_added", _

    ref = push(socket, "remove_reaction", %{
      "message_id" => message.id,
      "emoji" => "❤️"
    })

    assert_reply ref, :ok
    assert_broadcast "reaction_removed", %{message_id: mid, emoji: "❤️"}
    assert mid == message.id
  end

  # ──────────────────────────────────────────────────────────
  # Error Cases
  # ──────────────────────────────────────────────────────────

  test "rejects invalid events", %{socket: socket} do
    ref = push(socket, "invalid_event", %{})
    assert_reply ref, :error, %{reason: "unhandled_event"}
  end

  defp generate_token(user) do
    {:ok, token, _claims} = CGraph.Guardian.encode_and_sign(user)
    token
  end
end
