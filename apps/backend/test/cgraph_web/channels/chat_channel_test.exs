defmodule CgraphWeb.ChatChannelTest do
  use CgraphWeb.ChannelCase

  import CgraphWeb.UserFixtures

  setup do
    user = user_fixture()
    {:ok, token, _claims} = Cgraph.Guardian.encode_and_sign(user)
    %{user: user, token: token}
  end

  describe "join/3" do
    @tag :skip
    test "joins conversation channel the user belongs to", %{user: _user, token: _token} do
      # TODO: Create conversation fixture
      # {:ok, _, socket} = socket(CgraphWeb.UserSocket, "user:#{user.id}", %{current_user: user})
      # |> subscribe_and_join(CgraphWeb.ChatChannel, "chat:#{conversation.id}")
      #
      # assert_push "presence_state", _
    end

    @tag :skip
    test "rejects join for conversation user doesn't belong to", %{user: _user} do
      # {:ok, _, socket} = socket(CgraphWeb.UserSocket, "user:#{user.id}", %{current_user: user})
      # assert {:error, %{reason: "unauthorized"}} =
      #   subscribe_and_join(socket, CgraphWeb.ChatChannel, "chat:nonexistent")
    end
  end

  describe "handle_in/3" do
    @tag :skip
    test "new_message broadcasts to channel" do
      # TODO: Set up joined socket
      # ref = push(socket, "new_message", %{"body" => "Hello!"})
      # assert_reply ref, :ok, _
      # assert_broadcast "new_message", %{body: "Hello!"}
    end

    @tag :skip
    test "typing broadcasts typing indicator" do
      # push(socket, "typing", %{})
      # assert_broadcast "typing", %{user_id: _}
    end
  end
end
