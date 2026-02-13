defmodule CGraphWeb.API.V1.FriendSuggestionControllerTest do
  @moduledoc """
  Tests for friend suggestion endpoints.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/friends/suggestions" do
    test "returns friend suggestions for authenticated user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/friends/suggestions")
      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/friends/suggestions")
      assert json_response(conn, 401)
    end
  end
end
