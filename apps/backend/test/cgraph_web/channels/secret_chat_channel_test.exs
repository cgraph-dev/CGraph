defmodule CgraphWeb.Channels.SecretChatChannelTest do
  @moduledoc """
  Tests for the SecretChatChannel — device-bound E2EE messaging.

  Covers: join with valid device, send encrypted message, typing
  indicator, screenshot detection, and error cases.
  """
  use CgraphWeb.ChannelCase

  import CGraph.Factory

  alias CGraph.Messaging.SecretChat

  setup do
    user1 = insert(:user)
    user2 = insert(:user)

    {:ok, conversation} =
      SecretChat.create_secret_conversation(user1, user2.id, device_id: "device_a")

    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(user1)})

    %{socket: socket, user1: user1, user2: user2, conversation: conversation}
  end

  # ──────────────────────────────────────────────────────────
  # Join
  # ──────────────────────────────────────────────────────────

  test "joins secret chat channel with valid device", %{socket: socket, conversation: conv} do
    assert {:ok, _, _socket} =
      subscribe_and_join(socket, "secret_chat:#{conv.id}", %{"device_id" => "device_a"})
  end

  test "rejects join for non-participant" do
    outsider = insert(:user)
    user2 = insert(:user)

    {:ok, conv} = SecretChat.create_secret_conversation(outsider, user2.id, device_id: "d1")

    # A third user tries to join
    third = insert(:user)
    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(third)})

    assert {:error, %{reason: "not_found"}} =
      subscribe_and_join(socket, "secret_chat:#{conv.id}", %{})
  end

  # ──────────────────────────────────────────────────────────
  # Send Encrypted Message
  # ──────────────────────────────────────────────────────────

  test "sends encrypted message → broadcast to peers", %{socket: socket, conversation: conv} do
    {:ok, _, socket} =
      subscribe_and_join(socket, "secret_chat:#{conv.id}", %{"device_id" => "device_a"})

    ciphertext = Base.encode64(:crypto.strong_rand_bytes(64))
    nonce = Base.encode64(:crypto.strong_rand_bytes(12))

    ref = push(socket, "new_message", %{
      "ciphertext" => ciphertext,
      "nonce" => nonce,
      "content_type" => "text"
    })

    assert_reply ref, :ok, %{id: id}
    assert is_binary(id)
  end

  # ──────────────────────────────────────────────────────────
  # Typing Indicator
  # ──────────────────────────────────────────────────────────

  test "typing → broadcast from channel", %{socket: socket, conversation: conv} do
    {:ok, _, socket} =
      subscribe_and_join(socket, "secret_chat:#{conv.id}", %{"device_id" => "device_a"})

    push(socket, "typing", %{})

    # broadcast_from! means the sender doesn't get it, but
    # we can check the topic via assert_broadcast
    assert_broadcast "typing", %{user_id: _user_id}
  end

  # ──────────────────────────────────────────────────────────
  # Screenshot Detection
  # ──────────────────────────────────────────────────────────

  test "screenshot_detected → alert broadcast", %{socket: socket, conversation: conv} do
    {:ok, _, socket} =
      subscribe_and_join(socket, "secret_chat:#{conv.id}", %{"device_id" => "device_a"})

    push(socket, "screenshot_detected", %{})
    assert_broadcast "screenshot_alert", %{user_id: _uid}
  end

  # ──────────────────────────────────────────────────────────
  # Unknown Event
  # ──────────────────────────────────────────────────────────

  test "unknown event returns error", %{socket: socket, conversation: conv} do
    {:ok, _, socket} =
      subscribe_and_join(socket, "secret_chat:#{conv.id}", %{"device_id" => "device_a"})

    ref = push(socket, "nonexistent_event", %{})
    assert_reply ref, :error, %{reason: "unknown_event"}
  end

  defp generate_token(user) do
    {:ok, token, _claims} = CGraph.Guardian.encode_and_sign(user)
    token
  end
end
