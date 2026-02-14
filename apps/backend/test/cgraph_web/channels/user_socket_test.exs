defmodule CGraphWeb.UserSocketTest do
  use CgraphWeb.ChannelCase

  alias CGraphWeb.UserSocket
  import CgraphWeb.UserFixtures

  describe "connect/3" do
    test "authenticates with valid token" do
      user = user_fixture()
      {:ok, token, _claims} = CGraph.Guardian.encode_and_sign(user)

      assert {:ok, socket} = connect(UserSocket, %{"token" => token}, connect_info: %{})

      assert socket.assigns.current_user.id == user.id
    end

    test "rejects connection without token" do
      assert :error = connect(UserSocket, %{}, connect_info: %{x_headers: []})
    end

    test "rejects connection with invalid token" do
      assert :error = connect(UserSocket, %{}, connect_info: %{
        x_headers: [{"authorization", "Bearer invalid-token"}]
      })
    end
  end
end
