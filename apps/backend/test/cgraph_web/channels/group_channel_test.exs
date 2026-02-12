defmodule CgraphWeb.Channels.GroupChannelTest do
  @moduledoc "Group channel tests — Discord-style guild real-time"
  use CgraphWeb.ChannelCase

  import CgraphWeb.UserFixtures
  import CgraphWeb.GroupFixtures

  setup do
    user = user_fixture()
    group = group_fixture(user)

    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
    {:ok, _, socket} = subscribe_and_join(socket, "group:#{group.id}", %{})

    %{socket: socket, user: user, group: group}
  end

  test "joins group channel as member", %{socket: socket} do
    assert socket.joined
  end

  test "sends message to group", %{socket: socket} do
    ref = push(socket, "new_msg", %{
      "content" => "Hello group!",
      "type" => "text"
    })

    assert_reply(ref, :ok, _) || assert_broadcast("new_msg", _)
  end

  test "typing indicator broadcasts", %{socket: socket} do
    push(socket, "typing", %{})
    assert_broadcast("typing", %{})
  end

  test "non-member cannot join", %{group: group} do
    outsider = user_fixture()
    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(outsider)})

    result = subscribe_and_join(socket, "group:#{group.id}", %{})
    assert {:error, _} = result
  end
end
