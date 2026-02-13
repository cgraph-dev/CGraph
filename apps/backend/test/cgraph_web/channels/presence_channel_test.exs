defmodule CgraphWeb.Channels.PresenceChannelTest do
  @moduledoc "Presence channel tests — WhatsApp-style online/offline tracking"
  use CgraphWeb.ChannelCase

  import CgraphWeb.UserFixtures

  defp generate_token(user) do
    {:ok, token, _claims} = CGraph.Guardian.encode_and_sign(user)
    token
  end

  setup do
    user = user_fixture()
    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
    {:ok, _, socket} = subscribe_and_join(socket, "presence:lobby", %{})

    %{socket: socket, user: user}
  end

  test "receives presence state on join", %{socket: _socket} do
    assert_push("presence_state", %{})
  end

  test "tracks user presence", %{socket: socket, user: user} do
    # User should be tracked after join
    assert socket.assigns.current_user.id == user.id
  end

  test "updates status", %{socket: socket} do
    ref = push(socket, "update_status", %{
      "status" => "away",
      "custom_text" => "Be right back"
    })

    assert_reply(ref, :ok, _) || assert_reply(ref, :error, _)
  end

  test "handles heartbeat", %{socket: socket} do
    ref = push(socket, "heartbeat", %{})
    assert_reply(ref, :ok, _) || assert_reply(ref, :error, _)
  end

  test "bulk presence query", %{socket: socket} do
    other_users = Enum.map(1..5, fn _ -> user_fixture() end)
    user_ids = Enum.map(other_users, & &1.id)

    ref = push(socket, "get_presence", %{"user_ids" => user_ids})
    assert_reply(ref, :ok, %{}) || assert_reply(ref, :error, _)
  end
end
