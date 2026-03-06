defmodule CGraphWeb.API.V1.EmojiControllerTest do
  @moduledoc """
  Tests for the Unicode emoji catalog controller.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/unicode-emojis
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/unicode-emojis (categories)" do
    test "returns all categories with emojis", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/unicode-emojis")
      assert %{"categories" => categories, "total" => total} = json_response(conn, 200)
      assert is_list(categories)
      assert length(categories) >= 8
      assert total >= 200

      # Each category has expected shape
      first = hd(categories)
      assert Map.has_key?(first, "category")
      assert Map.has_key?(first, "emojis")
      assert is_list(first["emojis"])
      assert length(first["emojis"]) > 0

      # Emoji entries have expected fields
      emoji = hd(first["emojis"])
      assert Map.has_key?(emoji, "emoji")
      assert Map.has_key?(emoji, "name")
      assert Map.has_key?(emoji, "category")
      assert Map.has_key?(emoji, "keywords")
      assert Map.has_key?(emoji, "skin_tone_support")
    end

    test "returns 401 when unauthenticated" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/unicode-emojis")
      assert conn.status in [401, 403]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/unicode-emojis/search
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/unicode-emojis/search" do
    test "searches emojis by name", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/unicode-emojis/search?q=heart")
      assert %{"results" => results, "query" => "heart", "count" => count} =
               json_response(conn, 200)

      assert count > 0
      assert length(results) == count
    end

    test "returns empty for no match", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/unicode-emojis/search?q=zzznonexistentzzzxyz")
      assert %{"results" => [], "query" => "zzznonexistentzzzxyz"} = json_response(conn, 200)
    end

    test "respects limit parameter", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/unicode-emojis/search?q=face&limit=3")
      assert %{"results" => results} = json_response(conn, 200)
      assert length(results) <= 3
    end

    test "filters by category", %{conn: conn} do
      conn =
        get(conn, ~p"/api/v1/unicode-emojis/search?q=dog&category=Animals+%26+Nature")

      assert %{"results" => results} = json_response(conn, 200)
      assert length(results) > 0
      assert Enum.all?(results, &(&1["category"] == "Animals & Nature"))
    end

    test "returns empty for empty query", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/unicode-emojis/search?q=")
      assert %{"results" => []} = json_response(conn, 200)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/unicode-emojis/trending
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/unicode-emojis/trending" do
    test "returns trending list (may be empty with no reactions)", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/unicode-emojis/trending")
      assert %{"trending" => trending} = json_response(conn, 200)
      assert is_list(trending)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/unicode-emojis/category/:name
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/unicode-emojis/category/:name" do
    test "returns emojis for valid category", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/unicode-emojis/category/Activities")

      assert %{"category" => "Activities", "emojis" => emojis, "count" => count} =
               json_response(conn, 200)

      assert count > 0
      assert length(emojis) == count
    end

    test "returns 404 for unknown category", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/unicode-emojis/category/Nonexistent")

      assert %{"error" => "Category not found", "available" => _} =
               json_response(conn, 404)
    end

    test "handles URL-encoded category names with spaces", %{conn: conn} do
      conn = get(conn, "/api/v1/unicode-emojis/category/Smileys%20%26%20Emotion")

      assert %{"category" => "Smileys & Emotion", "emojis" => emojis} =
               json_response(conn, 200)

      assert length(emojis) > 0
    end
  end
end
