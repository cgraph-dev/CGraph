defmodule CGraphWeb.API.V1.GifControllerTest do
  @moduledoc """
  Tests for GIF search and trending endpoints (Tenor API proxy).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/gifs/search
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/gifs/search" do
    test "returns GIF results for valid query", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gifs/search?q=happy")

      assert response = json_response(conn, 200)
      assert Map.has_key?(response, "gifs")
      assert is_list(response["gifs"])
    end

    test "accepts limit param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gifs/search?q=test&limit=10")

      assert json_response(conn, 200)
    end

    test "accepts pagination pos param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gifs/search?q=test&pos=CAgQAhog")

      assert json_response(conn, 200)
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/gifs/search?q=happy")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/gifs/trending
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/gifs/trending" do
    test "returns trending GIFs", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gifs/trending")

      assert response = json_response(conn, 200)
      assert Map.has_key?(response, "gifs")
      assert is_list(response["gifs"])
    end

    test "accepts limit param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gifs/trending?limit=5")

      assert json_response(conn, 200)
    end
  end
end
