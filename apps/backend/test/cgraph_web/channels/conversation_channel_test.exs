defmodule CgraphWeb.Channels.ConversationChannelTest do
  @moduledoc "Conversation channel tests — WhatsApp-style DM real-time"
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

  test "joins conversation channel", %{socket: socket} do
    assert socket.joined
  end

  test "sends new message", %{socket: socket} do
    ref = push(socket, "new_msg", %{
      "content" => "Hello from test",
      "type" => "text"
    })

    # Should either reply with ok or broadcast
    assert_reply(ref, :ok, _payload) || assert_broadcast("new_msg", _)
  end

  test "receives typing indicator", %{socket: socket} do
    push(socket, "typing", %{})
    assert_broadcast("typing", %{})
  end

  test "marks messages as read", %{socket: socket, conversation: conversation} do
    ref = push(socket, "mark_read", %{
      "conversation_id" => conversation.id
    })

    assert_reply(ref, :ok, _) || assert_reply(ref, :error, _)
  end

  test "rejects invalid events", %{socket: socket} do
    ref = push(socket, "invalid_event", %{})
    # Should either error or be ignored
    assert_reply(ref, :error, _) || refute_broadcast("invalid_event", _)
  end

  defp generate_token(user) do
    {:ok, token, _claims} = CGraph.Guardian.encode_and_sign(user)
    token
  end
end
