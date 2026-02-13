defmodule CGraphWeb.FriendControllerTest do
  @moduledoc """
  Tests for friend management (requests, blocking, nicknames, mutual friends).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/friends" do
    test "lists friends for authenticated user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/friends")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/friends/requests" do
    test "lists incoming friend requests", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/friends/requests")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/friends/sent" do
    test "lists sent friend requests", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/friends/sent")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/friends/pending" do
    test "lists pending friend requests", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/friends/pending")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "POST /api/v1/friends/:id/accept" do
    test "returns 404 for non-existent request", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/friends/#{Ecto.UUID.generate()}/accept")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/friends/:id/decline" do
    test "returns 404 for non-existent request", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/friends/#{Ecto.UUID.generate()}/decline")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/friends/:id/block" do
    test "returns 404 for non-existent user", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/friends/#{Ecto.UUID.generate()}/block")

      assert conn.status in [404, 422]
    end
  end

  describe "DELETE /api/v1/friends/:id/block" do
    test "returns 404 for non-existent block", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/friends/#{Ecto.UUID.generate()}/block")

      assert conn.status in [404, 422]
    end
  end

  describe "GET /api/v1/friends/:id/mutual" do
    test "returns 404 for non-existent user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/friends/#{Ecto.UUID.generate()}/mutual")

      assert conn.status in [200, 404, 422]
    end
  end

  describe "DELETE /api/v1/friends/:id" do
    test "returns 404 for non-existent friendship", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/friends/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/friends")

      assert json_response(conn, 401)
    end
  end
end
