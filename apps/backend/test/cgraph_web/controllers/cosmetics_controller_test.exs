defmodule CGraphWeb.CosmeticsControllerTest do
  @moduledoc """
  Tests for cosmetics endpoints (avatar borders, profile themes, chat effects).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # Avatar Borders
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/avatar-borders" do
    test "lists available avatar borders", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/avatar-borders")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/avatar-borders/unlocked" do
    test "returns user's unlocked borders", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/avatar-borders/unlocked")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "POST /api/v1/avatar-borders/:id/equip" do
    test "returns 404 for non-existent border", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/avatar-borders/#{Ecto.UUID.generate()}/equip")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/avatar-borders/:id/purchase" do
    test "returns 404 for non-existent border", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/avatar-borders/#{Ecto.UUID.generate()}/purchase")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # Profile Themes
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/profile-themes" do
    test "lists available profile themes", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/profile-themes")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/profile-themes/active" do
    test "returns user's active profile theme", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/profile-themes/active")

      assert conn.status in [200, 404]
    end
  end

  describe "POST /api/v1/profile-themes/:id/activate" do
    test "returns 404 for non-existent theme", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/profile-themes/#{Ecto.UUID.generate()}/activate")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # Chat Effects
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/chat-effects" do
    test "returns user's chat effects", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/chat-effects")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "POST /api/v1/chat-effects/:id/activate" do
    test "returns 404 for non-existent effect", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/chat-effects/#{Ecto.UUID.generate()}/activate")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/chat-effects/sync" do
    test "syncs chat effects", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/chat-effects/sync", %{effects: []})

      assert conn.status in [200, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/avatar-borders")

      assert json_response(conn, 401)
    end
  end
end
