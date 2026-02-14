defmodule CgraphWeb.API.V1.PmControllerTest do
  @moduledoc "Private message controller tests — DM-style"
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures

  describe "GET /api/v1/conversations" do
    setup %{conn: conn} do
      user = user_fixture()
      other1 = user_fixture()
      other2 = user_fixture()
      %{conversation: conv1} = conversation_fixture(user, other1)
      %{conversation: conv2} = conversation_fixture(user, other2)
      conn = log_in_user(conn, user)
      %{conn: conn, user: user, conversations: [conv1, conv2]}
    end

    test "lists user's conversations", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/conversations")
      assert %{"data" => conversations} = json_response(conn, 200)
      assert is_list(conversations)
      assert length(conversations) >= 2
    end

    test "requires authentication" do
      conn = build_conn() |> put_req_header("accept", "application/json")
      conn = get(conn, ~p"/api/v1/conversations")
      assert json_response(conn, 401)
    end
  end

  describe "POST /api/v1/pms" do
    setup %{conn: conn} do
      user = user_fixture()
      recipient = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user, recipient: recipient}
    end

    test "sends a private message", %{conn: conn, recipient: recipient} do
      conn = post(conn, ~p"/api/v1/pms", %{
        recipient_id: recipient.id,
        content: "Hello, this is a DM!"
      })
      assert conn.status in [200, 201]
    end

    test "rejects empty message", %{conn: conn, recipient: recipient} do
      conn = post(conn, ~p"/api/v1/pms", %{
        recipient_id: recipient.id,
        content: ""
      })
      assert conn.status in [400, 422]
    end

    test "rejects message to non-existent user", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/pms", %{
        recipient_id: Ecto.UUID.generate(),
        content: "Hello ghost"
      })
      assert conn.status in [404, 422]
    end
  end
end
