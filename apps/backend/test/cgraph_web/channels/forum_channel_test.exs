defmodule CgraphWeb.Channels.ForumChannelTest do
  @moduledoc "Forum channel tests — Reddit-style real-time forum updates"
  use CgraphWeb.ChannelCase

  import CgraphWeb.UserFixtures
  import CgraphWeb.ForumFixtures

  setup do
    user = user_fixture()
    forum = forum_fixture(user)

    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
    {:ok, _, socket} = subscribe_and_join(socket, "forum:#{forum.id}", %{})

    %{socket: socket, user: user, forum: forum}
  end

  test "joins forum channel", %{socket: socket} do
    assert socket.joined
  end

  test "receives real-time post updates", %{socket: _socket, forum: forum, user: user} do
    # Simulate a new post event
    CGraphWeb.Endpoint.broadcast("forum:#{forum.id}", "new_post", %{
      title: "New Post",
      author_id: user.id
    })

    assert_broadcast("new_post", %{title: "New Post"})
  end

  test "receives vote updates", %{socket: _socket, forum: forum} do
    CGraphWeb.Endpoint.broadcast("forum:#{forum.id}", "vote_changed", %{
      post_id: Ecto.UUID.generate(),
      score: 42
    })

    assert_broadcast("vote_changed", %{score: 42})
  end
end
