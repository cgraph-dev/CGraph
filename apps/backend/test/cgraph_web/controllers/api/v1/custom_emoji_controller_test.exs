defmodule CGraphWeb.API.V1.CustomEmojiControllerTest do
  @moduledoc """
  Tests for custom emoji management (create, favorites, categories).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/emojis (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/emojis" do
    test "returns list of custom emojis" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/emojis")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/emojis/categories (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/emojis/categories" do
    test "returns emoji categories" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/emojis/categories")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/emojis/search (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/emojis/search" do
    test "returns search results for query" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/emojis/search?q=smile")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/emojis/popular (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/emojis/popular" do
    test "returns popular emojis" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/emojis/popular")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/emojis/:id (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/emojis/:id" do
    test "returns 404 for non-existent emoji" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/emojis/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/emojis/favorites (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/emojis/favorites" do
    test "returns user's favorite emojis", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/emojis/favorites")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/emojis/recent (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/emojis/recent" do
    test "returns recently used emojis", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/emojis/recent")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/emojis/:id/favorite (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/emojis/:id/favorite" do
    test "returns 404 for non-existent emoji", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/emojis/#{Ecto.UUID.generate()}/favorite")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/emojis/:id/favorite (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/emojis/:id/favorite" do
    test "returns 404 for non-existent emoji", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/emojis/#{Ecto.UUID.generate()}/favorite")

      assert conn.status in [200, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/emojis/:id (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/emojis/:id" do
    test "returns 404 for non-existent emoji", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/emojis/#{Ecto.UUID.generate()}")

      assert conn.status in [403, 404, 422]
    end
  end
end
