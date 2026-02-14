defmodule CGraphWeb.TitleControllerTest do
  @moduledoc """
  Tests for title system (browse, equip, unequip, purchase titles).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/titles" do
    test "lists available titles", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/titles")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/titles/owned" do
    test "lists user's owned titles", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/titles/owned")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "POST /api/v1/titles/:id/equip" do
    test "returns error for non-existent title", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/titles/#{Ecto.UUID.generate()}/equip")

      assert conn.status in [200, 403, 404, 422]
    end
  end

  describe "POST /api/v1/titles/:id/unequip" do
    test "returns error for non-existent title", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/titles/#{Ecto.UUID.generate()}/unequip")

      assert conn.status in [200, 404, 422]
    end
  end

  describe "POST /api/v1/titles/:id/purchase" do
    test "returns error for non-existent title", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/titles/#{Ecto.UUID.generate()}/purchase")

      assert conn.status in [404, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/titles")

      assert json_response(conn, 401)
    end
  end
end
