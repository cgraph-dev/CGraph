defmodule CgraphWeb.API.V1.SearchControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/search" do
    test "requires minimum query length", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search?q=a")

      assert %{"error" => "Query must be at least 2 characters"} =
               json_response(conn, 400)
    end

    test "returns results for valid query", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search?q=test")

      assert response = json_response(conn, 200)
      assert is_map(response)
    end

    test "accepts type filter", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search?q=test&types=users,groups")

      assert json_response(conn, 200)
    end

    test "accepts limit parameter", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search?q=test&limit=5")

      assert json_response(conn, 200)
    end

    test "clamps limit to max value", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search?q=test&limit=999")

      assert json_response(conn, 200)
    end

    test "defaults to all types when types=all", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search?q=test&types=all")

      assert json_response(conn, 200)
    end
  end

  describe "GET /api/v1/search/users" do
    test "requires minimum query length", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/users?q=a")

      assert %{"error" => "Query must be at least 2 characters"} =
               json_response(conn, 400)
    end

    test "returns paginated user results", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/users?q=test")

      assert json_response(conn, 200)
    end

    test "accepts pagination params", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/users?q=test&page=1&per_page=10")

      assert json_response(conn, 200)
    end
  end

  describe "GET /api/v1/search/messages" do
    test "requires minimum query length", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/messages?q=a")

      assert %{"error" => "Query must be at least 2 characters"} =
               json_response(conn, 400)
    end

    test "returns message results", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/messages?q=hello")

      assert json_response(conn, 200)
    end

    test "accepts filter parameters", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/messages?q=hello&has_attachment=true")

      assert json_response(conn, 200)
    end
  end

  describe "GET /api/v1/search/posts" do
    test "requires minimum query length", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/posts?q=a")

      assert %{"error" => "Query must be at least 2 characters"} =
               json_response(conn, 400)
    end

    test "returns post results", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/posts?q=elixir")

      assert json_response(conn, 200)
    end

    test "accepts sort parameter", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/posts?q=elixir&sort=new")

      assert json_response(conn, 200)
    end
  end

  describe "GET /api/v1/search/groups" do
    test "requires minimum query length", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/groups?q=a")

      assert %{"error" => "Query must be at least 2 characters"} =
               json_response(conn, 400)
    end

    test "returns group results", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/groups?q=gaming")

      assert json_response(conn, 200)
    end
  end

  describe "GET /api/v1/search/suggestions" do
    test "returns empty for empty query", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/suggestions?q=")

      assert json_response(conn, 200)
    end

    test "returns suggestions for valid query", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/suggestions?q=test")

      assert json_response(conn, 200)
    end
  end

  describe "GET /api/v1/search/recent" do
    test "returns recent searches", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/recent")

      assert json_response(conn, 200)
    end
  end

  describe "DELETE /api/v1/search/recent" do
    test "clears search history", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/search/recent")

      assert response(conn, 204)
    end
  end

  describe "authentication" do
    test "returns 401 without auth token" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/search?q=test")

      assert json_response(conn, 401)
    end
  end
end
