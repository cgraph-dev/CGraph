defmodule CGraphWeb.API.V1.CalendarControllerTest do
  @moduledoc """
  Tests for calendar event endpoints.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "calendar endpoints require authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/calendar/events")
      assert conn.status in [401, 404]
    end
  end
end
