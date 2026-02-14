defmodule CgraphWeb.Channels.GroupChannelTest do
  @moduledoc "Group channel tests — Group real-time"
  use CgraphWeb.ChannelCase

  import CgraphWeb.UserFixtures
  import CgraphWeb.GroupFixtures

  alias CGraph.Groups

  setup do
    user = user_fixture()
    %{group: group} = group_fixture(user)
    channel = channel_fixture(group)

    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
    {:ok, _, socket} = subscribe_and_join(socket, "group:#{channel.id}", %{})

    %{socket: socket, user: user, group: group, channel: channel}
  end

  test "joins group channel as member", %{socket: socket} do
    assert socket.joined
  end

  test "sends message to group", %{socket: socket} do
    ref = push(socket, "new_message", %{
      "content" => "Hello group!",
      "type" => "text"
    })

    assert_reply(ref, :ok, _) || assert_broadcast("new_message", _)
  end

  test "typing indicator broadcasts", %{socket: socket} do
    push(socket, "typing", %{})
    assert_broadcast("typing", %{})
  end

  test "non-member cannot join", %{channel: channel} do
    outsider = user_fixture()
    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(outsider)})

    result = subscribe_and_join(socket, "group:#{channel.id}", %{})
    assert {:error, _} = result
  end

  defp generate_token(user) do
    {:ok, token, _claims} = CGraph.Guardian.encode_and_sign(user)
    token
  end
end
